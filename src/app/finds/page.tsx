import { Suspense } from "react";
import { CategoryPage } from "@/components/sections/CategoryPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Hidden Finds in Acadiana — Off-the-Radar Gems | GeauxFind",
  description: "Explore hidden gems and local finds across Acadiana that most visitors miss.",
  path: "/finds",
});

export default function Page() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><CategoryPage type="finds" title="Local Finds" /></Suspense>;
}
