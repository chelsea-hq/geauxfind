"use client";

import { useMemo, useState } from "react";
import data from "../../../data/happy-hours.json";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const todayLabel = DAYS[(new Date().getDay() + 6) % 7];

export function HappyHoursDirectory() {
  const [day, setDay] = useState<string>(todayLabel);
  const [area, setArea] = useState<string>("All");

  const areas = useMemo(() => ["All", ...Array.from(new Set(data.venues.flatMap((v) => v.locations))).sort()], []);

  const filtered = useMemo(() => data.venues.filter((v) => {
    const dayMatch = day === "All" || v.happyHours.some((h) => h.days.includes(day));
    const areaMatch = area === "All" || v.locations.includes(area);
    return dayMatch && areaMatch;
  }), [day, area]);

  return (
    <>
      <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:grid-cols-2">
        <label className="text-sm text-[var(--warm-gray)]">Day
          <select value={day} onChange={(e) => setDay(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            <option value="All">All days</option>
            {DAYS.map((d) => <option key={d} value={d}>{d}{d === todayLabel ? " (Today)" : ""}</option>)}
          </select>
        </label>
        <label className="text-sm text-[var(--warm-gray)]">Area
          <select value={area} onChange={(e) => setArea(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} venues • last updated {data.lastUpdated}</p>

      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((v) => (
          <article key={v.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl text-[var(--cajun-red)]">{v.name}</h3>
                <p className="text-sm text-[var(--warm-gray)]">{v.category} • {v.locations.join(", ")}</p>
              </div>
              <a href={v.website} target="_blank" rel="noreferrer" className="text-sm text-[var(--cajun-red)]">Website</a>
            </div>
            <p className="mt-2 text-sm text-[var(--cast-iron)]/85">{v.vibe}</p>
            <div className="mt-4 space-y-3">
              {v.happyHours.filter((h) => day === "All" || h.days.includes(day)).map((h, idx) => (
                <div key={idx} className="rounded-[10px] bg-[var(--cream)] p-3">
                  <p className="text-sm font-semibold text-[var(--cast-iron)]">{h.days.join(", ")} • {h.hours}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--warm-gray)]">
                    {h.deals.map((deal) => <li key={deal}>{deal}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
