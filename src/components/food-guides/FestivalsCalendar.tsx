"use client";

import { useMemo, useState } from "react";
import data from "../../../data/festivals.json";

const MONTHS = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function FestivalsCalendar() {
  const [month, setMonth] = useState("All");

  const grouped = useMemo(() => {
    const filtered = data.festivals.filter((f) => month === "All" || f.month === month);
    return MONTHS.slice(1).reduce<Record<string, typeof filtered>>((acc, m) => {
      acc[m] = filtered.filter((f) => f.month === m);
      return acc;
    }, {});
  }, [month]);

  const total = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0);

  return (
    <>
      <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
        <label className="text-sm text-[var(--warm-gray)]">Month
          <select value={month} onChange={(e) => setMonth(e.target.value)} className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2 md:max-w-sm">
            {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{total} festivals • last updated {data.lastUpdated}</p>

      <div className="space-y-6">
        {Object.entries(grouped).map(([m, festivals]) => festivals.length > 0 ? (
          <section key={m} className="space-y-3">
            <h3 className="text-2xl text-[var(--cajun-red)]">{m}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {festivals.map((f) => (
                <article key={f.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--moss)]">{f.dates} • {f.location}</p>
                  <h4 className="mt-1 text-xl text-[var(--cajun-red)]">{f.name}</h4>
                  <p className="mt-2 text-sm text-[var(--cast-iron)]/85">{f.description}</p>
                  <div className="mt-3 grid gap-1 text-sm text-[var(--warm-gray)]">
                    <p><span className="font-semibold text-[var(--cast-iron)]">Cost:</span> {f.cost}</p>
                    <p><span className="font-semibold text-[var(--cast-iron)]">Music:</span> {f.music}</p>
                    <p><span className="font-semibold text-[var(--cast-iron)]">Food:</span> {f.food}</p>
                    <p><span className="font-semibold text-[var(--cast-iron)]">Tip:</span> {f.tips}</p>
                    <a href={f.website} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)]">Official site</a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null)}
      </div>
    </>
  );
}
