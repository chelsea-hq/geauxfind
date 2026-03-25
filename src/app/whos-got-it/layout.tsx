import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Who's Got the Best? — Acadiana Food Battles | GeauxFind",
  description: "Vote in local food battles, compare Acadiana favorites, and discover where locals say the best bites are hiding.",
  path: "/whos-got-it",
});

export default function WhosGotItLayout({ children }: { children: React.ReactNode }) {
  return children;
}
