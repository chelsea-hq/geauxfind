"use client";

import { useMemo, useState } from "react";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { applyVibeFilter, VibeFilter, VibeKey } from "@/components/VibeFilter";
import { places } from "@/data/mock-data";
import { useLocation } from "@/hooks/useLocation";
import { getCityCoordinates, haversineMiles } from "@/lib/distance";

type CategoryFilter = "all" | "food" | "music" | "finds";

export default function ExplorePage() {
  const [vibe, setVibe] = useState<VibeKey>("all");
  const [city, setCity] = useState("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [prices, setPrices] = useState<Array<"$" | "$$" | "$$$">>([]);
  const [rating, setRating] = useState(0);
  const [tag, setTag] = useState<string>("all");

  const { lat, lng, city: userCity } = useLocation();

  const cities = useMemo(() => Array.from(new Set(places.map((p) => p.city))).sort(), []);
  const tags = useMemo(() => Array.from(new Set(places.flatMap((p) => p.tags))).sort().slice(0, 20), []);

  const filtered = useMemo(() => {
    const base = category === "all" ? places : places.filter((p) => p.category === category);

    return applyVibeFilter(base, vibe)
      .filter((p) => {
        if (city !== "all" && p.city !== city) return false;
        if (prices.length && !prices.includes(p.price)) return false;
        if (rating > 0 && p.rating < rating) return false;
        if (tag !== "all" && !p.tags.includes(tag)) return false;
        return true;
      })
      .map((p) => {
        const coords = getCityCoordinates(p.city);
        const distanceMiles = coords ? haversineMiles({ lat, lng }, coords) : null;
        return { ...p, distanceMiles };
      })
      .sort((a, b) => (a.distanceMiles ?? 9999) - (b.distanceMiles ?? 9999) || b.rating - a.rating);
  }, [category, vibe, city, prices, rating, tag, lat, lng]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">Explore Acadiana</h1>
      <p className="mt-2 text-sm text-[var(--warm-gray)]">Power browsing mode · sorted nearest first from {userCity}</p>

      <div className="mt-5">
        <VibeFilter selected={vibe} onChange={setVibe} />
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-4">
        <select className="rounded-lg border px-2 py-2 text-sm" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="all">All cities</option>
          {cities.map((value) => <option key={value} value={value}>{value}</option>)}
        </select>

        <select className="rounded-lg border px-2 py-2 text-sm" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          <option value={0}>Any rating</option>
          <option value={4}>4+ stars</option>
          <option value={3}>3+ stars</option>
        </select>

        <div className="flex items-center gap-2 text-sm">
          {(["$", "$$", "$$$"] as const).map((price) => (
            <label key={price} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={prices.includes(price)}
                onChange={(e) => setPrices((curr) => (e.target.checked ? [...curr, price] : curr.filter((p) => p !== price)))}
              />
              {price}
            </label>
          ))}
        </div>

        <button
          type="button"
          onClick={() => {
            setCity("all");
            setCategory("all");
            setPrices([]);
            setRating(0);
            setTag("all");
            setVibe("all");
          }}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          Clear filters
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(["all", "food", "music", "finds"] as const).map((tab) => (
          <button key={tab} onClick={() => setCategory(tab)} className={`rounded-full border px-3 py-1.5 text-sm ${category === tab ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>
            {tab === "all" ? "All" : tab[0].toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => setTag("all")} className={`rounded-full border px-2 py-1 text-xs ${tag === "all" ? "bg-[var(--bayou-green)] text-white" : "bg-white"}`}>All tags</button>
        {tags.map((value) => (
          <button key={value} onClick={() => setTag(value)} className={`rounded-full border px-2 py-1 text-xs ${tag === value ? "bg-[var(--bayou-green)] text-white" : "bg-white"}`}>
            {value}
          </button>
        ))}
      </div>

      <p className="mt-5 text-sm text-[var(--warm-gray)]">{filtered.length} places match your filters</p>
      <section className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((place) => <PlaceCard key={place.slug} place={place} />)}
      </section>
    </main>
  );
}
