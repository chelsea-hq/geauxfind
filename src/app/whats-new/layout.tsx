import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "What's New in Acadiana — Local Openings, Events & Buzz | GeauxFind",
  description: "Stay on top of the latest Acadiana openings, local news, events, and community updates.",
  path: "/whats-new",
});

export default function WhatsNewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
