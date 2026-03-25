"use client";

import Link from "next/link";
import { useState } from "react";

const groups = ["solo", "date", "family", "friends"] as const;
const budgets = ["$", "$$", "$$$"] as const;
const interests = ["Food", "Music", "Outdoors", "Culture", "Nightlife"];

type Stop = {
  slot: string;
  plan: string;
  slug: string;
  place: { slug: string; name: string; address: string; category: string; city: string };
};

export default function WeekendPage() {
  const [group, setGroup] = useState<(typeof groups)[number]>("date");
  const [budget, setBudget] = useState<(typeof budgets)[number]>("$$");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Food", "Music"]);
  const [overview, setOverview] = useState("");
  const [saturday, setSaturday] = useState<Stop[]>([]);
  const [sunday, setSunday] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) => (prev.includes(interest) ? prev.filter((item) => item !== interest) : [...prev, interest]));
  };

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/weekend-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ group, budget, interests: selectedInterests }),
      });
      const data = await res.json();
      setOverview(data?.overview || "");
      setSaturday(Array.isArray(data?.saturday) ? data.saturday : []);
      setSunday(Array.isArray(data?.sunday) ? data.sunday : []);
    } finally {
      setLoading(false);
    }
  };

  const Day = ({ title, stops }: { title: string; stops: Stop[] }) => (
    <section className="rounded-2xl border bg-white p-5">
      <h2 className="font-serif text-2xl text-[var(--cajun-red)]">{title}</h2>
      <div className="mt-4 space-y-3">
        {stops.map((stop) => (
          <div key={`${title}-${stop.slot}-${stop.slug}`} className="rounded-xl border bg-[var(--cream-bg)] p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--bayou-green)]">{stop.slot}</p>
            <Link href={`/place/${stop.place.slug}`} className="mt-1 block font-semibold hover:underline">{stop.place.name}</Link>
            <p className="text-sm text-[var(--warm-gray)]">{stop.place.address}</p>
            <p className="mt-1 text-sm">{stop.plan}</p>
          </div>
        ))}
      </div>
    </section>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">Your Perfect Weekend in Acadiana</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Build a custom Saturday + Sunday itinerary with real local spots.</p>

      <div className="mt-8 grid gap-6 rounded-2xl border bg-white p-5 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-sm font-semibold">Who&apos;s going?</p>
          <div className="flex flex-wrap gap-2">{groups.map((item) => <button key={item} onClick={() => setGroup(item)} className={`min-h-11 rounded-full border px-4 py-2 text-sm capitalize ${group === item ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>{item}</button>)}</div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Budget</p>
          <div className="flex gap-2">{budgets.map((item) => <button key={item} onClick={() => setBudget(item)} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${budget === item ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>{item}</button>)}</div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Interests</p>
          <div className="flex flex-wrap gap-2">{interests.map((item) => <button key={item} onClick={() => toggleInterest(item)} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${selectedInterests.includes(item) ? "bg-[var(--bayou-gold)]" : "bg-white"}`}>{item}</button>)}</div>
        </div>
      </div>

      <button onClick={generate} disabled={loading} className="mt-6 min-h-11 rounded-full bg-[var(--cajun-red)] px-6 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Generating itinerary..." : "Generate Weekend Plan"}</button>

      {overview && <p className="mt-6 rounded-xl border bg-white p-4">🤖 {overview}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {saturday.length > 0 && <Day title="Saturday" stops={saturday} />}
        {sunday.length > 0 && <Day title="Sunday" stops={sunday} />}
      </div>
    </main>
  );
}
