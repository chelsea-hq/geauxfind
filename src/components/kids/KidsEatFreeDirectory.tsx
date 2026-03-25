"use client";

import { useMemo, useState } from "react";
import { MapPin, Clock, ExternalLink } from "lucide-react";

type Deal = {
  slug: string;
  name: string;
  locations: string[];
  day: string;
  dayIndex: number;
  offer: string;
  hours: string;
  ageLimit: string;
  kidsPerAdult: number | null;
  dineInOnly: boolean;
  website: string | null;
  category: string;
  notes: string | null;
};

const DAYS = ["Everyday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DAY_COLORS: Record<string, string> = {
  Everyday:  "bg-[var(--moss)] text-white",
  Monday:    "bg-blue-600 text-white",
  Tuesday:   "bg-purple-600 text-white",
  Wednesday: "bg-teal-600 text-white",
  Thursday:  "bg-orange-500 text-white",
  Friday:    "bg-[var(--cajun-red)] text-white",
  Saturday:  "bg-pink-600 text-white",
  Sunday:    "bg-indigo-600 text-white",
};

function DealCard({ deal }: { deal: Deal }) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4 space-y-3">
        {/* Name + day badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold leading-tight text-[var(--cast-iron)]">{deal.name}</h3>
            <p className="text-xs text-[var(--warm-gray)]">{deal.category}</p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${DAY_COLORS[deal.day] ?? "bg-gray-200 text-gray-700"}`}>
            {deal.day}
          </span>
        </div>

        {/* Offer highlight */}
        <div className="rounded-[8px] bg-[var(--cream)] px-3 py-2">
          <p className="text-sm font-medium text-[var(--cast-iron)]">🎉 {deal.offer}</p>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--warm-gray)]">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {deal.hours}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {deal.locations.join(", ")}
          </span>
          {deal.dineInOnly && (
            <span className="rounded-full bg-[var(--spanish-moss)]/10 px-2 py-0.5">Dine-in only</span>
          )}
          {deal.ageLimit && (
            <span className="rounded-full bg-[var(--spanish-moss)]/10 px-2 py-0.5">{deal.ageLimit}</span>
          )}
        </div>

        {/* Notes */}
        {deal.notes && (
          <p className="text-xs text-[var(--cast-iron)]/60 italic">{deal.notes}</p>
        )}

        {/* Website */}
        {deal.website && (
          <a
            href={deal.website}
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

export function KidsEatFreeDirectory({
  deals,
  lastUpdated,
}: {
  deals: Deal[];
  lastUpdated: string;
}) {
  const today = new Date().getDay(); // 0=Sun, 1=Mon…
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today];
  const [activeDay, setActiveDay] = useState<string>(todayName);
  const [locationFilter, setLocationFilter] = useState("All");

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    deals.forEach((d) => d.locations.forEach((l) => locs.add(l)));
    return ["All", ...Array.from(locs).sort()];
  }, [deals]);

  const filtered = useMemo(() => {
    return deals.filter((d) => {
      const dayMatch = activeDay === "All" || d.day === "Everyday" || d.day === activeDay;
      const locMatch = locationFilter === "All" || d.locations.includes(locationFilter);
      return dayMatch && locMatch;
    });
  }, [deals, activeDay, locationFilter]);

  // Available days that have deals
  const availableDays = useMemo(() => {
    return DAYS.filter((day) =>
      deals.some((d) => d.day === day || day === "Everyday")
    );
  }, [deals]);

  return (
    <div className="space-y-5">
      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        {availableDays.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeDay === day
                ? (DAY_COLORS[day] ?? "bg-[var(--cajun-red)] text-white")
                : "border border-[var(--spanish-moss)]/30 bg-white text-[var(--cast-iron)] hover:bg-[var(--cream)]"
            }`}
          >
            {day === todayName ? `${day} (Today)` : day}
          </button>
        ))}
      </div>

      {/* Location filter */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[var(--warm-gray)]">Filter by area:</label>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="min-h-10 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 text-sm"
        >
          {allLocations.map((loc) => (
            <option key={loc}>{loc}</option>
          ))}
        </select>
        <span className="text-xs text-[var(--warm-gray)]">{filtered.length} deal{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((deal) => (
            <DealCard key={deal.slug} deal={deal} />
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[var(--spanish-moss)]/40 py-12 text-center text-[var(--warm-gray)]">
          <p className="text-4xl mb-2">🍽️</p>
          <p className="font-medium">No deals found for {activeDay}</p>
          <p className="text-sm mt-1">Try &ldquo;Everyday&rdquo; or a different day to see more options.</p>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-center text-[var(--warm-gray)]/70 pt-2">
        Last updated {new Date(lastUpdated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Know a deal we&apos;re missing?{" "}
        <a href="/community" className="underline hover:text-[var(--cajun-red)]">Submit it!</a>
      </p>
    </div>
  );
}
