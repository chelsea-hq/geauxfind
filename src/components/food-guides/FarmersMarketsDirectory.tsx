"use client";

import { useMemo, useState } from "react";
import data from "../../../data/farmers-markets.json";

const DAYS = ["All", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function FarmersMarketsDirectory() {
  const [day, setDay] = useState("All");

  const filtered = useMemo(() => data.markets.filter((m) => day === "All" || m.days.includes(day)), [day]);

  return (
    <>
      <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
        <label className="text-sm text-[var(--warm-gray)]">Day of week
          <select value={day} onChange={(e) => setDay(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2 md:max-w-sm">
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} markets • last updated {data.lastUpdated}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((m) => (
          <article key={m.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <h3 className="text-xl text-[var(--cajun-red)]">{m.name}</h3>
            <p className="mt-1 text-sm text-[var(--warm-gray)]">{m.location}</p>
            <div className="mt-3 grid gap-1 text-sm text-[var(--warm-gray)]">
              <p><span className="font-semibold text-[var(--cast-iron)]">Days:</span> {m.days.join(", ")}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Hours:</span> {m.hours}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Seasonal:</span> {m.seasonal ? "Yes" : "No"}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">What to expect:</span> {m.expect}</p>
              <p><span className="font-semibold text-[var(--cast-iron)]">Parking:</span> {m.parking}</p>
              <a href={m.website} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">Website</a>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
