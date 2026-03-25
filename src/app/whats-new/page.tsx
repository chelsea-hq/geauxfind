"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { events, places } from "@/data/mock-data";

type FeedFilter = "All" | "New Spots" | "New Menu Items" | "Events" | "Community Tips";

const filters: FeedFilter[] = ["All", "New Spots", "New Menu Items", "Events", "Community Tips"];

export default function WhatsNewPage() {
  const [active, setActive] = useState<FeedFilter>("All");

  const newestPlaces = useMemo(() => places.slice(-20).reverse(), []);

  const items = useMemo(() => {
    const placeCards = newestPlaces.map((place) => ({
      id: place.slug,
      kind: "New Spots",
      title: place.name,
      city: place.city,
      image: place.image,
      description: place.description,
      tags: place.smartTags ?? ["Recently Discovered"]
    }));

    const eventCards = events.map((event) => ({
      id: event.slug,
      kind: "Events",
      title: event.name,
      city: event.city,
      image: event.image,
      description: event.description,
      tags: event.tags
    }));

    const merged = [...placeCards, ...eventCards];
    if (active === "All") return merged;
    if (active === "New Menu Items") return merged.filter((item) => item.tags.some((t) => String(t).toLowerCase().includes("menu")));
    if (active === "Community Tips") return merged.filter((item) => item.tags.some((t) => String(t).toLowerCase().includes("tip")));
    return merged.filter((item) => item.kind === active);
  }, [active, newestPlaces]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--bayou-green)]">Fresh picks</p>
        <h1 className="font-serif text-4xl text-[var(--cajun-red)]">What&apos;s New in Acadiana</h1>
        <p className="mt-2 text-[var(--warm-gray)]">The latest spots, events, and community discoveries around the bayou.</p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${
              active === filter
                ? "border-[var(--cajun-red)] bg-[var(--cajun-red)] text-white"
                : "border-[var(--warm-gray)]/25 bg-white text-[var(--cast-iron)]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <article key={`${item.kind}-${item.id}`} className="overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 bg-white shadow-sm md:flex">
            <img src={item.image} alt={item.title} className="h-44 w-full object-cover md:h-auto md:w-56" />
            <div className="flex-1 p-5">
              <p className="text-xs uppercase tracking-wide text-[var(--bayou-green)]">{item.kind}</p>
              <h2 className="mt-1 font-serif text-2xl text-[var(--cast-iron)]">{item.title}</h2>
              <p className="text-sm text-[var(--warm-gray)]">{item.city}</p>
              <p className="mt-2 line-clamp-2 text-sm text-[var(--cast-iron)]/85">{item.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.tags.slice(0, 4).map((tag) => (
                  <span key={tag} className="rounded-full bg-[var(--cream-bg)] px-3 py-1 text-xs font-medium text-[var(--cajun-red)]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/" className="text-sm underline">Back to home</Link>
      </div>
    </main>
  );
}
