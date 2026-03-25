"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { RecipeCard } from "@/components/cards/RecipeCard";
import { SearchBar } from "@/components/SearchBar";
import { events, places, recipes } from "@/data/mock-data";
import { Place } from "@/types";

const MAX_PER_SECTION = 20;

type SmartResult = Place & { why: string };

const isNaturalLanguageQuery = (input: string) => {
  const q = input.trim().toLowerCase();
  if (!q) return false;
  const hasQuestionWords = /\b(where|what|best|near|open|can i|get|looking for|recommend|after|with|under)\b/.test(q);
  const hasLongForm = q.split(/\s+/).length >= 5;
  return hasQuestionWords || hasLongForm;
};

function SearchContent() {
  const params = useSearchParams();
  const pathname = usePathname();
  const q = (params.get("q") ?? "").trim();
  const tab = params.get("tab") ?? "all";

  const [smartResults, setSmartResults] = useState<SmartResult[] | null>(null);
  const [parsedIntent, setParsedIntent] = useState("");

  const nlMode = isNaturalLanguageQuery(q);

  useEffect(() => {
    if (!q || !nlMode) {
      setSmartResults(null);
      setParsedIntent("");
      return;
    }

    fetch(`/api/smart-search?q=${encodeURIComponent(q)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setSmartResults(Array.isArray(data?.results) ? data.results : []);
        setParsedIntent(data?.parsedIntent || q);
      })
      .catch(() => {
        setSmartResults(null);
        setParsedIntent("");
      });
  }, [q, nlMode]);

  const placeResults = useMemo(() => places.filter((p) => `${p.name} ${p.description} ${p.tags.join(" ")} ${p.city}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const eventResults = useMemo(() => events.filter((e) => `${e.name} ${e.description} ${e.tags.join(" ")} ${e.city}`.toLowerCase().includes(q.toLowerCase())), [q]);
  const recipeResults = useMemo(() => recipes.filter((r) => `${r.title} ${r.ingredients.join(" ")} ${r.inspiredBy}`.toLowerCase().includes(q.toLowerCase())), [q]);

  const effectivePlaceResults = smartResults ?? placeResults;
  const total = effectivePlaceResults.length + (smartResults ? 0 : eventResults.length + recipeResults.length);
  const withTab = (nextTab: string) => `${pathname}?${new URLSearchParams({ ...Object.fromEntries(params.entries()), tab: nextTab }).toString()}`;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <SearchBar />
      <h1 className="mt-6 text-balance font-serif text-4xl text-[var(--cajun-red)]">{total} results for &quot;{q}&quot;</h1>

      {smartResults && (
        <div className="mt-4 rounded-xl border border-[var(--bayou-gold)]/40 bg-[linear-gradient(135deg,#fffaf1,#fff2db)] p-4 text-sm">
          🤖 AI understood: Looking for <span className="font-semibold">{parsedIntent}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={withTab("all")} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${tab === "all" ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>All</Link>
        <Link href={withTab("places")} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${tab === "places" ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>Places ({effectivePlaceResults.length})</Link>
        {!smartResults && <Link href={withTab("events")} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${tab === "events" ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>Events ({eventResults.length})</Link>}
        {!smartResults && <Link href={withTab("recipes")} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${tab === "recipes" ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>Recipes ({recipeResults.length})</Link>}
      </div>

      {total === 0 ? (
        <div className="mt-8 rounded-xl border bg-white p-8 text-center">
          <Image src="/mascot/gator-search.svg" alt="Geaux searching" width={140} height={140} className="mx-auto mb-3 h-28 w-28" />
          <p className="font-semibold text-[var(--cast-iron)]">Looking for something? Geaux has you covered!</p>
          <p className="mt-1">Nothing found for &quot;{q}&quot;. Try asking our AI → <Link href="/ask" className="underline">Ask Acadiana</Link></p>
        </div>
      ) : (
        <>
          {(tab === "all" || tab === "places") && (
            <section className="mt-8">
              <h2 className="font-serif text-2xl">Places ({effectivePlaceResults.length})</h2>
              <div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {effectivePlaceResults.slice(0, MAX_PER_SECTION).map((item) => (
                  <div key={item.slug} className="space-y-2">
                    <PlaceCard place={item} />
                    {(item as SmartResult).why && <p className="rounded-xl border bg-white p-3 text-sm">✨ {(item as SmartResult).why}</p>}
                  </div>
                ))}
              </div>
              {effectivePlaceResults.length > MAX_PER_SECTION && <Link href="/explore" className="mt-4 inline-block underline">See all {effectivePlaceResults.length} results</Link>}
            </section>
          )}

          {!smartResults && (tab === "all" || tab === "events") && <section className="mt-8"><h2 className="font-serif text-2xl">Events ({eventResults.length})</h2><div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{eventResults.slice(0, MAX_PER_SECTION).map((item) => <EventCard key={item.slug} event={item} />)}</div>{eventResults.length > MAX_PER_SECTION && <Link href="/events" className="mt-4 inline-block underline">See all {eventResults.length} results</Link>}</section>}
          {!smartResults && (tab === "all" || tab === "recipes") && <section className="mt-8"><h2 className="font-serif text-2xl">Recipes ({recipeResults.length})</h2><div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{recipeResults.slice(0, MAX_PER_SECTION).map((item) => <RecipeCard key={item.slug} recipe={item} />)}</div>{recipeResults.length > MAX_PER_SECTION && <Link href="/recipes" className="mt-4 inline-block underline">See all {recipeResults.length} results</Link>}</section>}
        </>
      )}
    </main>
  );
}

export default function SearchPage() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><SearchContent /></Suspense>;
}
