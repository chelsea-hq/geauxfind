"use client";

import { useMemo, useState } from "react";
import data from "../../../data/daily-specials.json";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const todayLabel = DAYS[(new Date().getDay() + 6) % 7];

export function DailySpecialsDirectory() {
  const [day, setDay] = useState<string>(todayLabel);
  const [mealType, setMealType] = useState<string>("All");

  const mealTypes = useMemo(() => ["All", ...Array.from(new Set(data.restaurants.flatMap((r) => r.specials.map((s) => s.mealType)))).sort()], []);

  const filtered = useMemo(() => data.restaurants.filter((r) => r.specials.some((s) => (day === "All" || s.days.includes(day)) && (mealType === "All" || s.mealType === mealType))), [day, mealType]);

  return (
    <>
      <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:grid-cols-2">
        <label className="text-sm text-[var(--warm-gray)]">Day
          <select value={day} onChange={(e) => setDay(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            <option value="All">All days</option>
            {DAYS.map((d) => <option key={d} value={d}>{d}{d === todayLabel ? " (Today)" : ""}</option>)}
          </select>
        </label>
        <label className="text-sm text-[var(--warm-gray)]">Meal Type
          <select value={mealType} onChange={(e) => setMealType(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2">
            {mealTypes.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} restaurants • last updated {data.lastUpdated}</p>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((r) => (
          <article key={r.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl text-[var(--cajun-red)]">{r.name}</h3>
                <p className="text-sm text-[var(--warm-gray)]">{r.locations.join(", ")}</p>
              </div>
              <a href={r.website} target="_blank" rel="noreferrer" className="text-sm text-[var(--cajun-red)]">Website</a>
            </div>
            <p className="mt-2 text-sm text-[var(--cast-iron)]/85">{r.knownFor}</p>
            <div className="mt-4 space-y-3">
              {r.specials.filter((s) => (day === "All" || s.days.includes(day)) && (mealType === "All" || s.mealType === mealType)).map((s, idx) => (
                <div key={idx} className="rounded-[10px] bg-[var(--cream)] p-3">
                  <p className="text-sm font-semibold">{s.mealType} • {s.hours}</p>
                  <p className="text-xs text-[var(--warm-gray)]">{s.days.join(", ")}</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-[var(--warm-gray)]">
                    {s.items.map((item) => <li key={item}>{item}</li>)}
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
