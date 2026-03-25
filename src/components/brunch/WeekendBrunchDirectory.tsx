"use client";

import { useMemo, useState } from "react";
import { MapPin, Clock, ExternalLink } from "lucide-react";

type BrunchSpot = {
  slug: string;
  name: string;
  locations: string[];
  brunchDays: string[];
  hours: string;
  priceRange: string;
  vibe: string;
  specialties: string[];
  reservations: string;
  website: string | null;
  category: string;
  notes: string | null;
};

const DAY_COLORS: Record<string, string> = {
  Saturday: "bg-pink-600 text-white",
  Sunday: "bg-indigo-600 text-white",
  Both: "bg-[var(--cajun-red)] text-white",
};

const PRICE_COLORS: Record<string, string> = {
  "$": "bg-green-100 text-green-800",
  "$$": "bg-amber-100 text-amber-800",
  "$$$": "bg-rose-100 text-rose-800",
};

function BrunchCard({ spot }: { spot: BrunchSpot }) {
  const dayLabel = spot.brunchDays.length > 1 ? "Sat & Sun" : spot.brunchDays[0];

  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4 space-y-3">
        {/* Name + price */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold leading-tight text-[var(--cast-iron)]">{spot.name}</h3>
            <p className="text-xs text-[var(--warm-gray)]">{spot.category} · {spot.vibe}</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${PRICE_COLORS[spot.priceRange] ?? "bg-gray-100 text-gray-700"}`}>
              {spot.priceRange}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${spot.brunchDays.length > 1 ? DAY_COLORS.Both : DAY_COLORS[spot.brunchDays[0]] ?? "bg-gray-200 text-gray-700"}`}>
              {dayLabel}
            </span>
          </div>
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-1.5">
          {spot.specialties.map((s) => (
            <span key={s} className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-xs font-medium text-[var(--cast-iron)]">
              {s}
            </span>
          ))}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--warm-gray)]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {spot.hours}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {spot.locations.join(", ")}
          </span>
          <span className="rounded-full bg-[var(--spanish-moss)]/10 px-2 py-0.5">
            Reservations: {spot.reservations}
          </span>
        </div>

        {/* Notes */}
        {spot.notes && (
          <p className="text-xs text-[var(--cast-iron)]/60 italic">{spot.notes}</p>
        )}

        {/* Website */}
        {spot.website && (
          <a
            href={spot.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--cajun-red)] hover:underline"
          >
            Visit website <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

export function WeekendBrunchDirectory({
  spots,
  lastUpdated,
}: {
  spots: BrunchSpot[];
  lastUpdated: string;
}) {
  const [activeDay, setActiveDay] = useState<string>("All");
  const [priceFilter, setPriceFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    spots.forEach((s) => s.locations.forEach((l) => locs.add(l)));
    return ["All", ...Array.from(locs).sort()];
  }, [spots]);

  const filtered = useMemo(() => {
    return spots.filter((s) => {
      const dayMatch =
        activeDay === "All" || s.brunchDays.includes(activeDay);
      const priceMatch =
        priceFilter === "All" || s.priceRange === priceFilter;
      const locMatch =
        locationFilter === "All" || s.locations.includes(locationFilter);
      return dayMatch && priceMatch && locMatch;
    });
  }, [spots, activeDay, priceFilter, locationFilter]);

  return (
    <div className="space-y-5">
      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        {["All", "Saturday", "Sunday"].map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeDay === day
                ? day === "All"
                  ? "bg-[var(--cast-iron)] text-white"
                  : (DAY_COLORS[day] ?? "bg-[var(--cajun-red)] text-white")
                : "border border-[var(--spanish-moss)]/30 bg-white text-[var(--cast-iron)] hover:bg-[var(--cream)]"
            }`}
          >
            {day === "All" ? "All Brunch Spots" : day}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--warm-gray)]">Price:</label>
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="min-h-10 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 text-sm"
          >
            {["All", "$", "$$", "$$$"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--warm-gray)]">Area:</label>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="min-h-10 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 text-sm"
          >
            {allLocations.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </div>
        <span className="text-xs text-[var(--warm-gray)]">{filtered.length} spot{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((spot) => (
            <BrunchCard key={spot.slug} spot={spot} />
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[var(--spanish-moss)]/40 py-12 text-center text-[var(--warm-gray)]">
          <p className="text-4xl mb-2">🥂</p>
          <p className="font-medium">No brunch spots match your filters</p>
          <p className="text-sm mt-1">Try &ldquo;All Brunch Spots&rdquo; or adjust your filters.</p>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-center text-[var(--warm-gray)]/70 pt-2">
        Last updated {new Date(lastUpdated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Know a brunch spot we&apos;re missing?{" "}
        <a href="/community" className="underline hover:text-[var(--cajun-red)]">Submit it!</a>
      </p>
    </div>
  );
}
