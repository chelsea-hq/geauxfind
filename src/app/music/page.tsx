import { Suspense } from "react";
import { CategoryPage } from "@/components/sections/CategoryPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Live Music in Acadiana — Cajun, Zydeco & More | GeauxFind",
  description: "Find live music venues, dance halls, and local nightlife around Lafayette and greater Acadiana.",
  path: "/music",
});

export default function Page() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><CategoryPage type="music" title="Music & Nightlife" /></Suspense>;
}
