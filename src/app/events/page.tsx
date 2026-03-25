import { Suspense } from "react";
import { CategoryPage } from "@/components/sections/CategoryPage";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Events in Acadiana — Festivals, Music & More | GeauxFind",
  description: "Find upcoming festivals, concerts, food events, and community happenings across Acadiana.",
  path: "/events",
});

export default function Page() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><CategoryPage type="events" title="Events & Festivals" /></Suspense>;
}
