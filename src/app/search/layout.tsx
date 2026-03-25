import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Search Acadiana Places, Events & Recipes | GeauxFind",
  description: "Search GeauxFind for Acadiana restaurants, festivals, music spots, hidden gems, and Cajun recipes.",
  path: "/search",
});

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
