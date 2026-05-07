"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Lightbulb,
  Loader2,
  LogOut,
  RefreshCcw,
  Upload,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type GenerationStatus = "idle" | "uploading" | "queued" | "running" | "succeeded" | "failed";

type LightMeta = {
  name: string;
  brand: string;
  sku: string;
};

export default function StudioClient({ userEmail }: { userEmail: string }) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [room, setRoom] = useState<File | null>(null);
  const [light, setLight] = useState<File | null>(null);
  const [meta, setMeta] = useState<LightMeta>({ name: "", brand: "", sku: "" });
  const [status, setStatus] = useState<GenerationStatus>("idle");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    if (!meta.name) {
      setError("Give the light a name so we can save it to your history.");
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

  function reset() {
    setRoom(null);
    setLight(null);
    setMeta({ name: "", brand: "", sku: "" });
    setStatus("idle");
    setGenerationId(null);
    setResultUrl(null);
    setError(null);
    if (pollRef.current) clearInterval(pollRef.current);
  }

  const busy = status === "uploading" || status === "queued" || status === "running";

  return (
    <div className="flex min-h-screen flex-col bg-background text-ink">
      <header className="border-b border-outline/40 bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-on-primary">
              <Lightbulb className="h-4 w-4" />
            </span>
            <span className="text-lg font-bold tracking-tight">Plumely</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-ink-muted sm:inline">{userEmail}</span>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 rounded-full border border-outline px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-primary hover:text-primary"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10 md:py-14">
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            Studio
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Compose a light into your room
          </h1>
          <p className="max-w-2xl text-ink-muted">
            Upload one photo of the fixture and one of your room. We&apos;ll
            place it, scale it, and light it.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <UploadCard
            title="1. Light fixture"
            file={light}
            onFile={setLight}
            tone="accent"
          />
          <UploadCard
            title="2. Your room"
            file={room}
            onFile={setRoom}
            tone="primary"
          />
        </div>

        <div className="mt-6 rounded-2xl border border-outline/50 bg-white p-6 shadow-soft">
          <p className="text-sm font-semibold text-ink">Light details</p>
          <p className="mt-1 text-xs text-ink-muted">
            Stored with this generation so you can revisit it later.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <MetaInput
              label="Name"
              placeholder="Halo Pendant 12&quot;"
              value={meta.name}
              onChange={(v) => setMeta((m) => ({ ...m, name: v }))}
            />
            <MetaInput
              label="Brand"
              placeholder="Lumens Co."
              value={meta.brand}
              onChange={(v) => setMeta((m) => ({ ...m, brand: v }))}
            />
            <MetaInput
              label="SKU"
              placeholder="LM-HP-12-BR"
              value={meta.sku}
              onChange={(v) => setMeta((m) => ({ ...m, sku: v }))}
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          {error && (
            <p className="rounded-md bg-error/10 px-3 py-2 text-sm text-error">
              {error}
            </p>
          )}
          <div className="ml-auto flex gap-3">
            {(resultUrl || status === "failed") && (
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-full border border-outline px-5 py-3 text-sm font-semibold text-ink transition hover:border-primary hover:text-primary"
              >
                <RefreshCcw className="h-4 w-4" /> Start over
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={busy || !room || !light}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-soft transition hover:bg-primary-bright disabled:opacity-60"
            >
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
                  Visualize <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        <ResultPanel
          status={status}
          resultUrl={resultUrl}
          generationId={generationId}
        />
      </main>
    </div>
  );
}

function UploadCard({
  title,
  file,
  onFile,
  tone,
}: {
  title: string;
  file: File | null;
  onFile: (f: File | null) => void;
  tone: "primary" | "accent";
}) {
  const ringTone = tone === "accent" ? "ring-accent/30" : "ring-primary/30";
  const accentTone = tone === "accent" ? "text-accent" : "text-primary";
  return (
    <div className="rounded-2xl border border-outline/50 bg-white p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {file && (
          <button
            onClick={() => onFile(null)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-error"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        )}
      </div>

      {file ? (
        <div className={`mt-4 overflow-hidden rounded-xl ring-1 ${ringTone}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={URL.createObjectURL(file)}
            alt={title}
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : (
        <label
          className={`mt-4 flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline bg-surface-low text-center transition hover:border-primary hover:bg-surface-mid`}
        >
          <Upload className={`h-6 w-6 ${accentTone}`} />
          <span className="text-sm font-semibold text-ink">
            Click to upload
          </span>
          <span className="text-xs text-ink-muted">PNG or JPG, up to 10MB</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  );
}

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
      <span className="text-xs font-semibold text-ink-muted">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-md border border-outline bg-surface-low px-3 py-2 text-sm text-ink outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}

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
    <div className="mt-10 rounded-3xl border border-outline/50 bg-surface p-2 shadow-raised">
      <div className="aspect-[16/10] w-full overflow-hidden rounded-2xl bg-white">
        {resultUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resultUrl}
            alt="Generated visualization"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-ink-muted">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-semibold">
              {status === "uploading"
                ? "Uploading your photos…"
                : status === "queued"
                  ? "In the queue…"
                  : "Generating your visualization…"}
            </p>
            {generationId && (
              <p className="text-xs text-ink-muted">id: {generationId}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
