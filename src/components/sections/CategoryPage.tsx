"use client";

import { useEffect, useMemo, useState } from "react";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { EventCard } from "@/components/cards/EventCard";
import { RecipeCard } from "@/components/cards/RecipeCard";
import { applyVibeFilter, VibeFilter, VibeKey } from "@/components/VibeFilter";
import { events, places, recipes } from "@/data/mock-data";
import { CategoryType } from "@/types";

const isVibeKey = (value: string | null): value is VibeKey =>
  ["all", "foodie", "family", "night-out", "budget", "new-here", "live-music"].includes(value ?? "");

export function CategoryPage({ type, title }: { type: CategoryType; title: string }) {
  const [vibe, setVibe] = useState<VibeKey>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<Array<"$" | "$$" | "$$$">>([]);
  const [ratingFloor, setRatingFloor] = useState<number>(0);
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const vibeParam = params.get("vibe");
    if (isVibeKey(vibeParam)) setVibe(vibeParam);
  }, []);

  const onVibeChange = (nextVibe: VibeKey) => {
    setVibe(nextVibe);
    const params = new URLSearchParams(window.location.search);
    if (nextVibe === "all") params.delete("vibe");
    else params.set("vibe", nextVibe);
    const qs = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
  };

  const allCities = useMemo(() => Array.from(new Set(places.map((p) => p.city))).sort(), []);
  const cuisines = useMemo(
    () =>
      Array.from(
        new Set(
          places
            .filter((p) => p.category === "food" && p.cuisine)
            .map((p) => p.cuisine as string)
        )
      ).sort(),
    []
  );

  const placeContent = useMemo(() => {
    const base = {
      food: places.filter((p) => p.category === "food"),
      music: places.filter((p) => p.category === "music"),
      finds: places.filter((p) => p.category === "finds"),
    }[type as "food" | "music" | "finds"];

    if (!base) return [];

    return applyVibeFilter(base, vibe).filter((p) => {
      if (cityFilter !== "all" && p.city !== cityFilter) return false;
      if (priceFilter.length > 0 && !priceFilter.includes(p.price)) return false;
      if (ratingFloor > 0 && p.rating < ratingFloor) return false;
      if (type === "food" && selectedCuisine !== "all" && p.cuisine !== selectedCuisine) return false;
      return true;
    });
  }, [type, vibe, cityFilter, priceFilter, ratingFloor, selectedCuisine]);

  const totalPlaces = useMemo(() => {
    if (type === "food") return places.filter((p) => p.category === "food").length;
    if (type === "music") return places.filter((p) => p.category === "music").length;
    if (type === "finds") return places.filter((p) => p.category === "finds").length;
    return 0;
  }, [type]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">{title}</h1>
      {(type === "food" || type === "music" || type === "finds") && (
        <div className="mt-5">
          <VibeFilter selected={vibe} onChange={onVibeChange} />
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[280px,1fr]">
        <aside className="space-y-4 rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-4 text-sm">
          <h2 className="font-semibold">Filter & Sort</h2>

          {(type === "food" || type === "music" || type === "finds") && (
            <>
              <p className="text-xs text-[var(--warm-gray)]">Showing {placeContent.length} of {totalPlaces} places</p>

              <label className="block">
                <span className="mb-1 block font-medium">City</span>
                <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="w-full rounded-lg border px-2 py-1.5">
                  <option value="all">All cities</option>
                  {allCities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              </label>

              <div>
                <span className="mb-1 block font-medium">Price</span>
                <div className="space-y-1">
                  {(["$", "$$", "$$$"] as const).map((price) => (
                    <label key={price} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={priceFilter.includes(price)}
                        onChange={(e) =>
                          setPriceFilter((current) =>
                            e.target.checked ? [...current, price] : current.filter((p) => p !== price)
                          )
                        }
                      />
                      {price}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1 block font-medium">Rating</span>
                <div className="flex flex-wrap gap-2">
                  {[0, 3, 4, 4.5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRatingFloor(value)}
                      className={`rounded-full border px-2 py-1 text-xs ${ratingFloor === value ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}
                    >
                      {value === 0 ? "Any" : `${value}+`}
                    </button>
                  ))}
                </div>
              </div>

              {type === "food" && (
                <div>
                  <span className="mb-1 block font-medium">Cuisine</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCuisine("all")}
                      className={`rounded-full border px-2 py-1 text-xs ${selectedCuisine === "all" ? "bg-[var(--bayou-green)] text-white" : "bg-white"}`}
                    >
                      All
                    </button>
                    {cuisines.map((cuisine) => (
                      <button
                        key={cuisine}
                        type="button"
                        onClick={() => setSelectedCuisine(cuisine)}
                        className={`rounded-full border px-2 py-1 text-xs ${selectedCuisine === cuisine ? "bg-[var(--bayou-green)] text-white" : "bg-white"}`}
                      >
                        {cuisine}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setCityFilter("all");
                  setPriceFilter([]);
                  setRatingFloor(0);
                  setSelectedCuisine("all");
                  onVibeChange("all");
                }}
                className="w-full rounded-lg border px-3 py-2 text-left text-xs hover:bg-[var(--cream-bg)]"
              >
                Clear all filters
              </button>
            </>
          )}
        </aside>
        <section className="grid gap-4 md:grid-cols-2">
          {type === "events" && events.map((item) => <EventCard key={item.slug} event={item} />)}
          {type === "recipes" && recipes.map((item) => <RecipeCard key={item.slug} recipe={item} />)}
          {(type === "food" || type === "music" || type === "finds") && placeContent.map((item) => <PlaceCard key={item.slug} place={item} />)}
        </section>
      </div>
    </main>
  );
}
