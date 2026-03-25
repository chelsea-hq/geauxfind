"use client";

import { useMemo, useState } from "react";
import { MapPin, Clock, ExternalLink } from "lucide-react";

type MusicNight = {
  day: string;
  dayIndex: number;
  description: string;
  hours: string;
  genre: string;
};

type Venue = {
  slug: string;
  name: string;
  locations: string[];
  musicNights: MusicNight[];
  genres: string[];
  cover: string;
  vibe: string;
  website: string | null;
  category: string;
  notes: string | null;
  isRestaurant?: boolean;
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

const GENRE_COLORS: Record<string, string> = {
  Cajun:    "bg-amber-100 text-amber-800",
  Zydeco:   "bg-emerald-100 text-emerald-800",
  Country:  "bg-yellow-100 text-yellow-800",
  Blues:     "bg-blue-100 text-blue-800",
  Jazz:     "bg-purple-100 text-purple-800",
  Rock:     "bg-red-100 text-red-800",
  Variety:  "bg-gray-100 text-gray-700",
  Swamp_Pop: "bg-teal-100 text-teal-800",
};

function VenueCard({ venue, activeDay }: { venue: Venue; activeDay: string }) {
  const nightsToShow = activeDay === "All"
    ? venue.musicNights
    : venue.musicNights.filter((n) => n.day === activeDay || n.day === "Everyday");

  return (
    <div className="overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-4 space-y-3">
        {/* Name + category */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold leading-tight text-[var(--cast-iron)]">{venue.name}</h3>
            <p className="text-xs text-[var(--warm-gray)]">{venue.category} · {venue.vibe}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {venue.isRestaurant && (
              <span className="rounded-full bg-[var(--moss)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--moss)]">
                🍽️ Restaurant
              </span>
            )}
            <span className="rounded-full bg-[var(--cajun-red)]/10 px-3 py-1 text-xs font-semibold text-[var(--cajun-red)]">
              {venue.cover}
            </span>
          </div>
        </div>

        {/* Genre tags */}
        <div className="flex flex-wrap gap-1.5">
          {venue.genres.map((g) => (
            <span
              key={g}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${GENRE_COLORS[g.replace(/\s+/g, "_")] ?? "bg-gray-100 text-gray-700"}`}
            >
              🎵 {g}
            </span>
          ))}
        </div>

        {/* Music nights */}
        {nightsToShow.map((night, i) => (
          <div key={i} className="rounded-[8px] bg-[var(--cream)] px-3 py-2">
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DAY_COLORS[night.day] ?? "bg-gray-200 text-gray-700"}`}>
                {night.day}
              </span>
              <p className="text-sm font-medium text-[var(--cast-iron)]">{night.description}</p>
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--warm-gray)]">
              <Clock className="h-3 w-3" />
              {night.hours}
            </p>
          </div>
        ))}

        {/* Meta row */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--warm-gray)]">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {venue.locations.join(", ")}
          </span>
        </div>

        {/* Notes */}
        {venue.notes && (
          <p className="text-xs text-[var(--cast-iron)]/60 italic">{venue.notes}</p>
        )}

        {/* Website */}
        {venue.website && (
          <a
            href={venue.website}
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

export function LiveMusicDirectory({
  venues,
  lastUpdated,
}: {
  venues: Venue[];
  lastUpdated: string;
}) {
  const today = new Date().getDay();
  const todayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][today];
  const [activeDay, setActiveDay] = useState<string>(todayName);
  const [genreFilter, setGenreFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [restaurantsOnly, setRestaurantsOnly] = useState(false);

  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    venues.forEach((v) => v.genres.forEach((g) => genres.add(g)));
    return ["All", ...Array.from(genres).sort()];
  }, [venues]);

  const allLocations = useMemo(() => {
    const locs = new Set<string>();
    venues.forEach((v) => v.locations.forEach((l) => locs.add(l)));
    return ["All", ...Array.from(locs).sort()];
  }, [venues]);

  const filtered = useMemo(() => {
    return venues.filter((v) => {
      const dayMatch =
        activeDay === "All" ||
        v.musicNights.some((n) => n.day === "Everyday" || n.day === activeDay);
      const genreMatch =
        genreFilter === "All" || v.genres.includes(genreFilter);
      const locMatch =
        locationFilter === "All" || v.locations.includes(locationFilter);
      const restMatch = !restaurantsOnly || v.isRestaurant === true;
      return dayMatch && genreMatch && locMatch && restMatch;
    });
  }, [venues, activeDay, genreFilter, locationFilter, restaurantsOnly]);

  const availableDays = useMemo(() => {
    const days = new Set<string>();
    venues.forEach((v) => v.musicNights.forEach((n) => days.add(n.day)));
    return DAYS.filter((d) => days.has(d));
  }, [venues]);

  return (
    <div className="space-y-5">
      {/* Day tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveDay("All")}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            activeDay === "All"
              ? "bg-[var(--cast-iron)] text-white"
              : "border border-[var(--spanish-moss)]/30 bg-white text-[var(--cast-iron)] hover:bg-[var(--cream)]"
          }`}
        >
          All Nights
        </button>
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
            {day === todayName ? `${day} (Tonight!)` : day}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--warm-gray)]">Genre:</label>
          <select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            className="min-h-10 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3 text-sm"
          >
            {allGenres.map((g) => (
              <option key={g}>{g}</option>
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
        <button
          onClick={() => setRestaurantsOnly((p) => !p)}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
            restaurantsOnly
              ? "bg-[var(--moss)] text-white"
              : "border border-[var(--spanish-moss)]/30 bg-white text-[var(--cast-iron)] hover:bg-[var(--cream)]"
          }`}
        >
          🍽️ Restaurants only
        </button>
        <span className="text-xs text-[var(--warm-gray)]">{filtered.length} venue{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Cards grid */}
      {filtered.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((venue) => (
            <VenueCard key={venue.slug} venue={venue} activeDay={activeDay} />
          ))}
        </div>
      ) : (
        <div className="rounded-[12px] border border-dashed border-[var(--spanish-moss)]/40 py-12 text-center text-[var(--warm-gray)]">
          <p className="text-4xl mb-2">🎵</p>
          <p className="font-medium">No live music found for {activeDay}</p>
          <p className="text-sm mt-1">Try &ldquo;All Nights&rdquo; or a different genre to see more options.</p>
        </div>
      )}

      {/* Footer */}
      <p className="text-xs text-center text-[var(--warm-gray)]/70 pt-2">
        Last updated {new Date(lastUpdated).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })} · Know a venue we&apos;re missing?{" "}
        <a href="/community" className="underline hover:text-[var(--cajun-red)]">Submit it!</a>
      </p>
    </div>
  );
}
