"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { FilterBar } from "@/components/FilterBar";
import { Pagination } from "@/components/Pagination";
import { SearchBar } from "@/components/SearchBar";
import { VibeFilter, VibeKey, applyVibeFilter } from "@/components/VibeFilter";
import { places } from "@/data/mock-data";

const PAGE_SIZE = 24;
const categoryMap = [["all", "All"],["food", "Food & Drink"],["music", "Music & Nightlife"],["events", "Events"],["finds", "Shopping"],["outdoors", "Outdoors"]] as const;

function ExploreContent() {
  const pathname = usePathname();
  const params = useSearchParams();
  const router = useRouter();

  const page = Number(params.get("page") ?? "1");
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
    if (key !== "page") next.set("page", "1");
    router.push(`${pathname}?${next.toString()}`);
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

  const start = (Math.max(1, page) - 1) * PAGE_SIZE;
  const results = filtered.slice(start, start + PAGE_SIZE);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-balance font-serif text-4xl text-[var(--cajun-red)]">Explore Acadiana</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Find food, music, and hidden gems across Cajun Country.</p>
      <div className="mt-5"><SearchBar /></div>
      <div className="sticky top-16 z-20 mt-6 rounded-xl border bg-[var(--cream-bg)]/95 p-3 backdrop-blur"><div className="flex flex-wrap gap-2">{categoryMap.map(([key, label]) => <Link key={key} href={`/explore?${new URLSearchParams({ ...Object.fromEntries(params.entries()), category: key, page: "1" }).toString()}`} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${category === key ? "bg-[var(--cajun-red)] text-white" : "bg-white hover:bg-[var(--cream-bg)]"}`}>{label}</Link>)}</div></div>
      <div className="mt-4"><FilterBar cities={cities} city={city} setCity={(v) => setParam("city", v)} prices={["$", "$$", "$$$"]} selectedPrices={selectedPrices} togglePrice={(p) => { const next = selectedPrices.includes(p) ? selectedPrices.filter((x) => x !== p) : [...selectedPrices, p]; setParam("price", next.join(",")); }} rating={rating} setRating={(v) => setParam("rating", String(v))} tags={tags} selectedTag={tag} setSelectedTag={(v) => setParam("tag", v)} clear={() => router.push("/explore?page=1")} /></div>
      <div className="mt-4"><VibeFilter selected={vibe} onChange={(v) => setParam("vibe", v)} /></div>
      <div className="mt-5 flex items-center justify-between gap-4"><p className="text-sm text-[var(--warm-gray)]">Showing {filtered.length ? start + 1 : 0}-{Math.min(start + PAGE_SIZE, filtered.length)} of {filtered.length} places</p><select value={sort} onChange={(e) => setParam("sort", e.target.value)} className="min-h-11 rounded-lg border px-3 text-sm"><option value="rated">Highest Rated</option><option value="reviews">Most Reviewed</option><option value="az">A-Z</option></select></div>
      {results.length === 0 ? <div className="mt-8 rounded-xl border bg-white p-8 text-center text-[var(--warm-gray)]">No places match your filters. Try broadening your search.</div> : <section className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{results.map((place) => <PlaceCard key={place.slug} place={place} />)}</section>}
      <Pagination page={Math.max(1, page)} pageSize={PAGE_SIZE} total={filtered.length} pathname={pathname} params={new URLSearchParams(params.toString())} />
    </main>
  );
}

export default function ExplorePage() {
  return <Suspense fallback={<main className="mx-auto max-w-6xl px-4 py-10">Loading…</main>}><ExploreContent /></Suspense>;
}
