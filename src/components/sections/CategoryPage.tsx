"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { RecipeCard } from "@/components/cards/RecipeCard";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { recipes } from "@/data/static-content";
import { CategoryType, Event, Place } from "@/types";

const PAGE_SIZE = 24;

// Place categories fetched from /api/places; events fetched from /api/events.
// Recipes ship as static content. This keeps the full seed dataset out of the
// client bundle (it used to import @/data/mock-data here).
const PLACE_TYPES: CategoryType[] = ["food", "music", "finds"];

export function CategoryPage({ type, title }: { type: CategoryType; title: string }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();

  const [places, setPlaces] = useState<Place[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    if (PLACE_TYPES.includes(type)) {
      fetch(`/api/places?category=${type}&limit=800`, { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => setPlaces(Array.isArray(data?.places) ? data.places : []))
        .catch(() => setPlaces([]));
    } else if (type === "events") {
      fetch("/api/events?limit=500", { cache: "no-store" })
        .then((r) => r.json())
        .then((data) => setEvents(Array.isArray(data?.events) ? data.events : []))
        .catch(() => setEvents([]));
    }
  }, [type]);

  const page = Number(params.get("page") ?? "1");
  const city = params.get("city") ?? "all";
  const rating = Number(params.get("rating") ?? "0");
  const sort = params.get("sort") ?? "rated";
  const tag = params.get("tag") ?? "all";
  const selectedPrices = (params.get("price") ?? "").split(",").filter(Boolean) as Array<"$" | "$$" | "$$$">;

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all" || value === "0") next.delete(key); else next.set(key, value);
    if (key !== "page") next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
  };

  const cityList = useMemo(() => Array.from(new Set(places.map((p) => p.city))).sort(), [places]);
  const tagList = useMemo(() => Array.from(new Set(places.flatMap((p) => p.smartTags ?? []))).sort().slice(0, 20), [places]);

  const placeBase = useMemo(() => places.filter((p) => p.category === type), [places, type]);

  const placeFiltered = useMemo(() => {
    let list = [...placeBase];
    list = list.filter((p) => (city === "all" ? true : p.city === city));
    list = list.filter((p) => (selectedPrices.length ? selectedPrices.includes(p.price) : true));
    list = list.filter((p) => (rating ? p.rating >= rating : true));
    list = list.filter((p) => (tag === "all" ? true : (p.smartTags ?? []).includes(tag)));
    if (sort === "reviews") list.sort((a, b) => (b.reviews?.length || b.google_review_count || 0) - (a.reviews?.length || a.google_review_count || 0));
    else if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [placeBase, city, selectedPrices, rating, tag, sort]);

  const eventFiltered = useMemo(() => {
    let list = [...events].filter((e) => new Date(`${e.endDate || e.date}T23:59:59`).getTime() >= Date.now());
    if (city !== "all") list = list.filter((e) => e.city === city);
    if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return list;
  }, [events, city, sort]);

  const recipeFiltered = useMemo(() => {
    const list = [...recipes];
    if (sort === "az") list.sort((a, b) => a.title.localeCompare(b.title));
    else list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [sort]);

  const activeList = type === "events" ? eventFiltered : type === "recipes" ? recipeFiltered : placeFiltered;
  const start = (Math.max(1, page) - 1) * PAGE_SIZE;
  const pagedEvents = eventFiltered.slice(start, start + PAGE_SIZE);
  const pagedRecipes = recipeFiltered.slice(start, start + PAGE_SIZE);
  const pagedPlaces = placeFiltered.slice(start, start + PAGE_SIZE);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-balance font-serif text-4xl text-[var(--cajun-red)]">{title}</h1>
      <p className="mt-2 text-sm text-[var(--warm-gray)]">Showing {activeList.length ? start + 1 : 0}-{Math.min(start + PAGE_SIZE, activeList.length)} of {activeList.length} {type}</p>
      {type === "food" ? (
        <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-[var(--bayou-gold)]/40 bg-[var(--cream-bg)] px-4 py-3">
          <Image src="/mascot/gator-chef.svg" alt="Geaux the chef" width={64} height={64} className="h-14 w-14" />
          <p className="text-sm text-[var(--cast-iron)]">Geaux says: pull up hungry — these are the local favorites.</p>
        </div>
      ) : null}

      <div className="mt-5 flex items-center justify-between gap-3">
        <select value={sort} onChange={(e) => setParam("sort", e.target.value)} className="min-h-11 rounded-lg border bg-white px-3 text-sm">
          <option value="rated">Highest Rated</option><option value="reviews">Most Reviewed</option><option value="az">A-Z</option>
        </select>
      </div>

      {(type === "food" || type === "music" || type === "finds") && (
        <div className="mt-4">
          <FilterBar
            cities={cityList}
            city={city}
            setCity={(v) => setParam("city", v)}
            prices={["$", "$$", "$$$"]}
            selectedPrices={selectedPrices}
            togglePrice={(p) => {
              const next = selectedPrices.includes(p) ? selectedPrices.filter((x) => x !== p) : [...selectedPrices, p];
              setParam("price", next.join(","));
            }}
            rating={rating}
            setRating={(v) => setParam("rating", String(v))}
            tags={tagList}
            selectedTag={tag}
            setSelectedTag={(v) => setParam("tag", v)}
            clear={() => router.push(pathname)}
          />
        </div>
      )}

      <section className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {type === "events" && pagedEvents.map((item) => <EventCard key={item.slug} event={item} />)}
        {type === "recipes" && pagedRecipes.map((item) => <RecipeCard key={item.slug} recipe={item} />)}
        {(type === "food" || type === "music" || type === "finds") && pagedPlaces.map((item) => <PlaceCard key={item.slug} place={item} />)}
      </section>

      <Pagination page={Math.max(1, page)} pageSize={PAGE_SIZE} total={activeList.length} pathname={pathname} params={new URLSearchParams(params.toString())} />
    </main>
  );
}
