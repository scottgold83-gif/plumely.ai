"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Logo } from "@/components/Logo";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    try {
      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage("Check your inbox to confirm your email, then sign in.");
        setMode("signin");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) throw err;
        router.push("/app");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  const BLUE_GRADIENT =
    "linear-gradient(135deg, #1d4ed8 0%, #3b82f6 55%, #60a5fa 100%)";

  return (
    <div
      className="relative flex min-h-screen flex-col overflow-hidden text-ink"
      style={{ background: "#fbfaf6" }}
    >
      {/* Blue wash — top */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[15%] -top-[20%] z-0 h-[70vw] w-[70vw] max-h-[700px] max-w-[700px]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(59, 130, 246, 0.22), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Yellow corner — top right */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-[10%] -top-[15%] z-0 h-[50vw] w-[50vw] max-h-[520px] max-w-[520px]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(252, 211, 77, 0.22), transparent 70%)",
          filter: "blur(70px)",
        }}
      />
      {/* Yellow corner — bottom left */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[15%] bottom-[5%] z-0 h-[55vw] w-[55vw] max-h-[560px] max-w-[560px]"
        style={{
          background:
            "radial-gradient(50% 50% at 50% 50%, rgba(253, 224, 71, 0.18), transparent 70%)",
          filter: "blur(80px)",
        }}
      />
      {/* Faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.6]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(14, 12, 8, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(14, 12, 8, 0.05) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 95%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black 30%, transparent 95%)",
        }}
      />

      <header className="relative z-10">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-5 sm:h-16 sm:px-6">
          <Link
            href="/"
            aria-label="Plumely home"
            className="flex items-center gap-2"
          >
            <Logo size={22} withWordmark={false} />
            <span className="text-[15px] font-semibold tracking-[-0.02em] text-ink">
              Plumely
            </span>
          </Link>
        </div>
        <div className="rule h-px" />
      </header>

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
        <div className="relative w-full max-w-md">
          {/* Soft blue lamplight under card */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-6 -bottom-10 z-0 h-24"
            style={{
              background:
                "radial-gradient(60% 60% at 50% 0%, rgba(59, 130, 246, 0.30), transparent 70%)",
              filter: "blur(40px)",
            }}
          />
          <div className="glass-light relative z-10 overflow-hidden rounded-[22px] p-6 sm:p-8">
            <p
              className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em]"
              style={{
                background: BLUE_GRADIENT,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {mode === "signin" ? "Sign in" : "Sign up"}
            </p>
            <h1 className="mt-2 text-[24px] font-semibold leading-[1.05] tracking-[-0.03em] text-ink">
              {mode === "signin" ? (
                <>
                  Welcome{" "}
                  <span
                    className="serif-italic font-normal"
                    style={{
                      background: BLUE_GRADIENT,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    back
                  </span>
                  .
                </>
              ) : (
                <>
                  Create your{" "}
                  <span
                    className="serif-italic font-normal"
                    style={{
                      background: BLUE_GRADIENT,
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    account
                  </span>
                  .
                </>
              )}
            </h1>
            <p className="mt-1.5 text-[13px] leading-[1.5] text-ink-muted">
              {mode === "signin"
                ? "Sign in to visualize lights in your room."
                : "Free to start — no credit card required."}
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
              />
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={
                  mode === "signin" ? "current-password" : "new-password"
                }
              />

              {error && (
                <p
                  className="rounded-lg px-3 py-2 text-[12.5px]"
                  style={{
                    background: "rgba(59, 130, 246, 0.08)",
                    border: "1px solid rgba(59, 130, 246, 0.28)",
                    color: "#1d4ed8",
                  }}
                >
                  {error}
                </p>
              )}
              {message && (
                <p
                  className="rounded-lg px-3 py-2 text-[12.5px]"
                  style={{
                    background: "rgba(59, 130, 246, 0.10)",
                    border: "1px solid rgba(59, 130, 246, 0.32)",
                    color: "#1d4ed8",
                  }}
                >
                  {message}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group relative inline-flex h-11 w-full items-center justify-center gap-2 overflow-hidden rounded-full text-[13.5px] font-semibold tracking-tight transition disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(96,165,250,0.22) 0%, rgba(255,255,255,0.55) 100%)",
                  border: "1px solid rgba(59,130,246,0.45)",
                  boxShadow:
                    "inset 0 1px 0 rgba(255,255,255,0.95), 0 0 0 1px rgba(59,130,246,0.20), 0 14px 36px -10px rgba(29,78,216,0.55)",
                  backdropFilter: "blur(20px)",
                }}
              >
                {!submitting && (
                  <span
                    aria-hidden
                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  />
                )}
                <span
                  className="relative z-10 flex items-center gap-2"
                  style={{
                    background: BLUE_GRADIENT,
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#1d4ed8" }} />}
                  {mode === "signin" ? "Sign in" : "Create account"}
                </span>
              </button>
            </form>

            <p className="mt-5 text-center text-[12.5px] text-ink-muted">
              {mode === "signin" ? (
                <>
                  New to Plumely?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signup");
                      setError(null);
                      setMessage(null);
                    }}
                    className="font-semibold transition hover:opacity-80"
                    style={{ color: "#1d4ed8" }}
                  >
                    Create an account →
                  </button>
                </>
              ) : (
                <>
                  Already have one?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setMode("signin");
                      setError(null);
                      setMessage(null);
                    }}
                    className="font-semibold transition hover:opacity-80"
                    style={{ color: "#1d4ed8" }}
                  >
                    Sign in →
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-ink-soft">
        {label}
      </span>
      <input
        required
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="mt-1.5 w-full rounded-lg px-3 py-2.5 text-[13.5px] text-ink outline-none transition focus:border-[rgba(59,130,246,0.55)]"
        style={{
          background: "rgba(255,255,255,0.62)",
          border: "1px solid rgba(14,12,8,0.12)",
        }}
      />
    </label>
  );
}
