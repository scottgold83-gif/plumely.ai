"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Check,
  Download,
  Lamp,
  LampCeiling,
  LampWallUp,
  Lightbulb,
  Loader2,
  LogOut,
  RefreshCcw,
  Sparkles,
  Upload,
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
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    value: "ceiling",
    label: "Ceiling",
    description: "Flush mount",
    Icon: LampCeiling,
  },
  {
    value: "wall",
    label: "Wall",
    description: "Sconce",
    Icon: LampWallUp,
  },
  {
    value: "hanging",
    label: "Hanging",
    description: "Pendant on cord",
    Icon: Lightbulb,
  },
  {
    value: "chandelier",
    label: "Chandelier",
    description: "Statement piece",
    Icon: Sparkles,
  },
  {
    value: "outdoor",
    label: "Outdoor",
    description: "Porch or garden",
    Icon: Lamp,
  },
];

const BRAND_GRADIENT = "linear-gradient(95deg, #7c3aed 0%, #d946ef 48%, #f59e0b 100%)";
const HEADLINE_GRADIENT = "linear-gradient(90deg, #7B2CBF 0%, #FF7A00 100%)";

type RoomTemplate = {
  id: string;
  label: string;
  description: string;
  swatch: string;
  gallery: string[];
};

// Each template has 6 photo slots. Drop JPGs at the listed paths inside
// /public to populate the gallery. Files that don't exist gracefully show a
// "coming soon" placeholder card.
const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: "modern",
    label: "Modern",
    description: "Modern house",
    swatch:
      "linear-gradient(135deg, #e8eaf0 0%, #c8cad2 55%, #8e909a 100%)",
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
    description: "Classic house",
    swatch:
      "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #c8964a 100%)",
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
    description: "Rustic house",
    swatch:
      "linear-gradient(135deg, #fed7aa 0%, #d97706 55%, #5b3a1f 100%)",
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

export default function StudioClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [room, setRoom] = useState<File | null>(null);
  const [light, setLight] = useState<File | null>(null);
  const [meta, setMeta] = useState<LightMeta>({ name: "", brand: "", sku: "", type: "" });
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openTemplate, setOpenTemplate] = useState<RoomTemplate | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Close gallery modal on Esc
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function handleSubmit() {
    if (!room || !light) {
      setError("Upload both a room photo and a light fixture image.");
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
  const ready = !!light && !!room;

  return (
    <div
      className="relative flex min-h-screen flex-col text-ink"
      style={{
        background: [
          // Warm golden pendant bloom — upper center
          "radial-gradient(48% 36% at 50% 4%, rgba(254, 200, 140, 0.42), transparent 72%)",
          // Lavender orb — upper left
          "radial-gradient(40% 32% at 16% 22%, rgba(196, 181, 253, 0.30), transparent 72%)",
          // Peach orb — upper right
          "radial-gradient(38% 30% at 84% 28%, rgba(252, 187, 165, 0.30), transparent 72%)",
          // Blush purple — middle left
          "radial-gradient(34% 28% at 10% 60%, rgba(221, 214, 254, 0.24), transparent 75%)",
          // Soft pink — middle right
          "radial-gradient(36% 30% at 94% 64%, rgba(252, 210, 198, 0.22), transparent 75%)",
          // Lavender wash — bottom
          "radial-gradient(42% 32% at 30% 94%, rgba(216, 207, 247, 0.20), transparent 75%)",
          // Soft peach — bottom right
          "radial-gradient(40% 30% at 80% 96%, rgba(254, 215, 195, 0.18), transparent 75%)",
          // Cream base
          "linear-gradient(180deg, #FAFAF7 0%, #F8F4EE 100%)",
        ].join(", "),
      }}
    >
      {/* Subtle film grain — adds tactile texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          mixBlendMode: "multiply",
        }}
      />

      <ProgressBar status={status} hasFiles={ready} />

      <header className="relative z-20 border-b border-outline/30 bg-white/75 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link
            href="/"
            aria-label="Plumely home"
            className="flex items-center gap-3 transition hover:opacity-90"
          >
            <Logo size={34} withWordmark={false} />
            <span
              className="text-[22px] font-bold tracking-[-0.01em]"
              style={{
                background: BRAND_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              Plumely
            </span>
          </Link>
          <div className="flex items-center gap-3 text-[13px]">
            <span className="hidden text-ink-muted sm:inline">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-outline/60 bg-white px-3 py-1.5 text-[12px] font-semibold text-ink transition hover:border-ink hover:bg-ink hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-5xl flex-1 px-6 py-12 md:py-16">
        <Hero />

        <TemplateBlocks onPick={setOpenTemplate} />

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <UploadCard
            number="1"
            label="Light fixture"
            file={light}
            onFile={setLight}
            tone="accent"
          />
          <UploadCard
            number="2"
            label="Your room"
            file={room}
            onFile={setRoom}
            tone="primary"
          />
        </div>

        <LightTypeSelector
          value={meta.type}
          onChange={(t: LightType) =>
            setMeta((m) => ({ ...m, type: t }))
          }
        />

        <HowItWorks />


        <GenerateAction
          ready={ready}
          busy={busy}
          status={status}
          error={error}
          showReset={!!resultUrl || status === "failed"}
          onSubmit={handleSubmit}
          onReset={reset}
        />

        <ResultPanel
          status={status}
          resultUrl={resultUrl}
          generationId={generationId}
        />
      </main>

      {openTemplate && (
        <GalleryModal
          template={openTemplate}
          onClose={() => setOpenTemplate(null)}
          onSelect={(path: string) =>
            selectGalleryPhoto(path, openTemplate.label)
          }
        />
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative">
      {/* Ambient purple-to-orange glow behind the headline */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-x-12 -top-12 -z-10 h-[420px]"
        style={{
          background:
            "radial-gradient(50% 60% at 28% 30%, rgba(124,58,237,0.22), transparent 70%), radial-gradient(50% 60% at 72% 30%, rgba(245,158,11,0.20), transparent 70%), radial-gradient(40% 40% at 50% 20%, rgba(217,70,239,0.10), transparent 70%)",
        }}
      />

      {/* Eyebrow — darker than the previous faint version */}
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">
        Studio
      </p>

      {/* Gradient-fill headline */}
      <h1
        className="mt-3 pb-1 text-[2.5rem] font-extrabold leading-[1.15] tracking-[-0.025em] md:text-[3.25rem]"
        style={{
          background: HEADLINE_GRADIENT,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        Compose a light into your room
      </h1>

      <p className="mt-5 max-w-xl text-[16px] leading-[1.6] text-ink-muted">
        Upload one photo of the fixture and one of your room. We&apos;ll place
        it, scale it, and light it.
      </p>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function ProgressBar({
  status,
  hasFiles,
}: {
  status: GenerationStatus;
  hasFiles: boolean;
}) {
  const steps = [
    { key: "upload", label: "Upload" },
    { key: "generate", label: "Generate" },
    { key: "download", label: "Download" },
  ] as const;

  // Determine state of each step
  const generating =
    status === "uploading" || status === "queued" || status === "running";
  const succeeded = status === "succeeded";

  // Index of the highest fully-completed step
  const completedIndex = succeeded ? 2 : generating ? 0 : hasFiles ? 0 : -1;
  // Index of the currently active step
  const currentIndex = succeeded ? 2 : generating ? 1 : hasFiles ? 1 : 0;

  return (
    <div className="relative z-30 border-b border-outline/30 bg-white/75 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-2.5 md:gap-4">
        {steps.map((step, i) => {
          const isComplete = i <= completedIndex;
          const isCurrent = i === currentIndex && !isComplete;

          const dotClass = isComplete
            ? "text-white"
            : isCurrent
              ? "border-2 border-ink bg-white text-ink"
              : "border border-outline/70 bg-white text-ink-soft";

          const dotStyle = isComplete
            ? { background: BRAND_GRADIENT }
            : undefined;

          return (
            <Fragment key={step.key}>
              <div className="flex shrink-0 items-center gap-2">
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold transition ${dotClass}`}
                  style={dotStyle}
                >
                  {isComplete ? <Check className="h-3 w-3" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`text-[12px] font-semibold tracking-tight transition ${
                    isComplete || isCurrent ? "text-ink" : "text-ink-soft"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="h-[1.5px] flex-1 rounded-full transition"
                  style={{
                    background:
                      i < completedIndex
                        ? BRAND_GRADIENT
                        : "rgba(14,12,8,0.12)",
                  }}
                />
              )}
            </Fragment>
          );
        })}
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
      {/* Backdrop */}
      <button
        aria-label="Close gallery"
        onClick={onClose}
        className="absolute inset-0 bg-ink/55 backdrop-blur-md"
      />

      {/* Panel */}
      <div className="relative z-10 max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-outline/30 bg-white shadow-raised">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-6 border-b border-outline/40 bg-white/95 px-6 py-5 backdrop-blur md:px-8">
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
              {template.label} · Gallery
            </p>
            <h2 className="mt-2 font-display text-[1.875rem] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink md:text-[2.25rem]">
              Pick a {template.label.toLowerCase()} house
            </h2>
            <p className="mt-2 max-w-md text-[13.5px] leading-[1.6] text-ink-muted">
              Don&apos;t have your own photo? Click any house below to use it
              as your room for this generation.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-outline/60 bg-white text-ink-muted transition hover:border-ink hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid */}
        <div className="grid gap-4 p-6 sm:grid-cols-2 md:p-8 lg:grid-cols-3">
          {template.gallery.map((path, i) => (
            <GalleryPhoto
              key={path}
              path={path}
              label={`${template.label} house ${i + 1}`}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
    </div>
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
        <span className="absolute inset-x-0 bottom-3 text-center font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-white/75 mix-blend-overlay">
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
      className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
      draggable={false}
    />
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
      className="group relative overflow-hidden rounded-xl border border-outline/40 bg-[#FAFAF7] text-left shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-outline hover:shadow-raised disabled:cursor-not-allowed disabled:opacity-80 disabled:hover:translate-y-0"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F0EDE5]">
        {errored ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-center">
            <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.22em] text-ink-soft">
              Coming soon
            </span>
            <span className="text-[11px] leading-[1.5] text-ink-soft/70">
              {path}
            </span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={path}
            alt={label}
            onError={() => setErrored(true)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            draggable={false}
          />
        )}
      </div>
      {!errored && (
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-[12px] font-medium text-ink">{label}</span>
          <ArrowRight
            className="h-3.5 w-3.5 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-ink"
            strokeWidth={1.75}
          />
        </div>
      )}
    </button>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function TemplateBlocks({
  onPick,
}: {
  onPick: (t: RoomTemplate) => void;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline justify-between">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
          Or start with a template
        </p>
        <p className="text-[11px] leading-[1.6] text-ink-soft">
          Don&apos;t have a room photo handy? Pick one.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {ROOM_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onPick(t)}
            className="group relative overflow-hidden rounded-2xl border border-outline/40 bg-white text-left shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-outline hover:shadow-raised"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <TemplateThumbnail template={t} />
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-display text-[15px] font-bold tracking-tight text-ink">
                  {t.label}
                </p>
                <p className="text-[11px] leading-[1.5] text-ink-soft">
                  {t.description}
                </p>
              </div>
              <ArrowRight
                className="h-4 w-4 text-ink-soft transition group-hover:translate-x-0.5 group-hover:text-ink"
                strokeWidth={1.75}
              />
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}


/* ────────────────────────────────────────────────────────────────────────── */

function LightTypeSelector({
  value,
  onChange,
}: {
  value: LightType;
  onChange: (t: LightType) => void;
}) {
  return (
    <section className="mt-10">
      <div className="group relative rounded-2xl bg-white shadow-soft">
        {/* Gradient border ring — matches the upload cards */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            padding: "3px",
            background:
              "conic-gradient(from 45deg at 50% 50%, #FF7A00 0%, #FF5C7A 25%, #7B2CBF 50%, #FF5C7A 75%, #FF7A00 100%)",
            WebkitMask:
              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            maskComposite: "exclude",
          }}
        />

        <div className="relative p-6 md:p-8">
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
                Step 3 · Mounting
              </p>
              <h2 className="mt-2 font-playfair text-[1.625rem] font-extrabold leading-[1.15] tracking-[-0.015em] text-ink md:text-[2rem]">
                Where does your light go?
              </h2>
              <p className="mt-2 max-w-md text-[14px] leading-[1.6] text-ink-muted">
                Pick the fixture type so the AI places it in the right spot.
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {LIGHT_TYPES.map(({ value: v, label, description, Icon }) => {
              const active = value === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange(active ? "" : v)}
                  aria-pressed={active}
                  className={`group/btn relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition duration-200 ${
                    active
                      ? "border-transparent bg-ink text-white shadow-[0_8px_24px_-8px_rgba(124,58,237,0.45)]"
                      : "border-outline/50 bg-white text-ink hover:-translate-y-0.5 hover:border-ink hover:shadow-soft"
                  }`}
                  style={
                    active
                      ? {
                          background:
                            "linear-gradient(135deg, #7B2CBF 0%, #d946ef 50%, #FF7A00 100%)",
                        }
                      : undefined
                  }
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-lg ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-brand-purple-soft text-brand-purple"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span
                    className={`font-display text-[16px] font-bold tracking-tight ${
                      active ? "text-white" : "text-ink"
                    }`}
                  >
                    {label}
                  </span>
                  <span
                    className={`text-[11.5px] leading-[1.5] ${
                      active ? "text-white/85" : "text-ink-soft"
                    }`}
                  >
                    {description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      n: "01",
      Icon: Lightbulb,
      title: "Pick your light",
      body: "Upload a high-quality photograph of your chosen fixture.",
    },
    {
      n: "02",
      Icon: Camera,
      title: "Snap your room",
      body: "Provide an image of the intended installation space.",
    },
    {
      n: "03",
      Icon: Sparkles,
      title: "See it for real",
      body: "Receive a photorealistic visualization in seconds.",
    },
  ];

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-3">
      {steps.map(({ n, Icon, title, body }) => (
        <article
          key={n}
          className="group rounded-2xl border border-outline/40 bg-white p-6 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-raised"
        >
          <div className="flex items-start justify-between">
            <span
              className="grid h-10 w-10 place-items-center rounded-xl text-brand-purple"
              style={{
                background:
                  "linear-gradient(135deg, rgba(124,58,237,0.14) 0%, rgba(245,158,11,0.14) 100%)",
              }}
            >
              <Icon className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <span className="font-mono text-[11px] font-semibold tracking-[0.18em] text-ink-soft">
              {n}
            </span>
          </div>
          <h3 className="mt-7 font-display text-[1.25rem] font-bold tracking-tight text-ink">
            {title}
          </h3>
          <p className="mt-2 text-[14px] leading-[1.6] text-ink-muted">
            {body}
          </p>
        </article>
      ))}
    </div>
  );
}


function UploadCard({
  number,
  label,
  file,
  onFile,
  tone,
}: {
  number: string;
  label: string;
  file: File | null;
  onFile: (f: File | null) => void;
  tone: "primary" | "accent";
}) {
  const hoverGlow =
    tone === "accent"
      ? "hover:border-brand-purple/40 hover:shadow-[0_0_0_1px_rgba(124,58,237,0.18),0_18px_50px_-10px_rgba(124,58,237,0.28)]"
      : "hover:border-brand-orange/40 hover:shadow-[0_0_0_1px_rgba(245,158,11,0.20),0_18px_50px_-10px_rgba(245,158,11,0.28)]";
  const iconColor =
    tone === "accent" ? "text-brand-purple" : "text-brand-orange";

  return (
    <div className={`group relative rounded-2xl bg-white shadow-soft transition duration-300 ${hoverGlow}`}>
      {/* Gradient border ring — uses mask-composite so it wraps every rounded corner perfectly */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          padding: "3px",
          background:
            "conic-gradient(from 45deg at 50% 50%, #FF7A00 0%, #FF5C7A 25%, #7B2CBF 50%, #FF5C7A 75%, #FF7A00 100%)",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        }}
      />
    <div className="relative rounded-2xl p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-ink-soft">
            Step {number}
          </span>
          <span className="font-playfair text-[1.625rem] font-extrabold leading-[1.15] tracking-[-0.015em] text-ink">
            {label}
          </span>
        </div>
        {file && (
          <button
            onClick={() => onFile(null)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted transition hover:text-error"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
      </div>

      {file ? (
        <div className="mt-4 overflow-hidden rounded-xl ring-1 ring-outline/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={URL.createObjectURL(file)}
            alt={label}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : (
        <label
          className={`relative mt-4 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-dashed border-outline/70 bg-[#FCFBF8] text-center transition group-hover:border-outline group-hover:bg-white`}
        >
          <span
            className={`relative z-10 grid h-9 w-9 place-items-center rounded-full bg-white text-ink shadow-soft ring-1 ring-outline/40 transition group-hover:scale-105`}
          >
            <Upload className={`h-4 w-4 transition ${iconColor}`} />
          </span>
          <span className="relative z-10 text-[14px] font-semibold tracking-tight text-ink">
            Click to upload
          </span>
          <span className="relative z-10 text-[12px] leading-[1.6] text-ink-soft">
            PNG, JPG, or WEBP · up to 10MB
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function GenerateAction({
  ready,
  busy,
  status,
  error,
  showReset,
  onSubmit,
  onReset,
}: {
  ready: boolean;
  busy: boolean;
  status: GenerationStatus;
  error: string | null;
  showReset: boolean;
  onSubmit: () => void;
  onReset: () => void;
}) {
  const disabled = busy || !ready;
  return (
    <div className="mt-10 flex flex-col items-stretch gap-4">
      {error && (
        <p className="rounded-lg bg-error/10 px-4 py-3 text-[13px] leading-[1.6] text-error">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {showReset && (
          <button
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-outline/60 bg-white px-5 py-3.5 text-[14px] font-semibold text-ink transition hover:border-ink"
          >
            <RefreshCcw className="h-4 w-4" /> Start over
          </button>
        )}

        <button
          onClick={onSubmit}
          disabled={disabled}
          className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-4 text-[15px] font-semibold text-white shadow-[0_10px_30px_-8px_rgba(124,58,237,0.45)] transition duration-300 hover:shadow-[0_14px_38px_-8px_rgba(124,58,237,0.55)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
          style={{ background: BRAND_GRADIENT }}
        >
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
                <Sparkles className="h-4 w-4" strokeWidth={2.25} />
                Generate my preview
              </>
            )}
          </span>
          {/* Subtle sweep on hover */}
          <span
            aria-hidden
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
          />
        </button>
      </div>

      <p className="text-center text-[12px] leading-[1.6] text-ink-soft">
        {disabled && !busy
          ? "Upload both images to generate."
          : "Takes ~15 seconds. Free to try."}
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function MetaInput({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-lg border border-outline/50 bg-[#FCFBF8] px-3 py-2.5 text-[14px] text-ink outline-none transition focus:border-brand-purple focus:bg-white focus:ring-2 focus:ring-brand-purple/15"
      />
    </label>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function ResultPanel({
  status,
  resultUrl,
  generationId,
}: {
  status: GenerationStatus;
  resultUrl: string | null;
  generationId: string | null;
}) {
  if (status === "idle" && !resultUrl) return null;
  return (
    <div className="mt-12 overflow-hidden rounded-3xl border border-outline/50 bg-white p-2 shadow-raised">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-[#FAFAF7]">
        {resultUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resultUrl}
            alt="Generated visualization"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-muted">
            <Loader2 className="h-6 w-6 animate-spin text-brand-purple" />
            <p className="text-sm font-semibold leading-[1.6]">
              {status === "uploading"
                ? "Uploading your photos…"
                : status === "queued"
                  ? "In the queue…"
                  : "Generating your visualization…"}
            </p>
            {generationId && (
              <p className="text-xs text-ink-soft">id: {generationId}</p>
            )}
          </div>
        )}
      </div>
      {resultUrl && (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <p className="text-[12px] leading-[1.6] text-ink-soft">
            Generated by Plumely. Photoreal composite.
          </p>
          <a
            href={resultUrl}
            download
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-brand-purple"
          >
            <Download className="h-3.5 w-3.5" /> Download
          </a>
        </div>
      )}
    </div>
  );
}
