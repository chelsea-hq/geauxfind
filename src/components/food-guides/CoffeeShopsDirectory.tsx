"use client";

import { useMemo, useState } from "react";
import data from "../../../data/coffee-shops.json";

export function CoffeeShopsDirectory() {
  const [area, setArea] = useState("All");
  const [wifi, setWifi] = useState("All");

  const areas = useMemo(() => ["All", ...Array.from(new Set(data.shops.flatMap((s) => s.locations))).sort()], []);
  const wifiOptions = ["All", "Excellent", "Good", "Fair"];

  const filtered = useMemo(() => data.shops.filter((s) => {
    const areaMatch = area === "All" || s.locations.includes(area);
    const wifiMatch = wifi === "All" || s.wifi === wifi;
    return areaMatch && wifiMatch;
  }), [area, wifi]);

  return (
    <>
      <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:grid-cols-2">
        <label className="text-sm text-[var(--warm-gray)]">Area
          <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <label className="text-sm text-[var(--warm-gray)]">WiFi quality
          <select value={wifi} onChange={(e) => setWifi(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            {wifiOptions.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} coffee shops • last updated {data.lastUpdated}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((s) => (
          <article key={s.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl text-[var(--cajun-red)]">{s.name}</h3>
                <p className="text-sm text-[var(--warm-gray)]">{s.locations.join(", ")}</p>
              </div>
              <a href={s.website} target="_blank" rel="noreferrer" className="text-sm text-[var(--cajun-red)]">Website</a>
            </div>
            <p className="mt-3 text-sm text-[var(--cast-iron)]/85">{s.vibe}</p>
            <div className="mt-3 grid gap-1 text-sm text-[var(--warm-gray)]">
              <p><span className="font-semibold text-[var(--cast-iron)]">Hours:</span> {s.hours}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Roasts in-house:</span> {s.roastsOwn ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Outdoor seating:</span> {s.outdoorSeating ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Specialty:</span> {s.specialty}</p>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
