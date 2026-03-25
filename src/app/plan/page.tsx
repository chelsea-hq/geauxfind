"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { PlaceCard } from "@/components/cards/PlaceCard";
import type { Place } from "@/types";

const CITIES = ["Lafayette", "Broussard", "Youngsville", "Breaux Bridge", "New Iberia"];
const DURATIONS = [
  { value: "half-day", label: "Half day" },
  { value: "full-day", label: "Full day" },
  { value: "weekend", label: "Weekend" },
] as const;
const VIBES = [
  { value: "foodie", label: "Foodie Tour" },
  { value: "family", label: "Family Day" },
  { value: "date-night", label: "Date Night" },
  { value: "adventure", label: "Adventure" },
  { value: "culture", label: "Culture" },
] as const;

type PlanStop = {
  time: string;
  note: string;
  dayPart: "Morning" | "Afternoon" | "Evening";
  hiddenGem?: boolean;
  driveToNextMins?: number | null;
  place: Place;
};

type PlanPayload = {
  headline: string;
  overview: string;
  hiddenGemReason: string;
  stops: PlanStop[];
};

export default function PlanPage() {
  const [prompt, setPrompt] = useState("Plan my Saturday in Lafayette");
  const [city, setCity] = useState("Lafayette");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]["value"]>("full-day");
  const [vibe, setVibe] = useState<(typeof VIBES)[number]["value"]>("foodie");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanPayload | null>(null);

  const grouped = useMemo(() => {
    const stops = plan?.stops || [];
    return {
      Morning: stops.filter((s: PlanStop) => s.dayPart === "Morning"),
      Afternoon: stops.filter((s: PlanStop) => s.dayPart === "Afternoon"),
      Evening: stops.filter((s: PlanStop) => s.dayPart === "Evening"),
    };
  }, [plan]);

  async function runPlan() {
    setLoading(true);
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, city, duration, vibe, regenerateSeed: Date.now() }),
      });
      const data = (await res.json()) as PlanPayload;
      setPlan(data);
    } finally {
      setLoading(false);
    }
  }

  async function sharePlan() {
    const text = plan?.headline
      ? `${plan.headline}\n\n${(plan.stops || []).map((s: PlanStop) => `${s.time} - ${s.place?.name}`).join("\n")}`
      : "Build your GeauxFind plan first!";
    await navigator.clipboard.writeText(text);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--sunset-gold)]/30 bg-[linear-gradient(140deg,#fff7ea,#fff)] p-6 md:p-8">
        <div className="absolute right-4 top-4 text-2xl opacity-35">⚜️</div>
        <div className="absolute left-4 top-16 text-2xl opacity-25">🦞</div>
        <h1 className="text-4xl text-[var(--cajun-red)] md:text-5xl">AI Itinerary Builder</h1>
        <p className="mt-2 text-[var(--warm-gray)]">Tell Geaux your vibe, then get a time-blocked day plan with real Acadiana spots.</p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <input value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-12 rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-4" />
          <div className="grid grid-cols-3 gap-2">
            <select value={city} onChange={(e) => setCity(e.target.value)} className="min-h-12 rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-3">
              {CITIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <select value={duration} onChange={(e) => setDuration(e.target.value as (typeof DURATIONS)[number]["value"])} className="min-h-12 rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-3">
              {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
            <select value={vibe} onChange={(e) => setVibe(e.target.value as (typeof VIBES)[number]["value"])} className="min-h-12 rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-3">
              {VIBES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={runPlan} disabled={loading} className="min-h-11 rounded-full bg-[var(--cajun-red)] px-5 font-semibold text-white">{loading ? "Planning your day..." : "Build My Plan"}</button>
          <button onClick={runPlan} disabled={loading || !plan} className="min-h-11 rounded-full border border-[var(--spanish-moss)]/35 bg-white px-5">Regenerate</button>
          <button onClick={sharePlan} disabled={!plan} className="min-h-11 rounded-full border border-[var(--spanish-moss)]/35 bg-white px-5">Share this plan</button>
        </div>
      </section>

      {plan && (
        <section className="mt-8">
          <div className="mb-6 rounded-2xl border border-[var(--sunset-gold)]/30 bg-[var(--cream)] p-4">
            <h2 className="text-3xl text-[var(--cajun-red)]">{plan.headline}</h2>
            <p className="mt-1 text-[var(--warm-gray)]">{plan.overview}</p>
            <p className="mt-2 text-sm">🌟 Hidden gem callout: {plan.hiddenGemReason}</p>
          </div>

          {(["Morning", "Afternoon", "Evening"] as const).map((part) => (
            <div key={part} className="mb-8">
              <h3 className="mb-3 text-2xl">{part}</h3>
              <div className="space-y-4">
                {grouped[part].map((stop: PlanStop, idx: number) => (
                  <div key={`${stop.time}-${stop.place.slug}`} className="rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-[var(--warm-gray)]">
                      <span className="rounded-full bg-[var(--sunset-gold)]/20 px-2 py-1 font-semibold text-[var(--cast-iron)]">{stop.time}</span>
                      {stop.hiddenGem ? <span>🌶️ Hidden Gem</span> : null}
                    </div>
                    <PlaceCard place={stop.place} compact />
                    <p className="mt-2 text-sm text-[var(--cast-iron)]/80">{stop.note}</p>
                    {stop.driveToNextMins ? <p className="mt-2 text-xs text-[var(--warm-gray)]">🚗 ~{stop.driveToNextMins} min to next stop</p> : null}
                    {idx === 0 && part === "Morning" ? <Image src="/mascot/gator-wave.svg" alt="Geaux" width={56} height={56} className="mt-2" /> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}
