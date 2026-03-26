"use client";

import { useMemo, useState } from "react";
import data from "../../../data/date-night.json";

export function DateNightDirectory() {
  const [vibe, setVibe] = useState("All");
  const vibes = useMemo(() => ["All", ...Array.from(new Set(data.ideas.map((i) => i.vibe))).sort()], []);
  const filtered = data.ideas.filter((i) => vibe === "All" || i.vibe === vibe);

  return (
    <>
      <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
        <label className="text-sm text-[var(--warm-gray)]">Vibe
          <select value={vibe} onChange={(e) => setVibe(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2 md:max-w-sm">
            {vibes.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </label>
      </div>
      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} date ideas • last updated {data.lastUpdated}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((i) => (
          <article key={i.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--moss)]">{i.vibe} • {i.budget} • {i.area}</p>
            <h3 className="mt-1 text-xl text-[var(--cajun-red)]">{i.title}</h3>
            <p className="mt-3 text-sm"><span className="font-semibold">Dinner:</span> <a href={i.restaurantUrl} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">{i.restaurant}</a></p>
            <p className="mt-1 text-sm"><span className="font-semibold">Activity:</span> <a href={i.activityUrl} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">{i.activity}</a></p>
            <p className="mt-3 text-sm text-[var(--warm-gray)]">{i.whyItWorks}</p>
          </article>
        ))}
      </div>
    </>
  );
}
