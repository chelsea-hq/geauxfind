"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { events, places, recipes } from "@/data/mock-data";
import { useLocation } from "@/hooks/useLocation";
import { getCityCoordinates, haversineMiles } from "@/lib/distance";

type FilterKey = "all" | "food" | "events" | "music" | "recipes" | "finds";
type SortKey = "relevant" | "rated" | "nearest";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "All" },
  { key: "food", label: "Food & Drink" },
  { key: "events", label: "Events" },
  { key: "music", label: "Music" },
  { key: "recipes", label: "Recipes" },
  { key: "finds", label: "Finds" },
];

const tokenize = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);

const scoreText = (query: string, fields: Array<{ text: string; weight: number }>) => {
  const tokens = tokenize(query);
  if (!tokens.length) return 0;

  let score = 0;
  for (const token of tokens) {
    for (const field of fields) {
      const hay = field.text.toLowerCase();
      if (hay.includes(token)) score += field.weight;
      const exactMatches = hay.match(new RegExp(`\\b${token}\\b`, "g"))?.length ?? 0;
      score += Math.min(exactMatches, 3);
    }
  }

  return score;
};

export default function SearchPage() {
  const [q, setQ] = useState("");
  const { lat, lng, city } = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ((params.get("q") ?? "").trim());
  }, []);

  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("relevant");

  const placeResults = useMemo(() => {
    if (!q) return [];
    const hits = places
      .map((place) => {
        const relevance = scoreText(q, [
          { text: place.name, weight: 8 },
          { text: place.category, weight: 5 },
          { text: place.city, weight: 4 },
          { text: place.cuisine ?? "", weight: 4 },
          { text: place.tags.join(" "), weight: 4 },
          { text: place.description, weight: 3 },
        ]);

        const coords = getCityCoordinates(place.city);
        const distanceMiles = coords ? haversineMiles({ lat, lng }, coords) : null;
        const locationBoost = distanceMiles === null ? 0 : Math.max(0, 8 - distanceMiles / 8);

        return {
          ...place,
          relevance: relevance + place.rating * 0.35 + locationBoost,
          distanceMiles,
        };
      })
      .filter((item) => item.relevance > 0);

    return hits;
  }, [q, lat, lng]);

  const eventResults = useMemo(() => {
    if (!q) return [];
    return events
      .map((event) => {
        const relevance = scoreText(q, [
          { text: event.name, weight: 8 },
          { text: event.venue, weight: 4 },
          { text: event.city, weight: 4 },
          { text: event.tags.join(" "), weight: 4 },
          { text: event.description, weight: 3 },
        ]);

        const coords = getCityCoordinates(event.city);
        const distanceMiles = coords ? haversineMiles({ lat, lng }, coords) : null;
        return { ...event, relevance, distanceMiles };
      })
      .filter((item) => item.relevance > 0);
  }, [q, lat, lng]);

  const recipeResults = useMemo(() => {
    if (!q) return [];
    return recipes
      .map((recipe) => ({
        ...recipe,
        relevance: scoreText(q, [
          { text: recipe.title, weight: 8 },
          { text: recipe.ingredients.join(" "), weight: 4 },
          { text: recipe.inspiredBy, weight: 3 },
        ]),
      }))
      .filter((item) => item.relevance > 0);
  }, [q]);

  const defaultSort: SortKey = city ? "nearest" : "relevant";
  const activeSort = sort === "relevant" && city ? defaultSort : sort;

  const sortedPlaces = useMemo(() => {
    const list = [...placeResults];
    if (activeSort === "rated") return list.sort((a, b) => b.rating - a.rating || b.relevance - a.relevance);
    if (activeSort === "nearest") {
      return list.sort((a, b) => (a.distanceMiles ?? 9999) - (b.distanceMiles ?? 9999) || b.relevance - a.relevance);
    }
    return list.sort((a, b) => b.relevance - a.relevance || b.rating - a.rating);
  }, [placeResults, activeSort]);

  const sortedEvents = useMemo(() => {
    const list = [...eventResults];
    if (activeSort === "nearest") return list.sort((a, b) => (a.distanceMiles ?? 9999) - (b.distanceMiles ?? 9999) || b.relevance - a.relevance);
    return list.sort((a, b) => b.relevance - a.relevance);
  }, [eventResults, activeSort]);

  const sortedRecipes = useMemo(() => {
    const list = [...recipeResults];
    if (activeSort === "rated") return list.sort((a, b) => b.rating - a.rating || b.relevance - a.relevance);
    return list.sort((a, b) => b.relevance - a.relevance || b.rating - a.rating);
  }, [recipeResults, activeSort]);

  const total = sortedPlaces.length + sortedEvents.length + sortedRecipes.length;

  const showPlaces = filter === "all" || filter === "food" || filter === "music" || filter === "finds";
  const showEvents = filter === "all" || filter === "events";
  const showRecipes = filter === "all" || filter === "recipes";

  if (!q) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-serif text-4xl text-[var(--cajun-red)]">Search Acadiana</h1>
        <p className="mt-3 text-[var(--warm-gray)]">Try popular categories and trending searches to get started.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border p-5">
            <h2 className="font-semibold">Popular Categories</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/food" className="rounded-full border px-3 py-1.5 text-sm">Food & Drink</Link>
              <Link href="/events" className="rounded-full border px-3 py-1.5 text-sm">Events</Link>
              <Link href="/music" className="rounded-full border px-3 py-1.5 text-sm">Music</Link>
              <Link href="/finds" className="rounded-full border px-3 py-1.5 text-sm">Finds</Link>
              <Link href="/recipes" className="rounded-full border px-3 py-1.5 text-sm">Recipes</Link>
            </div>
          </div>
          <div className="rounded-2xl border p-5">
            <h2 className="font-semibold">Trending Searches</h2>
            <div className="mt-3 flex flex-col gap-2 text-sm">
              <Link href="/search?q=best+crawfish" className="underline">best crawfish</Link>
              <Link href="/search?q=live+music+lafayette" className="underline">live music lafayette</Link>
              <Link href="/search?q=family+friendly+events" className="underline">family friendly events</Link>
              <Link href="/search?q=date+night" className="underline">date night</Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">{total} results for “{q}”</h1>
      {city && <p className="mt-2 text-sm text-[var(--warm-gray)]">Using your location near {city} for better ranking.</p>}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setFilter(option.key)}
            className={`rounded-full border px-3 py-1.5 text-sm ${filter === option.key ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}
          >
            {option.label}
          </button>
        ))}

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="ml-auto rounded-full border bg-white px-3 py-1.5 text-sm"
        >
          <option value="relevant">Most Relevant</option>
          <option value="rated">Highest Rated</option>
          {city && <option value="nearest">Nearest</option>}
        </select>
      </div>

      {showPlaces && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Places ({sortedPlaces.length})</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {sortedPlaces.map((place) => (
              <Link key={place.slug} href={`/place/${place.slug}`} className="rounded-2xl border bg-white p-4">
                <h3 className="font-semibold">{place.name}</h3>
                <p className="text-sm text-[var(--warm-gray)]">{place.city} · {place.cuisine ?? place.category} · ⭐ {place.rating.toFixed(1)}</p>
                {place.distanceMiles !== null && <p className="text-xs text-[var(--warm-gray)]">{place.distanceMiles.toFixed(1)} mi away</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {showEvents && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Events ({sortedEvents.length})</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {sortedEvents.map((event) => (
              <Link key={event.slug} href={`/event/${event.slug}`} className="rounded-2xl border bg-white p-4">
                <h3 className="font-semibold">{event.name}</h3>
                <p className="text-sm text-[var(--warm-gray)]">{event.city} · {event.venue}</p>
                {event.distanceMiles !== null && <p className="text-xs text-[var(--warm-gray)]">{event.distanceMiles.toFixed(1)} mi away</p>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {showRecipes && (
        <section className="mt-8">
          <h2 className="font-serif text-2xl">Recipes ({sortedRecipes.length})</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {sortedRecipes.map((recipe) => (
              <Link key={recipe.slug} href={`/recipe/${recipe.slug}`} className="rounded-2xl border bg-white p-4">
                <h3 className="font-semibold">{recipe.title}</h3>
                <p className="text-sm text-[var(--warm-gray)]">⭐ {recipe.rating.toFixed(1)} · {recipe.difficulty}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {total < 3 && (
        <div className="mt-10 rounded-2xl border border-[var(--bayou-gold)]/40 bg-[var(--cream-bg)] p-5">
          <p className="font-medium">Nothing found? Try Ask Acadiana.</p>
          <Link href="/ask" className="mt-2 inline-block underline">Go to Ask Acadiana</Link>
        </div>
      )}
    </main>
  );
}
