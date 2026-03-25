"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { FilterBar } from "@/components/FilterBar";
import { SearchBar } from "@/components/SearchBar";
import { VibeFilter, VibeKey, applyVibeFilter } from "@/components/VibeFilter";
import { places } from "@/data/mock-data";

const PAGE_SIZE = 12;
const categoryMap = [
  ["all", "✨ All"],
  ["food", "🍽 Food & Drink"],
  ["music", "🎵 Music & Nightlife"],
  ["events", "🎪 Events"],
  ["finds", "🛍 Shopping"],
  ["outdoors", "🌿 Outdoors"],
] as const;

function ExploreContent() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const category = params.get("category") ?? "all";
  const city = params.get("city") ?? "all";
  const rating = Number(params.get("rating") ?? "0");
  const vibe = (params.get("vibe") ?? "all") as VibeKey;
  const sort = params.get("sort") ?? "rated";
  const selectedPrices = (params.get("price") ?? "").split(",").filter(Boolean) as Array<"$" | "$$" | "$$$">;
  const tag = params.get("tag") ?? "all";

  const setParam = (key: string, value?: string) => {
    const next = new URLSearchParams(params.toString());
    if (!value || value === "all" || value === "0") next.delete(key); else next.set(key, value);
    router.push(`${pathname}?${next.toString()}`);
    setVisibleCount(PAGE_SIZE);
  };

  const cities = useMemo(() => Array.from(new Set(places.map((p) => p.city))).sort(), []);
  const tags = useMemo(() => Array.from(new Set(places.flatMap((p) => p.smartTags ?? []))).sort().slice(0, 18), []);

  const filtered = useMemo(() => {
    let list = [...places];
    if (category !== "all" && category !== "events" && category !== "outdoors") list = list.filter((p) => p.category === category);
    list = applyVibeFilter(list, vibe);
    list = list.filter((p) => (city === "all" ? true : p.city === city));
    list = list.filter((p) => (selectedPrices.length ? selectedPrices.includes(p.price) : true));
    list = list.filter((p) => (rating > 0 ? p.rating >= rating : true));
    list = list.filter((p) => (tag === "all" ? true : (p.smartTags ?? []).includes(tag)));
    if (sort === "reviews") list.sort((a, b) => (b.reviews?.length ?? 0) - (a.reviews?.length ?? 0));
    else if (sort === "az") list.sort((a, b) => a.name.localeCompare(b.name));
    else list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [category, vibe, city, selectedPrices, rating, tag, sort]);

  const results = filtered.slice(0, visibleCount);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-[12px] bg-[linear-gradient(120deg,#1a3a2a,#4a7c59)] p-8 text-white">
        <h1 className="text-4xl md:text-5xl">Explore Acadiana</h1>
        <p className="mt-2 text-white/85">Filter by vibe, city, and flavor to uncover your next local favorite.</p>
        <div className="mt-5"><SearchBar /></div>
      </section>

      <section className="mt-6 overflow-x-auto pb-2">
        <div className="flex min-w-max gap-2">
          {categoryMap.map(([key, label]) => (
            <Link key={key} href={`/explore?${new URLSearchParams({ ...Object.fromEntries(params.entries()), category: key }).toString()}`} className={`min-h-11 rounded-[10px] border px-4 py-2 text-sm ${category === key ? "border-[var(--cajun-red)] bg-[var(--cajun-red)] text-white" : "border-[var(--spanish-moss)]/40 bg-white hover:bg-[var(--cream-bg)]"}`}>
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-4"><FilterBar cities={cities} city={city} setCity={(v) => setParam("city", v)} prices={["$", "$$", "$$$"]} selectedPrices={selectedPrices} togglePrice={(p) => { const next = selectedPrices.includes(p) ? selectedPrices.filter((x) => x !== p) : [...selectedPrices, p]; setParam("price", next.join(",")); }} rating={rating} setRating={(v) => setParam("rating", String(v))} tags={tags} selectedTag={tag} setSelectedTag={(v) => setParam("tag", v)} clear={() => { router.push("/explore"); setVisibleCount(PAGE_SIZE); }} /></div>
      <div className="mt-4"><VibeFilter selected={vibe} onChange={(v) => setParam("vibe", v)} /></div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm text-[var(--warm-gray)]">Showing {results.length} of {filtered.length} places</p>
        <div className="relative">
          <label htmlFor="explore-sort" className="sr-only">Sort places</label>
          <select id="explore-sort" value={sort} onChange={(e) => setParam("sort", e.target.value)} className="min-h-11 appearance-none rounded-[10px] border border-[var(--spanish-moss)]/40 bg-white px-3 pr-9 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sunset-gold)]">
            <option value="rated">Highest Rated</option>
            <option value="reviews">Most Reviewed</option>
            <option value="az">A–Z</option>
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--warm-gray)]">▾</span>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="mt-8 rounded-[12px] border bg-white p-8 text-center text-[var(--warm-gray)]">
          <Image src="/mascot/gator-search.svg" alt="Geaux searching" width={140} height={140} className="mx-auto mb-3 h-28 w-28" />
          <p className="text-lg text-[var(--cast-iron)]">No spots match this exact combo… yet.</p>
        </div>
      ) : (
        <section className="mt-5 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((place) => <PlaceCard key={place.slug} place={place} />)}
        </section>
      )}

      {filtered.length > results.length ? (
        <div className="mt-8 text-center">
          <button type="button" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} className="min-h-11 rounded-[10px] bg-[var(--cast-iron)] px-5 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sunset-gold)]">
            Load More
          </button>
        </div>
      ) : null}
    </main>
  );
}

export default function ExplorePage() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><ExploreContent /></Suspense>;
}
