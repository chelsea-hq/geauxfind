"use client";

import { useMemo, useState } from "react";
import data from "../../../data/late-night.json";

export function LateNightDirectory() {
  const [area, setArea] = useState("All");
  const areas = useMemo(() => ["All", ...Array.from(new Set(data.spots.map((s) => s.location))).sort()], []);
  const filtered = data.spots.filter((s) => area === "All" || s.location === area);

  return (
    <>
      <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
        <label className="text-sm text-[var(--warm-gray)]">Area
          <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2 md:max-w-sm">
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>
      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} spots • last updated {data.lastUpdated}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((s) => (
          <article key={s.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl text-[var(--cajun-red)]">{s.name}</h3>
                <p className="text-sm text-[var(--warm-gray)]">{s.location}</p>
              </div>
              <a href={s.website} target="_blank" rel="noreferrer" className="text-sm text-[var(--cajun-red)]">Website</a>
            </div>
            <p className="mt-3 text-sm"><span className="font-semibold">Open:</span> {s.openUntil}</p>
            <p className="mt-1 text-sm text-[var(--warm-gray)]">{s.knownFor}</p>
          </article>
        ))}
      </div>
    </>
  );
}
