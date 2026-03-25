import { Suspense } from "react";
import { CategoryPage } from "@/components/sections/CategoryPage";

export default function Page() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><CategoryPage type="music" title="Music & Nightlife" /></Suspense>;
}
