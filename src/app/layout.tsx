import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE_URL } from "@/lib/seo";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--font-body" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "GeauxFind — Discover the Best of Acadiana | Food, Events & Hidden Gems",
  description: "AI-curated local discovery for Acadiana, Louisiana — find top food, festivals, music, and hidden local gems.",
  alternates: { canonical: SITE_URL },
  other: {
    "geo.region": "US-LA",
    "geo.placename": "Lafayette, Louisiana",
  },
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "GeauxFind — Discover Acadiana",
    description: "AI-curated local discovery — 4,000+ restaurants, bars, music venues, outdoor adventures & hidden gems across Lafayette and Acadiana, Louisiana.",
    type: "website",
    locale: "en_US",
    siteName: "GeauxFind",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GeauxFind — Discover the Best of Acadiana, Louisiana" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeauxFind — Discover Acadiana",
    description: "AI-curated local discovery — 4,000+ restaurants, bars, music venues & hidden gems across Acadiana.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${bodyFont.variable} bg-[var(--cream)] pb-20 text-[var(--cast-iron)] md:pb-0`}>
        <SiteHeader />
        <Breadcrumbs />
        {children}
        <Footer />
        <MobileBottomNav />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
