import Link from "next/link";
import { Suspense } from "react";
import { CategoryPage } from "@/components/sections/CategoryPage";

export default function Page() {
  return (
    <>
      <div className="mx-auto mt-6 max-w-6xl px-4">
        <div className="rounded-2xl border border-[var(--bayou-gold)]/30 bg-[var(--bayou-gold)]/20 p-5">
          <p className="text-sm uppercase tracking-wider text-[var(--warm-gray)]">Community Cookbook</p>
          <Link href="/recipes/submit" className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-[var(--bayou-gold)] px-6 py-3 text-lg font-bold text-[var(--cast-iron)] shadow-sm hover:shadow-md">📝 Submit a Recipe</Link>
        </div>
      </div>
      <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><CategoryPage type="recipes" title="Recipes" /></Suspense>
    </>
  );
}
