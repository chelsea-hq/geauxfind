"use client";

import { useMemo, useState } from "react";
import data from "../../../data/outdoor.json";

export function OutdoorDirectory() {
  const [type, setType] = useState("All");

  const types = useMemo(() => ["All", ...Array.from(new Set(data.adventures.map((a) => a.type))).sort()], []);
  const filtered = useMemo(() => data.adventures.filter((a) => type === "All" || a.type === type), [type]);

  return (
    <>
      <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
        <label className="text-sm text-[var(--warm-gray)]">Adventure type
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2 md:max-w-sm">
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} adventures • last updated {data.lastUpdated}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((a) => (
          <article key={a.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <h3 className="text-xl text-[var(--cajun-red)]">{a.name}</h3>
            <p className="text-sm text-[var(--warm-gray)]">{a.type} • {a.location}</p>
            <div className="mt-3 grid gap-1 text-sm text-[var(--warm-gray)]">
              <p><span className="font-semibold text-[var(--cast-iron)]">Cost:</span> {a.cost}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Duration:</span> {a.duration}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Kid-friendly:</span> {a.kidFriendly ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Best season:</span> {a.bestSeason}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Bring:</span> {a.bring}</p>
              <a href={a.website} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">Website</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
