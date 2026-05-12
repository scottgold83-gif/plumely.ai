"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowLeftRight } from "lucide-react";

type BeforeAfterSliderProps = {
  /** Image src for the "before" half. If omitted, `beforeNode` is rendered. */
  beforeSrc?: string;
  /** Image src for the "after" half. If omitted, `afterNode` is rendered. */
  afterSrc?: string;
  beforeAlt?: string;
  afterAlt?: string;
  beforeNode?: ReactNode;
  afterNode?: ReactNode;
  /** Initial slider position (0–100). Default 52. */
  initial?: number;
  /** Optional aspect ratio. Default "16/10". */
  aspect?: string;
  className?: string;
  /** Auto-demonstrate by sliding the handle across once on mount. */
  autoSlideOnMount?: boolean;
};

/**
 * Drag-to-reveal before/after comparison slider.
 *
 * Replace the default placeholder scenes by passing `beforeSrc` and `afterSrc`
 * (or `beforeNode`/`afterNode` for full custom content).
 */
export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Before",
  afterAlt = "After",
  beforeNode,
  afterNode,
  initial = 52,
  aspect = "16/10",
  className,
  autoSlideOnMount = false,
}: BeforeAfterSliderProps) {
  const [pos, setPos] = useState(autoSlideOnMount ? 100 : initial);
  const [isAnimating, setIsAnimating] = useState(autoSlideOnMount);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  // Auto-demonstrate on mount: slide all the way "before" → reveal "after" → settle
  useEffect(() => {
    if (!autoSlideOnMount) return;
    const t1 = window.setTimeout(() => setPos(15), 700);
    const t2 = window.setTimeout(() => setPos(85), 2400);
    const t3 = window.setTimeout(() => {
      setPos(50);
    }, 3700);
    const tEnd = window.setTimeout(() => setIsAnimating(false), 4900);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(tEnd);
    };
  }, [autoSlideOnMount]);

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const next = (x / rect.width) * 100;
    setPos(Math.min(100, Math.max(0, next)));
  }, []);

  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!draggingRef.current) return;
      updateFromClientX(e.clientX);
    }
    function onTouchMove(e: TouchEvent) {
      if (!draggingRef.current) return;
      if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
    }
    function onUp() {
      draggingRef.current = false;
      document.body.style.cursor = "";
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [updateFromClientX]);

  const startDrag = useCallback((clientX: number) => {
    draggingRef.current = true;
    setIsAnimating(false); // user took control — disable smooth transitions
    document.body.style.cursor = "ew-resize";
    updateFromClientX(clientX);
  }, [updateFromClientX]);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPos((p) => Math.max(0, p - 4));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPos((p) => Math.min(100, p + 4));
      }
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      className={`relative isolate w-full overflow-hidden rounded-[2rem] border border-outline/80 bg-stone-100 shadow-raised select-none ${className ?? ""}`}
      style={{ aspectRatio: aspect }}
      onMouseDown={(e) => startDrag(e.clientX)}
      onTouchStart={(e) => e.touches[0] && startDrag(e.touches[0].clientX)}
    >
      {/* AFTER (full layer, behind) */}
      <div className="absolute inset-0">
        {afterSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={afterSrc}
            alt={afterAlt}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          afterNode ?? <DefaultAfterScene />
        )}
      </div>

      {/* BEFORE (clipped from the left to the slider position) */}
      <div
        className={`absolute inset-0 ${isAnimating ? "transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]" : ""}`}
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        {beforeSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={beforeSrc}
            alt={beforeAlt}
            className="h-full w-full object-cover"
            draggable={false}
          />
        ) : (
          beforeNode ?? <DefaultBeforeScene />
        )}
      </div>

      {/* Corner labels */}
      <div className="pointer-events-none absolute left-5 top-5 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
        Before
      </div>
      <div className="pointer-events-none absolute right-5 top-5 rounded-full bg-black/55 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur-sm">
        After · Plumely
      </div>

      {/* Slider line + handle */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Drag to compare before and after"
        aria-valuenow={Math.round(pos)}
        aria-valuemin={0}
        aria-valuemax={100}
        onKeyDown={onKeyDown}
        className={`absolute inset-y-0 z-10 -translate-x-1/2 cursor-ew-resize outline-none ${isAnimating ? "transition-[left] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]" : ""}`}
        style={{ left: `${pos}%` }}
      >
        <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white shadow-[0_0_24px_rgba(0,0,0,0.35)]" />
        <div className="absolute top-1/2 left-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_8px_24px_rgba(0,0,0,0.18),0_2px_4px_rgba(0,0,0,0.08)] ring-1 ring-black/5">
          <ArrowLeftRight className="h-5 w-5" strokeWidth={2} />
        </div>
      </div>

      {/* Hint pill (auto-hides after first drag — purely cosmetic, persists for now) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-5 flex justify-center">
        <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-ink-soft shadow-sm backdrop-blur">
          Drag to compare
        </span>
      </div>
    </div>
  );
}

/**
 * Atmospheric placeholder — a dim interior at dusk (BEFORE).
 * Replace by passing real imagery via the `beforeSrc` prop.
 */
function DefaultBeforeScene() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Deep navy-charcoal base — the dim room */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(170deg, #14161e 0%, #1c2030 45%, #0f1118 100%)",
        }}
      />
      {/* Subtle cool window glow from the upper right */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 55% at 88% 18%, rgba(150,180,225,0.16), transparent 65%)",
        }}
      />
      {/* Faint floor-level haze */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.35) 100%)",
        }}
      />
      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 70% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)",
        }}
      />
      {/* Film grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}

/**
 * Atmospheric placeholder — same scene with a warm fixture lit (AFTER).
 * Replace by passing real imagery via the `afterSrc` prop.
 */
function DefaultAfterScene() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Slightly warmer base than before */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(170deg, #1a1813 0%, #221d15 45%, #100c08 100%)",
        }}
      />
      {/* Cool window glow (same position as before) */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 55% at 88% 18%, rgba(150,180,225,0.10), transparent 65%)",
        }}
      />
      {/* Big warm pool — the fixture's primary throw */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 55% at 38% 30%, rgba(255,196,108,0.45), transparent 70%)",
        }}
      />
      {/* Wider warm wash for ambient lift */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(75% 80% at 38% 35%, rgba(245,158,11,0.18), transparent 75%)",
        }}
      />
      {/* Light pool on imaginary floor below the fixture */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-2/3"
        style={{
          background:
            "radial-gradient(40% 50% at 38% 100%, rgba(255,196,108,0.30), transparent 70%)",
        }}
      />
      {/* Bounce on the far wall */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-2/3"
        style={{
          background:
            "radial-gradient(40% 50% at 0% 50%, rgba(245,158,11,0.10), transparent 65%)",
        }}
      />
      {/* Pendant cord — thin warm-tinted line */}
      <div
        aria-hidden
        className="absolute"
        style={{
          left: "38%",
          top: "0",
          width: "1px",
          height: "30%",
          background:
            "linear-gradient(180deg, rgba(255,220,170,0.0) 0%, rgba(255,220,170,0.55) 100%)",
        }}
      />
      {/* The bulb itself — bright, glowing core */}
      <div
        aria-hidden
        className="absolute animate-glow"
        style={{
          left: "38%",
          top: "30%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="h-10 w-10 rounded-full bg-gradient-to-b from-amber-50 via-amber-100 to-amber-300 shadow-[0_0_50px_18px_rgba(255,196,108,0.65),0_0_120px_40px_rgba(245,158,11,0.35)]" />
      </div>
      {/* Vignette */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(80% 70% at 38% 35%, transparent 60%, rgba(0,0,0,0.45) 100%)",
        }}
      />
      {/* Film grain */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />
    </div>
  );
}
