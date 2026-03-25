import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Crawfish Season in Acadiana — Live Prices & Best Spots | GeauxFind",
  description: "Track crawfish prices, top boil spots, and seasonal tips across Lafayette and Acadiana during crawfish season.",
  path: "/crawfish",
});

export default function CrawfishLayout({ children }: { children: React.ReactNode }) {
  return children;
}
