import type { Metadata, Viewport } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://plumely.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Plumely — AI lighting visualization for any room",
    template: "%s · Plumely",
  },
  description:
    "Plumely lets shoppers see any light fixture installed in their own room before they buy. Upload a fixture and a room photo — get a photoreal result in seconds.",
  applicationName: "Plumely",
  keywords: [
    "AI lighting visualization",
    "see lighting in your room",
    "lighting product preview",
    "light fixture visualizer",
    "AR lighting tool",
    "ecommerce lighting",
    "pendant light preview",
    "chandelier visualizer",
    "lighting brands conversion",
    "before you buy lighting",
  ],
  authors: [{ name: "Plumely" }],
  creator: "Plumely",
  publisher: "Plumely",
  category: "Technology",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Plumely",
    title: "Plumely — See lighting in your room before you buy",
    description:
      "Upload a fixture and a photo of your room. Plumely places it, scales it, and lights it — photoreal, in seconds.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Plumely — AI lighting visualization",
    description:
      "Upload a fixture and a photo of your room. Plumely places it, scales it, and lights it — photoreal, in seconds.",
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
  icons: {
    icon: "/favicon.ico",
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#003ec7",
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
    <html lang="en" className={`${manrope.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-ink">
        {children}
      </body>
    </html>
  );
}
