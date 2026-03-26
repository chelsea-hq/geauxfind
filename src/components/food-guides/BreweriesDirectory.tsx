"use client";

import { useMemo, useState } from "react";
import data from "../../../data/breweries.json";

export function BreweriesDirectory() {
  const [type, setType] = useState("All");
  const [area, setArea] = useState("All");

  const types = useMemo(() => ["All", ...Array.from(new Set(data.venues.map((v) => v.type))).sort()], []);
  const areas = useMemo(() => ["All", ...Array.from(new Set(data.venues.flatMap((v) => v.locations))).sort()], []);

  const filtered = useMemo(() => data.venues.filter((v) => {
    const typeMatch = type === "All" || v.type === type;
    const areaMatch = area === "All" || v.locations.includes(area);
    return typeMatch && areaMatch;
  }), [type, area]);

  return (
    <>
      <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:grid-cols-2">
        <label className="text-sm text-[var(--warm-gray)]">Type
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm text-[var(--warm-gray)]">Area
          <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} stops • last updated {data.lastUpdated}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((v) => (
          <article key={v.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl text-[var(--cajun-red)]">{v.name}</h3>
                <p className="text-sm text-[var(--warm-gray)]">{v.type} • {v.locations.join(", ")}</p>
              </div>
              <a href={v.website} target="_blank" rel="noreferrer" className="text-sm text-[var(--cajun-red)]">Website</a>
            </div>
            <p className="mt-2 text-sm text-[var(--cast-iron)]/85">{v.flagship}</p>
            <div className="mt-3 grid gap-2 text-sm text-[var(--warm-gray)]">
              <p><span className="font-semibold text-[var(--cast-iron)]">Hours:</span> {v.tastingRoomHours}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Tours:</span> {v.toursAvailable}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Food:</span> {v.foodServed}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Dog-friendly:</span> {v.dogFriendly ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Vibe:</span> {v.vibe}</p>
              <a href={v.social} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">Social</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
