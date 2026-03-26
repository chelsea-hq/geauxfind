"use client";

import { useMemo, useState } from "react";
import data from "../../../data/photo-spots.json";

export function PhotoSpotsDirectory() {
  const [type, setType] = useState("All");

  const types = useMemo(() => ["All", ...Array.from(new Set(data.spots.map((s) => s.type))).sort()], []);
  const filtered = useMemo(() => data.spots.filter((s) => type === "All" || s.type === type), [type]);

  return (
    <>
      <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
        <label className="text-sm text-[var(--warm-gray)]">Spot type
          <select value={type} onChange={(e) => setType(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2 md:max-w-sm">
            {types.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} photo spots • last updated {data.lastUpdated}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((s) => (
          <article key={s.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <h3 className="text-xl text-[var(--cajun-red)]">{s.name}</h3>
            <p className="text-sm text-[var(--warm-gray)]">{s.location} • {s.type}</p>
            <div className="mt-3 grid gap-1 text-sm text-[var(--warm-gray)]">
              <p><span className="font-semibold text-[var(--cast-iron)]">Best time:</span> {s.bestTime}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Tip:</span> {s.tip}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Cost:</span> {s.cost}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Parking:</span> {s.parking}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
