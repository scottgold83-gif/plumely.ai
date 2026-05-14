"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Download,
  LampCeiling,
  LampWallUp,
  Lightbulb,
  Loader2,
  LogOut,
  Plus,
  RefreshCcw,
  Send,
  Sparkles,
  X,
  type LucideIcon,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Logo } from "@/components/Logo";

type GenerationStatus =
  | "idle"
  | "uploading"
  | "queued"
  | "running"
  | "succeeded"
  | "failed";

type LightType =
  | ""
  | "ceiling"
  | "wall"
  | "hanging"
  | "chandelier"
  | "outdoor";

type LightMeta = {
  name: string;
  brand: string;
  sku: string;
  type: LightType;
};

const LIGHT_TYPES: {
  value: Exclude<LightType, "">;
  label: string;
  Icon: LucideIcon;
}[] = [
  { value: "ceiling", label: "Ceiling", Icon: LampCeiling },
  { value: "wall", label: "Wall", Icon: LampWallUp },
  { value: "hanging", label: "Pendant", Icon: Lightbulb },
  { value: "chandelier", label: "Chandelier", Icon: Sparkles },
];

type RoomTemplate = {
  id: string;
  label: string;
  description: string;
  swatch: string;
  gallery: string[];
};

const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: "modern",
    label: "Modern",
    description: "Clean, minimal interiors",
    swatch: "linear-gradient(160deg, #ffffff 0%, #f6f8fb 100%)",
    gallery: [
      "/templates/modern/1.jpg",
      "/templates/modern/2.jpg",
      "/templates/modern/3.jpg",
      "/templates/modern/4.jpg",
      "/templates/modern/5.jpg",
      "/templates/modern/6.jpg",
    ],
  },
  {
    id: "classic",
    label: "Classic",
    description: "Warm, traditional rooms",
    swatch: "linear-gradient(160deg, #ffffff 0%, #f6f8fb 100%)",
    gallery: [
      "/templates/classic/1.jpg",
      "/templates/classic/2.jpg",
      "/templates/classic/3.jpg",
      "/templates/classic/4.jpg",
      "/templates/classic/5.jpg",
      "/templates/classic/6.jpg",
    ],
  },
  {
    id: "rustic",
    label: "Rustic",
    description: "Natural, textured spaces",
    swatch: "linear-gradient(160deg, #ffffff 0%, #f6f8fb 100%)",
    gallery: [
      "/templates/rustic/1.jpg",
      "/templates/rustic/2.jpg",
      "/templates/rustic/3.jpg",
      "/templates/rustic/4.jpg",
      "/templates/rustic/5.jpg",
      "/templates/rustic/6.jpg",
    ],
  },
];

const BLUE = "#3b82f6";
const BLUE_DEEP = "#1d4ed8";
const BLUE_DARK = "#1e40af";
const BLUE_BRIGHT = "#60a5fa";
const BLUE_GRADIENT =
  "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 55%, #60a5fa 100%)";

async function fetchPhotoAsFile(
  path: string,
  fallbackName: string,
): Promise<File | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.type.startsWith("image/")) return null;
    const ext = blob.type === "image/png" ? "png" : "jpg";
    const name = path.split("/").pop() || `${fallbackName}.${ext}`;
    return new File([blob], name, { type: blob.type });
  } catch {
    return null;
  }
}

/* ────────────────────────────────────────────────────────────────────────── */

export default function StudioClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [room, setRoom] = useState<File | null>(null);
  const [light, setLight] = useState<File | null>(null);
  const [meta, setMeta] = useState<LightMeta>({
    name: "",
    brand: "",
    sku: "",
    type: "",
  });
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openTemplate, setOpenTemplate] = useState<RoomTemplate | null>(null);
  const [userPrompt, setUserPrompt] = useState("");
  // 'I am a human' gate — true once the user passes the checkbox.
  // Read from sessionStorage so we don't re-prompt on every render in the same tab.
  const [verifiedHuman, setVerifiedHuman] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);

  // Initial hydration: read the human-verified flag, kick off anonymous sign-in if needed.
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (window.sessionStorage.getItem("plumely:human-verified") === "1") {
          setVerifiedHuman(true);
        }
      } catch {
        // ignore (private mode, etc.)
      }
    }
    setHydrated(true);

    // Auto sign-in anonymously so the existing API/RLS flow keeps working.
    // Requires Anonymous Sign-Ins to be enabled in the Supabase project.
    (async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        await supabase.auth.signInAnonymously();
      }
    })();
  }, [supabase]);

  useEffect(() => {
    if (!openTemplate) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenTemplate(null);
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [openTemplate]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    if (resultUrl && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [resultUrl]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleSubmit() {
    if (!room || !light) {
      setError("Add both a fixture and a room photo.");
      return;
    }
    setError(null);
    setResultUrl(null);
    setStatus("uploading");

    try {
      const fd = new FormData();
      fd.append("room", room);
      fd.append("light", light);
      fd.append("meta", JSON.stringify(meta));
      if (userPrompt.trim()) fd.append("userPrompt", userPrompt.trim());

      const res = await fetch("/api/generate", { method: "POST", body: fd });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      const { id } = (await res.json()) as { id: string };
      setGenerationId(id);
      setStatus("queued");
      startPolling(id);
    } catch (err) {
      setStatus("failed");
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function startPolling(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/generate/${id}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as {
          status: GenerationStatus;
          resultUrl: string | null;
          error: string | null;
        };
        setStatus(data.status);
        if (data.status === "succeeded" && data.resultUrl) {
          setResultUrl(data.resultUrl);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "failed") {
          setError(data.error ?? "Generation failed.");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // swallow transient errors; next tick will retry
      }
    }, 2000);
  }

  async function selectGalleryPhoto(path: string, templateLabel: string) {
    setError(null);
    const fallbackName = `${templateLabel.toLowerCase()}-house`;
    const file = await fetchPhotoAsFile(path, fallbackName);
    if (file) {
      setRoom(file);
      setOpenTemplate(null);
    } else {
      setError(
        `That photo isn't ready yet — drop a JPG at ${path} in /public.`,
      );
    }
  }

  function reset() {
    setRoom(null);
    setLight(null);
    setMeta({ name: "", brand: "", sku: "", type: "" });
    setStatus("idle");
    setGenerationId(null);
    setResultUrl(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  const busy =
    status === "uploading" || status === "queued" || status === "running";
  const ready = !!light && !!room && !!meta.type;

  return (
    <div
      className="relative min-h-screen overflow-x-hidden text-ink"
      style={{ background: "#fbfaf6" }}
    >
      <Atmosphere />
      <Header userEmail={userEmail} onSignOut={handleSignOut} />

      <main className="relative z-10 mx-auto w-full max-w-[680px] px-4 pb-32 pt-6 sm:px-5 sm:pt-12 md:pt-16">
        <Hero />

        <Pipeline light={!!light} room={!!room} done={!!resultUrl} busy={busy} />

        <Studio
          light={light}
          room={room}
          meta={meta}
          setLight={setLight}
          setRoom={setRoom}
          setMeta={setMeta}
          onSubmit={handleSubmit}
          onReset={reset}
          ready={ready}
          busy={busy}
          status={status}
          error={error}
          showReset={!!resultUrl || status === "failed"}
          resultUrl={resultUrl}
          generationId={generationId}
          resultRef={resultRef}
          userPrompt={userPrompt}
          setUserPrompt={setUserPrompt}
        />

        <TemplatesStrip onPick={setOpenTemplate} />

        <footer className="mt-20 flex items-center justify-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em]">
          <span
            className="inline-block h-1 w-1 rounded-full"
            style={{ background: BLUE_DARK, boxShadow: `0 0 6px ${BLUE_BRIGHT}` }}
          />
          <span className="gradient-flow font-semibold">
            Plumely · made with care
          </span>
        </footer>
      </main>

      <MobileStickyCTA
        ready={ready}
        busy={busy}
        status={status}
        onSubmit={handleSubmit}
      />

      {openTemplate && (
        <GalleryModal
          template={openTemplate}
          onClose={() => setOpenTemplate(null)}
          onSelect={(path: string) =>
            selectGalleryPhoto(path, openTemplate.label)
          }
        />
      )}

      {hydrated && !verifiedHuman && (
        <HumanGate
          onVerified={() => {
            setVerifiedHuman(true);
            try {
              window.sessionStorage.setItem("plumely:human-verified", "1");
            } catch {
              // ignore
            }
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Atmosphere — blue washes + soft yellow corners on warm paper.              */

function Atmosphere() {
  return (
    <>
      {/* Soft blue fade at the very top — present, not loud */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[26vh]"
        style={{
          background:
            "linear-gradient(180deg, rgba(96, 165, 250, 0.07) 0%, rgba(96, 165, 250, 0.02) 55%, transparent 100%)",
        }}
      />

      {/* Soft blue wash — top (dimmed slightly) */}
      <div
        aria-hidden
        className="orb-drift pointer-events-none absolute -left-[15%] -top-[18%] z-0 h-[75vw] w-[75vw] max-h-[820px] max-w-[820px]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(59, 130, 246, 0.075), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Whisper blue lower right (dimmed slightly) */}
      <div
        aria-hidden
        className="orb-drift-slow pointer-events-none absolute -right-[20%] top-[50%] z-0 h-[65vw] w-[65vw] max-h-[720px] max-w-[720px]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(29, 78, 216, 0.045), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* Subtle blue vignette around the page edges */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 75% at 50% 50%, transparent 55%, rgba(30, 64, 175, 0.07) 100%)",
        }}
      />

      {/* Faint blueprint grid — only visible OUTSIDE the studio bubble area */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.75]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14, 12, 8, 0.075) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 12, 8, 0.075) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "linear-gradient(180deg, black 0%, black 18%, transparent 36%)",
          WebkitMaskImage:
            "linear-gradient(180deg, black 0%, black 18%, transparent 36%)",
        }}
      />

      {/* Paper grain */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          mixBlendMode: "multiply",
        }}
      />
    </>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Header({
  userEmail,
  onSignOut,
}: {
  userEmail: string;
  onSignOut: () => void;
}) {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex h-14 max-w-[1100px] items-center justify-between px-5 sm:h-16 sm:px-6">
        <Link
          href="/"
          aria-label="Plumely home"
          className="flex items-center gap-2 transition hover:opacity-70"
        >
          <Logo size={22} withWordmark={false} />
          <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
            Plumely
          </span>
        </Link>
        <div className="flex items-center gap-2.5">
          <span className="hidden font-mono text-[10.5px] tracking-tight text-ink-soft md:inline">
            {userEmail}
          </span>
          <button
            onClick={onSignOut}
            aria-label="Sign out"
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-[rgba(14,12,8,0.12)] bg-white/60 px-3 text-[11.5px] font-medium text-ink-muted backdrop-blur transition hover:border-[rgba(14,12,8,0.25)] hover:bg-white hover:text-ink"
          >
            <LogOut className="h-3 w-3" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
      <div className="rule h-px" />
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/* Typewriter — types out the hero in fast bursts, with a blinking caret while typing.
   The "typed" flag is persisted in `sessionStorage` so the animation runs at most
   once per browser session. Survives re-mounts, navigations, focus changes, etc. */
const HEADING_TEXT = "See it, before you buy it.";
const BUY_START = HEADING_TEXT.indexOf("buy");
const BUY_END = BUY_START + 3;
const TYPE_SPEED_MS = 42;
const TYPE_START_DELAY_MS = 220;
const TYPED_FLAG_KEY = "plumely:heading-typed";

function readTypedFlag(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(TYPED_FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

function writeTypedFlag() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(TYPED_FLAG_KEY, "1");
  } catch {
    // ignore (private mode, quota, etc.)
  }
}

function TypedHeading() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  
  const [chars, setChars] = useState(() =>
    readTypedFlag() ? HEADING_TEXT.length : 0,
  );
  const [started, setStarted] = useState(() => readTypedFlag());

  useEffect(() => {
    if (started) return;
    const start = setTimeout(() => setStarted(true), TYPE_START_DELAY_MS);
    return () => clearTimeout(start);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    if (chars >= HEADING_TEXT.length) {
      writeTypedFlag();
      return;
    }
    const t = setTimeout(
      () => setChars((c) => c + 1),
      TYPE_SPEED_MS,
    );
    return () => clearTimeout(t);
  }, [chars, started]);

  const done = chars >= HEADING_TEXT.length;
  const before = HEADING_TEXT.slice(0, Math.min(chars, BUY_START));
  const buyShown =
    chars > BUY_START ? HEADING_TEXT.slice(BUY_START, Math.min(chars, BUY_END)) : "";
  const after = chars > BUY_END ? HEADING_TEXT.slice(BUY_END, chars) : "";
if (!mounted) return null;
  return (
    <h1
      className="mt-7 font-semibold leading-[1.0] tracking-[-0.045em] text-ink"
      style={{
        fontSize: "clamp(2.5rem, 11.5vw, 4.5rem)",
        minHeight: "1em",
      }}
      aria-label={HEADING_TEXT}
    >
      <span aria-hidden>
        {before}
        <span className="gradient-flow font-semibold">{buyShown}</span>
        {after}
        {!done && (
          <span
            className="caret-blink ml-0.5 inline-block"
            style={{ color: "#1d4ed8", fontWeight: 300 }}
          >
            |
          </span>
        )}
      </span>
    </h1>
  );
}

function Hero() {
  return (
    <section className="text-center">
      <TypedHeading />

      <p
        className="shimmer-blue fade-up mx-auto mt-5 max-w-[30rem] text-[15px] font-medium leading-[1.55] sm:text-[16px]"
        style={{ animationDelay: "0.22s" }}
      >
        Drop a fixture. Drop a room. We compose, light, and render —
        in fifteen seconds.
      </p>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Pipeline — three glass pills that light up blue in sequence.               */

function Pipeline({
  light,
  room,
  done,
  busy,
}: {
  light: boolean;
  room: boolean;
  done: boolean;
  busy: boolean;
}) {
  const nodes: {
    label: string;
    code: string | null;
    done: boolean;
    overlay: string;
    dotOverlay: string;
  }[] = [
    { label: "Fixture", code: null, done: light, overlay: "cascade-overlay-1", dotOverlay: "cascade-dot-overlay-1" },
    { label: "Room", code: null, done: room, overlay: "cascade-overlay-2", dotOverlay: "cascade-dot-overlay-2" },
    { label: "Result", code: "→", done, overlay: "cascade-overlay-3", dotOverlay: "cascade-dot-overlay-3" },
  ];
  return (
    <div
      className="fade-up mt-8 flex items-center justify-center gap-1.5 sm:gap-3"
      style={{ animationDelay: "0.28s" }}
    >
      {nodes.map((n, i) => (
        <div key={n.label} className="flex items-center gap-1.5 sm:gap-3">
          <div
            className="relative inline-flex h-8 items-center gap-1.5 overflow-hidden rounded-md border px-2.5 sm:h-9 sm:px-3"
            style={
              n.done
                ? {
                    background: `linear-gradient(180deg, rgba(96, 165, 250, 0.22) 0%, rgba(255, 255, 255, 0.60) 100%)`,
                    borderColor: `rgba(30, 64, 175, 0.55)`,
                    boxShadow: `0 0 0 1px rgba(30, 64, 175, 0.22), 0 8px 24px -8px ${BLUE_DARK}88`,
                  }
                : {
                    background:
                      "linear-gradient(180deg, rgba(255, 255, 255, 0.70) 0%, rgba(255, 255, 255, 0.35) 100%)",
                    borderColor: "rgba(14, 12, 8, 0.10)",
                  }
            }
          >
            {/* Animated overlay — opacity-only, GPU-accelerated */}
            {!n.done && (
              <span aria-hidden className={`cascade-overlay ${n.overlay}`} />
            )}
            {n.code !== null && (
              <span
                className="relative z-[1] grid h-4 w-4 place-items-center overflow-hidden rounded-sm font-mono text-[8.5px] font-semibold"
                style={
                  n.done
                    ? { background: BLUE_DARK, color: "#ffffff" }
                    : {
                        background: "rgba(14, 12, 8, 0.10)",
                        color: "rgba(14, 12, 8, 0.72)",
                      }
                }
              >
                {!n.done && (
                  <span aria-hidden className={`cascade-dot-overlay ${n.dotOverlay}`} />
                )}
                <span className="relative z-[1]">
                  {n.done ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : n.code}
                </span>
              </span>
            )}
            <span
              className="relative z-[1] font-mono text-[10.5px] uppercase tracking-[0.16em]"
              style={{ color: n.done ? BLUE_DARK : "rgba(14, 12, 8, 0.72)" }}
            >
              {n.label}
            </span>
          </div>
          {i < nodes.length - 1 && (
            <div
              className="relative h-px w-6 overflow-hidden sm:w-10"
              style={{ background: "rgba(14,12,8,0.12)" }}
            >
              <span
                className={`absolute inset-y-0 left-0 w-1/2 ${
                  i === 0 ? "cascade-wire-1" : "cascade-wire-2"
                }`}
                style={{
                  background: `linear-gradient(90deg, transparent, ${BLUE_DARK}, transparent)`,
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* LoadingState — shown in the preview slot while generation runs.            */
/* Three pulsing blue dots + a heading + a cycling subtitle.                  */

const COMPOSING_PHRASES = [
  "Choosing the perfect bulb",
  "Setting the mood",
  "Casting realistic shadows",
  "Painting with light",
  "Bouncing photons off the walls",
  "Letting warm light spill in",
  "Adding the final glow",
];

function LoadingState({ status }: { status: GenerationStatus }) {
  const headline =
    status === "uploading"
      ? "Uploading your photos"
      : status === "queued"
        ? "Lining up the render"
        : "Composing your room";

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-5 px-6 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 45% at 50% 50%, rgba(96, 165, 250, 0.22), transparent 70%)",
        }}
      />

      <div className="relative flex items-center gap-2.5">
        <span aria-hidden className="loading-dot loading-dot-1" />
        <span aria-hidden className="loading-dot loading-dot-2" />
        <span aria-hidden className="loading-dot loading-dot-3" />
      </div>

      <p className="relative text-[15px] font-semibold tracking-tight text-ink">
        {headline}
      </p>

      {status === "running" && <CyclingPhrase phrases={COMPOSING_PHRASES} />}
    </div>
  );
}

function CyclingPhrase({ phrases }: { phrases: string[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((prev) => (prev + 1) % phrases.length), 2400);
    return () => clearInterval(t);
  }, [phrases.length]);
  return (
    <p
      key={i}
      className="text-fade relative min-h-[1.2em] text-[12.5px] tracking-tight text-ink-muted"
    >
      {phrases[i]}
    </p>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Studio({
  light,
  room,
  meta,
  setLight,
  setRoom,
  setMeta,
  onSubmit,
  onReset,
  ready,
  busy,
  status,
  error,
  showReset,
  resultUrl,
  generationId,
  resultRef,
  userPrompt,
  setUserPrompt,
}: {
  light: File | null;
  room: File | null;
  meta: LightMeta;
  setLight: (f: File | null) => void;
  setRoom: (f: File | null) => void;
  setMeta: React.Dispatch<React.SetStateAction<LightMeta>>;
  onSubmit: () => void;
  onReset: () => void;
  ready: boolean;
  busy: boolean;
  status: GenerationStatus;
  error: string | null;
  showReset: boolean;
  resultUrl: string | null;
  generationId: string | null;
  resultRef: React.RefObject<HTMLDivElement | null>;
  userPrompt: string;
  setUserPrompt: (v: string) => void;
}) {
  const disabled = busy || !ready;
  const [chipPulse, setChipPulse] = useState<{ v: LightType; n: number } | null>(null);

  function clickChip(v: Exclude<LightType, "">) {
    setMeta((m) => ({ ...m, type: m.type === v ? "" : v }));
    setChipPulse((prev) => ({ v, n: (prev?.v === v ? prev.n : 0) + 1 }));
  }

  return (
    <section
      className="panel-rise relative mt-9 md:mt-12"
      style={{ animationDelay: "0.34s" }}
    >
      {/* Soft blue "lamplight" leaking under the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 -bottom-10 z-0 h-24"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(59, 130, 246, 0.30), transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="glass-studio relative z-10 overflow-hidden rounded-[22px] p-4 sm:rounded-[26px] sm:p-7">
        {/* Card eyebrow */}
        <div className="mb-4 flex items-center justify-between">
          <p className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-[0.24em]">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: BLUE, boxShadow: `0 0 8px ${BLUE_BRIGHT}` }}
            />
            <span
              className="font-semibold"
              style={{
                background: BLUE_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Studio
            </span>
          </p>
          <p
            className="gradient-flow font-mono text-[9.5px] font-bold uppercase tracking-[0.22em]"
            style={{ animationDuration: "1.8s" }}
          >
            ~15s
          </p>
        </div>

        {/* Two upload bubbles — synchronized blue breath */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <UploadTile
            label="Light fixture"
            placeholder="Tap to add the product"
            file={light}
            onFile={setLight}
            breatheClass="bubble-breathe-1"
            scanClass="tile-scan-1"
          />
          <UploadTile
            label="Your room"
            placeholder="Tap to add a room photo"
            file={room}
            onFile={setRoom}
            breatheClass="bubble-breathe-2"
            scanClass="tile-scan-2"
          />
        </div>

        {/* Type chips */}
        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <p className="text-[12.5px] font-medium tracking-tight text-ink">
              Where does it go?
            </p>
            <p
              className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em]"
              style={{ color: meta.type ? BLUE_DARK : "var(--color-ink-soft)" }}
            >
              {meta.type ? "Chosen" : "Choose one"}
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {LIGHT_TYPES.map(({ value: v, label, Icon }) => {
              const active = meta.type === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => clickChip(v)}
                  aria-pressed={active}
                  className="chip-fade relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full px-5 text-[14px] font-medium tracking-tight sm:w-auto"
                  style={{
                    background: active ? BLUE_DARK : "#ffffff",
                    border: `1px solid ${active ? BLUE_DARK : "rgba(14,12,8,0.14)"}`,
                    color: active ? "#ffffff" : "var(--color-ink)",
                    boxShadow: "none",
                  }}
                >
                  {chipPulse?.v === v && (
                    <span
                      aria-hidden
                      key={`scan-${v}-${chipPulse.n}`}
                      className="chip-scan"
                    />
                  )}
                  <span className="relative z-[1] inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" strokeWidth={1.85} />
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional user prompt — guides the Gemini render */}
        <div className="mt-7">
          <div className="flex items-baseline justify-between">
            <p className="text-[12.5px] font-medium tracking-tight text-ink">
              Add a note
            </p>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-soft">
              Optional
            </p>
          </div>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="e.g. warm cozy lighting, dimmer, brighter, golden hour mood"
            rows={2}
            maxLength={400}
            className="mt-2 w-full resize-none rounded-xl px-3.5 py-2.5 text-[13px] leading-[1.5] text-ink outline-none transition placeholder:text-ink-soft focus:border-[rgba(59,130,246,0.55)]"
            style={{
              background: "rgba(255, 255, 255, 0.65)",
              border: "1px solid rgba(14, 12, 8, 0.12)",
            }}
          />
        </div>

        {error && (
          <p
            className="mt-6 rounded-lg px-3.5 py-2.5 text-[12.5px] leading-[1.5]"
            style={{
              background: "rgba(96, 165, 250, 0.10)",
              border: "1px solid rgba(59, 130, 246, 0.30)",
              color: BLUE_DEEP,
            }}
          >
            {error}
          </p>
        )}

        {/* CTA row */}
        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:gap-2.5">
          {showReset && (
            <button
              onClick={onReset}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full border border-[rgba(14,12,8,0.14)] bg-white px-4 text-[13px] font-medium text-ink-muted transition hover:border-[rgba(14,12,8,0.28)] hover:text-ink"
            >
              <RefreshCcw className="h-3.5 w-3.5" /> Start over
            </button>
          )}
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="group relative inline-flex h-12 flex-1 items-center justify-center gap-2 overflow-hidden rounded-full text-[14px] font-semibold tracking-tight transition-colors duration-200 disabled:cursor-not-allowed"
            style={{
              background: disabled
                ? "rgba(14,12,8,0.12)"
                : BLUE_DEEP,
              border: "none",
              color: disabled ? "rgba(14,12,8,0.40)" : "#ffffff",
              boxShadow: disabled ? "none" : `0 8px 22px -8px ${BLUE_DEEP}80`,
            }}
          >
            {!disabled && <span aria-hidden className="btn-scan-overlay" />}
            <span className="relative z-10 flex items-center gap-2">
              {busy ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {status === "uploading"
                    ? "Uploading…"
                    : status === "queued"
                      ? "Queued…"
                      : "Generating…"}
                </>
              ) : (
                <>
                  Generate
                  <ArrowRight
                    className="h-4 w-4 transition group-hover:translate-x-0.5"
                    strokeWidth={2.5}
                  />
                </>
              )}
            </span>
          </button>
        </div>

        <p className="mt-3 text-center font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-soft sm:text-right">
          {busy
            ? "Hang tight — almost there"
            : !light || !room
              ? "Add both photos to continue"
              : !meta.type
                ? "Pick where the light goes"
                : "Roughly 15 seconds"}
        </p>

        {(busy || resultUrl) && (
          <div
            ref={resultRef}
            className="fade-up mt-7 pt-7"
            style={{ borderTop: "1px solid rgba(14, 12, 8, 0.08)" }}
          >
            <div className="mb-3 flex items-baseline justify-between">
              <p className="text-[12.5px] font-medium tracking-tight text-ink">
                Preview
              </p>
              <p
                className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: resultUrl ? BLUE_DARK : "var(--color-ink-soft)" }}
              >
                {resultUrl
                  ? "Ready"
                  : status === "uploading"
                    ? "Uploading"
                    : status === "queued"
                      ? "Queued"
                      : "Rendering"}
              </p>
            </div>

            <div
              className="relative overflow-hidden rounded-[16px]"
              style={{
                border: "1px solid rgba(14, 12, 8, 0.10)",
                background:
                  "linear-gradient(160deg, #ffffff 0%, rgba(219, 234, 254, 0.55) 100%)",
              }}
            >
              <div className="aspect-[16/10] w-full overflow-hidden">
                {resultUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resultUrl}
                    alt="Generated visualization"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <LoadingState status={status} />
                )}
              </div>
            </div>

            {resultUrl && generationId && (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-soft">
                    Photoreal · Plumely
                  </p>
                  <DownloadButton url={resultUrl} />
                </div>
                <EmailDesignForm generationId={generationId} />
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Downloads the rendered image without navigating the page.                  */
/* A plain <a href download> ignores the `download` attribute for cross-origin */
/* URLs (which signed Supabase URLs are) and navigates instead, wiping state.  */
/* We fetch → blob → object URL → programmatic click instead.                  */

function DownloadButton({ url }: { url: string }) {
  const [busy, setBusy] = useState(false);
  // Pre-cache the blob as soon as the result mounts so the click feels instant.
  // We start fetching in the background; if the user clicks before it's ready,
  // we await the in-flight promise. Saves a noticeable second on mobile.
  const blobPromiseRef = useRef<Promise<Blob> | null>(null);

  useEffect(() => {
    blobPromiseRef.current = fetch(url, { cache: "force-cache" }).then((r) => {
      if (!r.ok) throw new Error(`status ${r.status}`);
      return r.blob();
    });
    return () => {
      blobPromiseRef.current = null;
    };
  }, [url]);

  function filenameFor(mime: string): string {
    const ext =
      mime === "image/jpeg" ? "jpg" :
      mime === "image/webp" ? "webp" :
      "png";
    return `plumely-render.${ext}`;
  }

  async function handleClick() {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await (blobPromiseRef.current ??
        fetch(url).then((r) => {
          if (!r.ok) throw new Error(`status ${r.status}`);
          return r.blob();
        }));
      const mime = blob.type || "image/png";
      const filename = filenameFor(mime);
      const file = new File([blob], filename, { type: mime });

      // Mobile path: native share sheet → "Save Image" puts it directly in
      // Photos / Gallery. Much faster perceived speed than a download.
      const nav = typeof navigator !== "undefined" ? navigator : undefined;
      if (
        nav?.canShare &&
        nav.canShare({ files: [file] }) &&
        typeof nav.share === "function"
      ) {
        try {
          await nav.share({ files: [file], title: "Plumely render" });
          return;
        } catch (err) {
          // User dismissed the share sheet → don't fall through to download.
          if (err instanceof Error && err.name === "AbortError") return;
          // Any other share failure → fall through to anchor download.
        }
      }

      // Desktop / browsers without Web Share API: trigger a direct download.
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      // Last-resort fallback: open in a new tab.
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full px-4 text-[12px] font-semibold text-white transition hover:opacity-95 disabled:cursor-wait disabled:opacity-80"
      style={{
        background: BLUE_DARK,
        boxShadow: `0 6px 18px -6px ${BLUE_DARK}88`,
      }}
    >
      <span aria-hidden className="btn-scan-overlay" />
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {busy ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Download className="h-3 w-3" />
        )}
        {busy ? "Saving…" : "Save"}
      </span>
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* EmailDesignForm — collects an email address, POSTs the render to it.       */
/* Backend is /api/email-design (Resend). Requires RESEND_API_KEY +           */
/* RESEND_FROM_EMAIL on the server, otherwise the route returns 503.          */

function EmailDesignForm({ generationId }: { generationId: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/email-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generationId, email: email.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Request failed (${res.status})`);
      }
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Couldn't send email.");
    }
  }

  if (status === "sent") {
    return (
      <p
        className="rounded-xl px-3.5 py-2.5 text-[12.5px] leading-[1.5]"
        style={{
          background: "rgba(96, 165, 250, 0.10)",
          border: "1px solid rgba(59, 130, 246, 0.30)",
          color: BLUE_DEEP,
        }}
      >
        Sent — check your inbox in a minute or two.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <label className="block">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.22em] text-ink-soft">
          Email me this design
        </span>
        <div className="mt-1.5 flex gap-2">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="h-10 flex-1 rounded-full px-4 text-[13px] text-ink outline-none transition placeholder:text-ink-soft focus:border-[rgba(59,130,246,0.55)]"
            style={{
              background: "rgba(255, 255, 255, 0.65)",
              border: "1px solid rgba(14, 12, 8, 0.12)",
            }}
            autoComplete="email"
            disabled={status === "sending"}
          />
          <button
            type="submit"
            disabled={status === "sending"}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full px-4 text-[12.5px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: BLUE_DARK,
              boxShadow: `0 6px 18px -6px ${BLUE_DARK}80`,
            }}
          >
            {status === "sending" ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Sending
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Send
              </>
            )}
          </button>
        </div>
      </label>
      {errorMsg && (
        <p
          className="rounded-lg px-3 py-2 text-[12px]"
          style={{
            background: "rgba(96, 165, 250, 0.10)",
            border: "1px solid rgba(59, 130, 246, 0.30)",
            color: BLUE_DEEP,
          }}
        >
          {errorMsg}
        </p>
      )}
    </form>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function UploadTile({
  label,
  placeholder,
  file,
  onFile,
  breatheClass,
  scanClass,
}: {
  label: string;
  placeholder: string;
  file: File | null;
  onFile: (f: File | null) => void;
  breatheClass?: string;
  scanClass?: string;
}) {
  const [isOver, setIsOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) onFile(f);
  };

  if (file) {
    return (
      <div
        className="group relative aspect-[4/3] overflow-hidden rounded-xl"
        style={{
          border: `1px solid rgba(59, 130, 246, 0.40)`,
          boxShadow: `0 0 0 1px rgba(59,130,246,0.15), 0 14px 40px -16px ${BLUE_DEEP}55`,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={URL.createObjectURL(file)}
          alt={label}
          className="h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, transparent 28%, transparent 72%, rgba(255,255,255,0.40) 100%)",
          }}
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          <span
            className="inline-flex items-center rounded-md px-2 py-1 text-[10.5px] font-medium tracking-tight backdrop-blur"
            style={{
              background: "rgba(255,255,255,0.78)",
              border: `1px solid rgba(59, 130, 246, 0.35)`,
              color: "var(--color-ink)",
            }}
          >
            {label}
          </span>
          <button
            type="button"
            onClick={() => onFile(null)}
            aria-label={`Remove ${label}`}
            className="grid h-7 w-7 place-items-center rounded-md backdrop-blur transition hover:scale-105"
            style={{
              background: "rgba(255,255,255,0.78)",
              border: "1px solid rgba(14,12,8,0.18)",
              color: "var(--color-ink)",
            }}
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      className={`group relative flex aspect-[4/3] min-h-[150px] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-xl text-center transition-colors duration-200 hover:-translate-y-px ${
        isOver ? "" : breatheClass ?? ""
      }`}
      style={{
        background: "linear-gradient(160deg, #ffffff 0%, rgba(219, 234, 254, 0.55) 100%)",
        border: isOver
          ? `1px solid ${BLUE}`
          : "1px dashed rgba(14, 12, 8, 0.14)",
        boxShadow: isOver
          ? `0 0 0 3px rgba(59,130,246,0.18), 0 16px 36px -10px ${BLUE_DEEP}66`
          : undefined,
      }}
    >
      {/* Subtle slow scan sweep — staggered between the two upload tiles */}
      {scanClass && <span aria-hidden className={`tile-scan ${scanClass}`} />}

      <span
        className="relative grid h-9 w-9 place-items-center rounded-full transition group-hover:scale-105"
        style={{
          background: "#ffffff",
          border: `1px solid rgba(59, 130, 246, 0.35)`,
          boxShadow: `0 0 14px rgba(59, 130, 246, 0.18)`,
        }}
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.25} style={{ color: BLUE_DEEP }} />
      </span>
      <span className="relative mt-0.5 text-[13px] font-medium tracking-tight text-ink">
        {label}
      </span>
      <span className="relative text-[11.5px] leading-[1.5] text-ink-soft">
        {placeholder}
      </span>
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* TemplatesStrip — same glass bubble style as upload tiles.                  */

function TemplatesStrip({
  onPick,
}: {
  onPick: (t: RoomTemplate) => void;
}) {
  const breatheClasses = ["bubble-breathe-1", "bubble-breathe-2", "bubble-breathe-3"];
  return (
    <section className="relative mt-12">
      <div className="mb-4 flex items-end justify-between gap-3 px-0.5">
        <h2
          className="font-semibold leading-[1.0] tracking-[-0.045em] text-ink"
          style={{ fontSize: "clamp(1.5rem, 5.5vw, 2rem)" }}
        >
          Sample rooms
        </h2>
        <p
          className="tap-pulse shrink-0 pb-1 inline-flex items-center gap-1.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.20em] sm:text-[10.5px] sm:tracking-[0.22em]"
          style={{ color: BLUE_DEEP }}
        >
          Tap to use
          <ChevronDown className="tap-bob h-3 w-3 sm:h-3.5 sm:w-3.5" strokeWidth={2.5} />
        </p>
      </div>

      {/* Soft blue lamplight under the bubble */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-6 -bottom-8 z-0 h-20"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, rgba(59, 130, 246, 0.20), transparent 70%)",
          filter: "blur(38px)",
        }}
      />

      <div className="glass-studio relative z-10 overflow-hidden rounded-[20px] p-2.5 sm:rounded-[26px] sm:p-5">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
          {ROOM_TEMPLATES.map((t, i) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onPick(t)}
              className={`group relative overflow-hidden rounded-xl text-left transition-colors hover:-translate-y-px ${breatheClasses[i]}`}
              style={{
                background:
                  "linear-gradient(160deg, #ffffff 0%, rgba(219, 234, 254, 0.55) 100%)",
                border: "1px dashed rgba(14, 12, 8, 0.14)",
              }}
            >
              <div className="relative aspect-square w-full overflow-hidden">
                <TemplateThumbnail template={t} />
                {/* Dark gradient at the bottom so the title sits legibly over the photo */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(180deg, transparent 45%, rgba(14, 12, 8, 0.60) 100%)",
                  }}
                />
                <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
                  <span
                    className="truncate text-[13px] font-semibold tracking-tight text-white sm:text-[13.5px]"
                    style={{ textShadow: "0 1px 2px rgba(0,0,0,0.45)" }}
                  >
                    {t.label}
                  </span>
                  <ArrowUpRight
                    className="h-3.5 w-3.5 shrink-0 text-white transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    strokeWidth={2}
                  />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function TemplateThumbnail({ template }: { template: RoomTemplate }) {
  const [errored, setErrored] = useState(false);
  const firstPhoto = template.gallery[0];

  if (errored || !firstPhoto) {
    return (
      <div
        className="relative h-full w-full"
        style={{ background: template.swatch }}
      >
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-mono text-[8.5px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
          {template.label}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={firstPhoto}
      alt={`${template.label} preview`}
      onError={() => setErrored(true)}
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
      draggable={false}
    />
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function MobileStickyCTA({
  ready,
  busy,
  status,
  onSubmit,
}: {
  ready: boolean;
  busy: boolean;
  status: GenerationStatus;
  onSubmit: () => void;
}) {
  if (!ready && !busy) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(env(safe-area-inset-bottom),10px)] pt-3 sm:hidden">
      <div
        className="rounded-full p-1 backdrop-blur-xl"
        style={{
          background: "rgba(255, 255, 255, 0.75)",
          border: "1px solid rgba(14, 12, 8, 0.08)",
          boxShadow:
            "0 -8px 24px -8px rgba(14, 12, 8, 0.10), 0 -20px 60px -24px rgba(37, 99, 235, 0.35)",
        }}
      >
        <button
          onClick={onSubmit}
          disabled={busy}
          className="relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-[14px] font-semibold tracking-tight text-white disabled:cursor-not-allowed"
          style={{
            background: BLUE_DEEP,
            border: "none",
            boxShadow: `0 8px 22px -8px ${BLUE_DEEP}80`,
          }}
        >
          {!busy && <span aria-hidden className="btn-scan-overlay" />}
          <span className="relative z-10 flex items-center gap-2">
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {status === "uploading"
                  ? "Uploading…"
                  : status === "queued"
                    ? "Queued…"
                    : "Generating…"}
              </>
            ) : (
              <>
                Generate
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </>
            )}
          </span>
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */
/* HumanGate — blocks the studio behind a single "I am a human" checkbox.    */
/* Not real bot protection (Cloudflare Turnstile would be the upgrade).      */

function HumanGate({ onVerified }: { onVerified: () => void }) {
  const [checked, setChecked] = useState(false);

  function handleContinue() {
    if (!checked) return;
    onVerified();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        aria-hidden
        className="absolute inset-0 bg-[rgba(14,12,8,0.55)] backdrop-blur-md"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="human-gate-title"
        className="glass-light relative z-10 w-full max-w-md overflow-hidden rounded-[20px] p-6 text-center sm:rounded-[24px] sm:p-8"
      >
        <p
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
          style={{ color: BLUE_DARK }}
        >
          Quick check
        </p>
        <h2
          id="human-gate-title"
          className="mt-2 text-[22px] font-semibold leading-[1.15] tracking-[-0.025em] text-ink sm:text-[24px]"
        >
          Before we let you in
        </h2>
        <p className="mt-1.5 text-[13px] leading-[1.5] text-ink-muted">
          Just confirming you&apos;re a real person — helps us keep the
          renderer fast for everyone.
        </p>

        <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-xl border border-[rgba(14,12,8,0.14)] bg-white p-3.5 text-left transition hover:border-[rgba(14,12,8,0.28)]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="h-5 w-5 cursor-pointer accent-[#1e40af]"
          />
          <span className="text-[14px] font-medium text-ink">
            I am a human
          </span>
        </label>

        <button
          type="button"
          onClick={handleContinue}
          disabled={!checked}
          className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold tracking-tight text-white transition-colors disabled:cursor-not-allowed"
          style={{
            background: checked ? BLUE_DARK : "rgba(14,12,8,0.12)",
            color: checked ? "#ffffff" : "rgba(14,12,8,0.40)",
            boxShadow: checked ? `0 8px 22px -8px ${BLUE_DARK}80` : "none",
          }}
        >
          Continue
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function GalleryModal({
  template,
  onClose,
  onSelect,
}: {
  template: RoomTemplate;
  onClose: () => void;
  onSelect: (path: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-8">
      <button
        aria-label="Close gallery"
        onClick={onClose}
        className="absolute inset-0 bg-[rgba(14,12,8,0.45)] backdrop-blur-md"
      />
      <div className="glass-light relative z-10 max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-[20px] md:rounded-[24px]">
        <div
          className="sticky top-0 z-10 flex items-start justify-between gap-6 px-5 py-4 backdrop-blur md:px-6 md:py-5"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.78) 100%)",
            borderBottom: "1px solid rgba(14, 12, 8, 0.08)",
          }}
        >
          <div>
            <p className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-ink-soft">
              {template.label}
            </p>
            <h2 className="mt-1.5 text-[20px] font-semibold tracking-[-0.025em] text-ink md:text-[22px]">
              Pick a sample room
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-[rgba(14,12,8,0.12)] bg-white/70 text-ink-muted transition hover:bg-white hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid gap-2.5 p-4 sm:grid-cols-2 md:gap-3 md:p-6 lg:grid-cols-3">
          {template.gallery.map((path, i) => (
            <GalleryPhoto
              key={path}
              path={path}
              label={`${template.label} ${i + 1}`}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function GalleryPhoto({
  path,
  label,
  onSelect,
}: {
  path: string;
  label: string;
  onSelect: (path: string) => void;
}) {
  const [errored, setErrored] = useState(false);

  return (
    <button
      type="button"
      onClick={() => !errored && onSelect(path)}
      disabled={errored}
      className="glass-light-soft group relative overflow-hidden rounded-lg text-left transition hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-70"
    >
      <div
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{ background: "rgba(255,255,255,0.5)" }}
      >
        {errored ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.24em] text-ink-soft">
              Coming soon
            </span>
            <span className="text-[10.5px] leading-[1.5] text-ink-soft/70">
              {path}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={path}
            alt={label}
            onError={() => setErrored(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            draggable={false}
          />
        )}
      </div>
      {!errored && (
        <div className="flex items-center justify-between px-2.5 py-2">
          <span className="text-[11.5px] font-medium text-ink">{label}</span>
          <ArrowRight
            className="h-3 w-3 transition group-hover:translate-x-0.5"
            strokeWidth={1.75}
            style={{ color: BLUE_DEEP }}
          />
        </div>
      )}
    </button>
  );
}
