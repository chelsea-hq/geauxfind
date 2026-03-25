import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Explore Acadiana — Restaurants, Music, Events & More | GeauxFind",
  description: "Explore restaurants, live music, events, shopping, and hidden gems across Acadiana with smart filters and local insight.",
  path: "/explore",
});

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
