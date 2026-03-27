"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import seedPlaces from "../../../scripts/seed-data.json";
import type { Place } from "@/types";

const places = seedPlaces as Place[];

export default function ClaimDirectoryPage() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return places.slice(0, 24);
    return places
      .filter((place) => {
        const haystack = `${place.name} ${place.city} ${place.cuisine ?? ""} ${place.address}`.toLowerCase();
        return haystack.includes(q);
      })
      .slice(0, 60);
  }, [query]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-6 md:p-8">
        <p className="text-xs tracking-[0.18em] text-[var(--moss)]">FOR ACADIANA BUSINESS OWNERS</p>
        <h1 className="mt-2 font-serif text-3xl text-[var(--cajun-red)] md:text-5xl">Own a business in Acadiana? Claim your free listing.</h1>
        <p className="mt-3 max-w-3xl text-sm text-[var(--warm-gray)] md:text-base">Search all {places.length} listings, verify your ownership, and update your business profile in minutes.</p>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by business name, city, cuisine, or address..."
          className="mt-5 min-h-11 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 bg-[var(--cream-bg)] px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cajun-red)]"
        />
      </section>

      <section className="mt-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--warm-gray)]">
          <p>{results.length} results</p>
          <Link href="/claim/premium" className="min-h-11 rounded-[10px] border border-[var(--sunset-gold)]/40 bg-[var(--sunset-gold)]/10 px-3 py-2 font-medium text-[var(--cast-iron)]">Preview Premium Plans</Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {results.map((place) => (
            <article key={place.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
              <h2 className="font-serif text-2xl text-[var(--cast-iron)]">{place.name}</h2>
              <p className="mt-1 text-sm text-[var(--warm-gray)]">{place.city} • {place.cuisine || "Local Favorite"}</p>
              <p className="mt-1 text-sm text-[var(--warm-gray)]">{place.address}</p>
              <p className="mt-3 line-clamp-2 text-sm text-[var(--cast-iron)]/90">{place.description}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/claim/${place.slug}`}
                  className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
                >
                  Claim This Business
                </Link>
                <Link href={`/place/${place.slug}`} className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--spanish-moss)]/40 px-4 py-2 text-sm">View Listing</Link>
              </div>
            </article>
          ))}
        </div>

        <div className="rounded-[12px] border border-dashed border-[var(--spanish-moss)]/40 bg-[var(--cream)] p-5 text-center text-sm text-[var(--cast-iron)]">
          Don&apos;t see your business?{" "}
          <Link href="/claim/new" className="font-semibold text-[var(--cajun-red)] underline">Add it!</Link>
        </div>
      </section>
    </main>
  );
}
