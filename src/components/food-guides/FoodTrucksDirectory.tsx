"use client";

import { useMemo, useState } from "react";
import data from "../../../data/food-trucks.json";

export function FoodTrucksDirectory() {
  const [cuisine, setCuisine] = useState("All");
  const cuisines = useMemo(() => ["All", ...Array.from(new Set(data.trucks.map((t) => t.cuisine))).sort()], []);
  const filtered = data.trucks.filter((t) => cuisine === "All" || t.cuisine === cuisine);

  return (
    <>
      <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
        <label className="text-sm text-[var(--warm-gray)]">Cuisine
          <select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2 md:max-w-sm">
            {cuisines.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      </div>
      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} trucks • last updated {data.lastUpdated}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((t) => (
          <article key={t.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <h3 className="text-xl text-[var(--cajun-red)]">{t.name}</h3>
            <p className="text-sm text-[var(--warm-gray)]">{t.cuisine}</p>
            <p className="mt-2 text-sm"><span className="font-semibold">Schedule:</span> {t.schedule}</p>
            <p className="mt-2 text-sm font-semibold">Typical stops</p>
            <ul className="list-disc pl-5 text-sm text-[var(--warm-gray)]">
              {t.typicalLocations.map((loc) => <li key={loc}>{loc}</li>)}
            </ul>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {t.socials.instagram ? <a href={t.socials.instagram} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">Instagram</a> : null}
              {t.socials.facebook ? <a href={t.socials.facebook} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">Facebook</a> : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
