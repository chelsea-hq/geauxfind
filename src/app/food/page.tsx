import { Suspense } from "react";
import { CategoryPage } from "@/components/sections/CategoryPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Best Food in Acadiana — Cajun & Creole Favorites | GeauxFind",
  description: "Discover top-rated food and drink spots across Acadiana, from po'boys and boudin to seafood and local classics.",
  path: "/food",
});

export default function Page() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><CategoryPage type="food" title="Food & Drink" /></Suspense>;
}
