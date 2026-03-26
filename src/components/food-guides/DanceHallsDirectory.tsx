"use client";

import { useMemo, useState } from "react";
import data from "../../../data/dance-halls.json";

export function DanceHallsDirectory() {
  const [musicType, setMusicType] = useState("All");
  const [city, setCity] = useState("All");

  const types = useMemo(() => ["All", ...Array.from(new Set(data.halls.map((h) => h.musicType))).sort()], []);
  const cities = useMemo(() => ["All", ...Array.from(new Set(data.halls.map((h) => h.location))).sort()], []);

  const filtered = useMemo(() => data.halls.filter((h) => {
    const typeMatch = musicType === "All" || h.musicType === musicType;
    const cityMatch = city === "All" || h.location === city;
    return typeMatch && cityMatch;
  }), [musicType, city]);

  return (
    <>
      <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:grid-cols-2">
        <label className="text-sm text-[var(--warm-gray)]">Music type
          <select value={musicType} onChange={(e) => setMusicType(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm text-[var(--warm-gray)]">Location
          <select value={city} onChange={(e) => setCity(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} dance halls • last updated {data.lastUpdated}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((h) => (
          <article key={h.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <h3 className="text-xl text-[var(--cajun-red)]">{h.name}</h3>
            <p className="text-sm text-[var(--warm-gray)]">{h.location} • {h.musicType}</p>
            <div className="mt-3 grid gap-1 text-sm text-[var(--warm-gray)]">
              <p><span className="font-semibold text-[var(--cast-iron)]">Dance nights:</span> {h.danceNights}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Cover:</span> {h.cover}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Lessons:</span> {h.lessons ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Food:</span> {h.food ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Historic significance:</span> {h.history}</p>
              <a href={h.website} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">Website</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
