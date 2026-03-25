"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { RecipeCard } from "@/components/cards/RecipeCard";
import { SearchBar } from "@/components/SearchBar";
import { events, places, recipes } from "@/data/mock-data";

const MAX_PER_SECTION = 20;

function SearchContent() {
  const params = useSearchParams();
  const pathname = usePathname();
  const q = (params.get("q") ?? "").toLowerCase().trim();
  const tab = params.get("tab") ?? "all";

  const placeResults = useMemo(() => places.filter((p) => `${p.name} ${p.description} ${p.tags.join(" ")} ${p.city}`.toLowerCase().includes(q)), [q]);
  const eventResults = useMemo(() => events.filter((e) => `${e.name} ${e.description} ${e.tags.join(" ")} ${e.city}`.toLowerCase().includes(q)), [q]);
  const recipeResults = useMemo(() => recipes.filter((r) => `${r.title} ${r.ingredients.join(" ")} ${r.inspiredBy}`.toLowerCase().includes(q)), [q]);

  const total = placeResults.length + eventResults.length + recipeResults.length;
  const withTab = (nextTab: string) => `${pathname}?${new URLSearchParams({ ...Object.fromEntries(params.entries()), tab: nextTab }).toString()}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <SearchBar />
      <h1 className="mt-6 text-balance font-serif text-4xl text-[var(--cajun-red)]">{total} results for &quot;{q}&quot;</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={withTab("all")} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${tab === "all" ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>All</Link>
        <Link href={withTab("places")} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${tab === "places" ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>Places ({placeResults.length})</Link>
        <Link href={withTab("events")} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${tab === "events" ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>Events ({eventResults.length})</Link>
        <Link href={withTab("recipes")} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${tab === "recipes" ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>Recipes ({recipeResults.length})</Link>
      </div>

      {total === 0 ? (
        <div className="mt-8 rounded-xl border bg-white p-8 text-center">
          Nothing found for &quot;{q}&quot;. Try asking our AI → <Link href="/ask" className="underline">Ask Acadiana</Link>
        </div>
      ) : (
        <>
          {(tab === "all" || tab === "places") && <section className="mt-8"><h2 className="font-serif text-2xl">Places ({placeResults.length})</h2><div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{placeResults.slice(0, MAX_PER_SECTION).map((item) => <PlaceCard key={item.slug} place={item} />)}</div>{placeResults.length > MAX_PER_SECTION && <Link href="/explore" className="mt-4 inline-block underline">See all {placeResults.length} results</Link>}</section>}
          {(tab === "all" || tab === "events") && <section className="mt-8"><h2 className="font-serif text-2xl">Events ({eventResults.length})</h2><div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{eventResults.slice(0, MAX_PER_SECTION).map((item) => <EventCard key={item.slug} event={item} />)}</div>{eventResults.length > MAX_PER_SECTION && <Link href="/events" className="mt-4 inline-block underline">See all {eventResults.length} results</Link>}</section>}
          {(tab === "all" || tab === "recipes") && <section className="mt-8"><h2 className="font-serif text-2xl">Recipes ({recipeResults.length})</h2><div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{recipeResults.slice(0, MAX_PER_SECTION).map((item) => <RecipeCard key={item.slug} recipe={item} />)}</div>{recipeResults.length > MAX_PER_SECTION && <Link href="/recipes" className="mt-4 inline-block underline">See all {recipeResults.length} results</Link>}</section>}
        </>
      )}
    </main>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><SearchContent /></Suspense>;
}
