import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { SITE_URL } from "@/lib/seo";

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
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "GeauxFind — Discover Acadiana",
    description: "Find the best food, events, music, and hidden gems across Lafayette and Acadiana.",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "GeauxFind — Discover Acadiana" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "GeauxFind — Discover Acadiana",
    description: "Find the best food, events, music, and hidden gems across Lafayette and Acadiana.",
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
      </body>
    </html>
  );
}
