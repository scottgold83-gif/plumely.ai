import type { Metadata, Viewport } from "next";
import {
  Manrope,
  Fraunces,
  JetBrains_Mono,
  Instrument_Serif,
  Playfair_Display,
} from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans-manrope",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz", "SOFT"],
  variable: "--font-display-fraunces",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-jb",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://plumely.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Plumely — Try before you buy",
    template: "%s · Plumely",
  },
  description:
    "Plumely turns one fixture photo and one room photo into a photoreal preview of the light installed and on. Built for lighting brands that want fewer returns and higher conversion.",
  applicationName: "Plumely",
  keywords: [
    "AI lighting visualization",
    "see lighting in your room",
    "lighting product preview",
    "light fixture visualizer",
    "lighting brands ecommerce",
    "pendant light preview",
    "chandelier visualizer",
    "before you buy lighting",
  ],
  authors: [{ name: "Plumely" }],
  creator: "Plumely",
  publisher: "Plumely",
  category: "Technology",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Plumely",
    title: "Plumely — Try before you buy",
    description:
      "AI lighting visualization. One fixture photo and one room photo become a photoreal preview, in seconds.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plumely — Try before you buy",
    description:
      "AI lighting visualization. One fixture photo and one room photo become a photoreal preview, in seconds.",
    creator: "@plumely",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  formatDetection: { email: false, address: false, telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#faf8f3",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${fraunces.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
