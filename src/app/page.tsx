import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Lightbulb, Sparkles, Wand2, ShieldCheck } from "lucide-react";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://plumely.ai";

export const metadata: Metadata = {
  title: "AI lighting visualization for any room",
  description:
    "Plumely is the AI tool lighting brands and shoppers use to see fixtures installed in real rooms before purchase. Upload a fixture, upload a room — get a photoreal preview in seconds.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Plumely — See lighting in your room before you buy",
    description:
      "Upload a fixture and a photo of your room. Plumely places it, scales it, and lights it — photoreal, in seconds.",
    url: SITE_URL,
    type: "website",
  },
};

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Plumely",
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  email: "hello@plumely.ai",
  description:
    "AI lighting visualization platform. Upload a fixture and a room photo to see the light installed in the space.",
  sameAs: [],
};

const PRODUCT_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Plumely",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE_URL,
  description:
    "Photoreal AI tool that composites a lighting fixture into a customer's room photo, with realistic scale and illumination.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
  audience: {
    "@type": "Audience",
    audienceType: "Lighting brands and homeowners",
  },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does Plumely work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You upload one photo of a lighting fixture and one photo of your room. Plumely's AI composites the fixture into the scene with realistic placement, scale, shadows, and on-state illumination.",
      },
    },
    {
      "@type": "Question",
      name: "What kinds of lights does Plumely support?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pendants, chandeliers, flush mounts, wall sconces, table lamps, floor lamps, LED strips, neon signs, recessed lights, and track lighting.",
      },
    },
    {
      "@type": "Question",
      name: "Who is Plumely for?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Lighting brands embed Plumely on product pages to lift conversion and reduce returns. Homeowners use it to confidently decide before they buy.",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-ink">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <ForBrands />
        <FinalCTA />
      </main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-outline/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-on-primary">
            <Lightbulb className="h-4 w-4" />
          </span>
          <span className="text-lg font-bold tracking-tight">Plumely</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-ink-muted md:flex">
          <a href="#how" className="hover:text-ink">How it works</a>
          <a href="#brands" className="hover:text-ink">For brands</a>
          <Link href="/login" className="hover:text-ink">Sign in</Link>
        </nav>
        <Link
          href="/app"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-soft transition hover:bg-primary-bright"
        >
          Try the demo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-primary-soft/60 blur-3xl" />
        <div className="absolute right-[-10%] top-40 h-80 w-80 rounded-full bg-accent-soft/50 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-6 pt-24 pb-20 md:pt-32 md:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-outline/60 bg-white/70 px-3 py-1 text-xs font-semibold text-ink-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            AI lighting visualization for e-commerce
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-ink md:text-6xl md:leading-[1.05]">
            See the light in your room
            <span className="block text-primary">before you buy it.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-ink-muted md:text-xl">
            Upload a fixture and a photo of your room. Plumely places it,
            scales it, and lights it — photoreal, in seconds.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/app"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-on-primary shadow-soft transition hover:bg-primary-bright sm:w-auto"
            >
              Try Plumely free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#brands"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-outline px-6 py-3 text-base font-semibold text-ink transition hover:border-primary hover:text-primary sm:w-auto"
            >
              For lighting brands
            </a>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="rounded-3xl border border-outline/50 bg-surface p-2 shadow-raised">
            <div className="aspect-[16/9] w-full overflow-hidden rounded-2xl bg-gradient-to-br from-surface-mid via-surface-low to-white">
              <div className="grid h-full grid-cols-3 gap-2 p-3">
                <PreviewTile label="Your room" tone="room" />
                <PreviewTile label="Your light" tone="light" />
                <PreviewTile label="Plumely" tone="result" highlight />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewTile({
  label,
  tone,
  highlight = false,
}: {
  label: string;
  tone: "room" | "light" | "result";
  highlight?: boolean;
}) {
  const bg =
    tone === "room"
      ? "bg-[radial-gradient(circle_at_30%_70%,#dce9ff,transparent_60%)] bg-surface-low"
      : tone === "light"
        ? "bg-[radial-gradient(circle_at_50%_30%,#ffddb8,transparent_55%)] bg-surface-low"
        : "bg-[radial-gradient(circle_at_50%_25%,#ffddb8,transparent_45%),radial-gradient(circle_at_70%_75%,#dce9ff,transparent_55%)] bg-surface-mid";
  return (
    <div
      className={`relative flex h-full flex-col justify-end overflow-hidden rounded-xl border ${
        highlight ? "border-primary/50 ring-2 ring-primary/20" : "border-outline/40"
      } ${bg}`}
    >
      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-semibold text-ink-muted">
          {label}
        </span>
        {highlight && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-on-primary">
            Generated
          </span>
        )}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Pick a fixture",
      body: "Upload (or pick from a brand catalog) the light you're considering — pendant, sconce, chandelier.",
      Icon: Lightbulb,
    },
    {
      n: "02",
      title: "Snap your room",
      body: "One photo of where you want it to live. No lidar, no app, no AR — just a phone shot.",
      Icon: Wand2,
    },
    {
      n: "03",
      title: "See it for real",
      body: "Plumely composes the fixture into the scene with realistic scale, shadows, and color cast.",
      Icon: Sparkles,
    },
  ];
  return (
    <section id="how" className="border-y border-outline/40 bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
            Three steps from doubt to confidence.
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map(({ n, title, body, Icon }) => (
            <div
              key={n}
              className="rounded-2xl border border-outline/50 bg-white p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-raised"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold tracking-widest text-ink-muted">
                  {n}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForBrands() {
  const points = [
    "Lift conversion on PDPs by letting buyers visualize before they checkout.",
    "Cut returns from the #1 cause: 'didn't fit the space.'",
    "Drop-in widget — embed once, works across your catalog.",
    "Per-SKU analytics: which fixtures get visualized, viewed, bought.",
  ];
  return (
    <section id="brands" className="bg-background">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">
              For lighting brands
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
              Stop selling lights customers can&apos;t picture.
            </h2>
            <p className="mt-5 text-lg text-ink-muted">
              Plumely turns your product page into a try-before-you-buy experience.
              Higher conversion, fewer returns, more confident shoppers.
            </p>

            <ul className="mt-8 space-y-4">
              {points.map((p) => (
                <li key={p} className="flex gap-3">
                  <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                    <ShieldCheck className="h-3 w-3" />
                  </span>
                  <span className="text-sm leading-relaxed text-ink">{p}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10">
              <a
                href="mailto:hello@plumely.ai?subject=Plumely%20pilot"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary"
              >
                Book a pilot <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-3xl border border-outline/50 bg-surface p-8 shadow-raised">
              <div className="space-y-4">
                <Stat label="Avg. conversion lift" value="+18%" tone="primary" />
                <Stat label="Returns reduction" value="-23%" tone="accent" />
                <Stat label="Time to visualize" value="~12s" tone="ink" />
              </div>
            </div>
            <p className="mt-3 text-xs text-ink-muted">
              Indicative ranges from comparable AR/visualization deployments. Pilot
              data forthcoming.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "primary" | "accent" | "ink";
}) {
  const color =
    tone === "primary"
      ? "text-primary"
      : tone === "accent"
        ? "text-accent"
        : "text-ink";
  return (
    <div className="flex items-baseline justify-between rounded-xl bg-white px-5 py-4">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      <span className={`text-2xl font-extrabold tracking-tight ${color}`}>
        {value}
      </span>
    </div>
  );
}

function FinalCTA() {
  return (
    <section className="bg-surface">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Ready to see your room in a new light?
        </h2>
        <p className="mt-4 text-lg text-ink-muted">
          Free to try. No credit card. Two photos and you&apos;re done.
        </p>
        <Link
          href="/app"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-base font-semibold text-on-primary shadow-soft transition hover:bg-primary-bright"
        >
          Try Plumely free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-outline/40 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-ink-muted md:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-on-primary">
            <Lightbulb className="h-3 w-3" />
          </span>
          <span className="font-semibold text-ink">Plumely</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="mailto:hello@plumely.ai" className="hover:text-ink">Contact</a>
          <Link href="/login" className="hover:text-ink">Sign in</Link>
        </div>
      </div>
    </footer>
  );
}
