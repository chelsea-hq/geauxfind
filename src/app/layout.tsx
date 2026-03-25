import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { SiteHeader } from "@/components/layout/SiteHeader";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-display" });
const inter = Inter({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "GeauxFind — Discover Acadiana",
  description: "AI-curated local discovery for food, festivals, music, and hidden gems across Acadiana, Louisiana.",
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
      <body className={`${playfair.variable} ${inter.variable} bg-[var(--cream-bg)] pb-20 text-[var(--cast-iron)] md:pb-0`}>
        <SiteHeader />
        {children}
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
