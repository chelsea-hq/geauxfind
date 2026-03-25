import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Ask Geaux — Your AI Guide to Cajun Country | GeauxFind",
  description: "Ask Geaux anything about food, festivals, music, and hidden gems in Acadiana for fast local recommendations.",
  path: "/ask",
});

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
