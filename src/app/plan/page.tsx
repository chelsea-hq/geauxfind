"use client";

import Link from "next/link";
import { FormEvent, Suspense, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { PlaceCard } from "@/components/cards/PlaceCard";
import type { Place } from "@/types";

/* ──────────────────── shared constants ──────────────────── */
const CITIES = [
  "Lafayette", "Breaux Bridge", "Scott", "Broussard", "Youngsville",
  "Opelousas", "Crowley", "Eunice", "Abbeville", "New Iberia",
  "Rayne", "Carencro", "Sunset",
];

const TABS = [
  { key: "vibe", label: "✨ Vibe Match", desc: "Describe your mood — we'll match the spots" },
  { key: "day", label: "🗓️ Day Planner", desc: "Time-blocked itinerary with real stops" },
  { key: "weekend", label: "🎉 Weekend", desc: "Saturday + Sunday, fully planned" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/* ──────────────────── Vibe Match Tab ──────────────────── */
const vibeSuggestions = [
  "chill date night under $50",
  "family brunch with live music",
  "late night eats after a concert",
  "where the locals go for boudin",
  "best po-boys in town",
  "outdoor vibes with drinks",
  "coffee shop to work from",
  "hole-in-the-wall hidden gems",
];

type VibeResult = Place & { why: string };

function VibeTab() {
  const [prompt, setPrompt] = useState("");
  const [city, setCity] = useState("");
  const [summary, setSummary] = useState("");
  const [results, setResults] = useState<VibeResult[]>([]);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/vibe-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), city: city || undefined }),
      });
      const data = await res.json();
      setSummary(data?.summary || "");
      setResults(Array.isArray(data?.results) ? data.results : []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--cast-iron)]">📍 Where are you?</label>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCity("")} className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-all ${!city ? "bg-[var(--cajun-red)] text-white shadow-md" : "border border-[var(--spanish-moss)]/40 bg-white text-[var(--cast-iron)] hover:border-[var(--cajun-red)]/40"}`}>All Acadiana</button>
            {CITIES.map((c) => (
              <button key={c} type="button" onClick={() => setCity(c === city ? "" : c)} className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-all ${city === c ? "bg-[var(--cajun-red)] text-white shadow-md" : "border border-[var(--spanish-moss)]/40 bg-white text-[var(--cast-iron)] hover:border-[var(--cajun-red)]/40"}`}>{c}</button>
            ))}
          </div>
        </div>
        <div>
          <label htmlFor="vibe-input" className="mb-2 block text-sm font-medium text-[var(--cast-iron)]">🎯 What&apos;s the vibe?</label>
          <textarea id="vibe-input" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe your perfect outing…" className="min-h-28 w-full rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-4 text-base text-[var(--cast-iron)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--sunset-gold)]" />
        </div>
        <div className="flex flex-wrap gap-2">
          {vibeSuggestions.map((chip) => (
            <button key={chip} type="button" onClick={() => setPrompt(chip)} className={`min-h-10 rounded-full border px-4 py-2 text-sm transition-all hover:scale-105 ${prompt === chip ? "border-[var(--sunset-gold)] bg-[var(--sunset-gold)]/10 text-[var(--cast-iron)]" : "border-[var(--spanish-moss)]/30 bg-white text-[var(--warm-gray)] hover:border-[var(--sunset-gold)]/50"}`}>{chip}</button>
          ))}
        </div>
        <button type="submit" disabled={loading || !prompt.trim()} className="min-h-12 rounded-full bg-[var(--cajun-red)] px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50">{loading ? "Matching your vibe…" : "Find My Vibe ✨"}</button>
      </form>
      {summary && <div className="fade-up mt-10 rounded-2xl border border-[var(--sunset-gold)]/30 bg-[var(--sunset-gold)]/5 p-5"><p className="text-sm text-[var(--cast-iron)]">🐊 {summary}</p></div>}
      {results.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((place, i) => (
            <div key={place.slug} className="fade-up space-y-3" style={{ animationDelay: `${i * 80}ms` }}>
              <PlaceCard place={place} />
              <p className="rounded-xl border border-[var(--moss)]/20 bg-[var(--moss)]/5 p-3 text-sm text-[var(--cast-iron)]/85">✨ {place.why}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ──────────────────── Day Planner Tab ──────────────────── */
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

type PlanStop = { time: string; note: string; dayPart: "Morning" | "Afternoon" | "Evening"; hiddenGem?: boolean; driveToNextMins?: number | null; place: Place };
type PlanPayload = { headline: string; overview: string; hiddenGemReason: string; stops: PlanStop[] };

function DayTab() {
  const [prompt, setPrompt] = useState("Plan my Saturday in Lafayette");
  const [city, setCity] = useState("Lafayette");
  const [duration, setDuration] = useState<(typeof DURATIONS)[number]["value"]>("full-day");
  const [vibe, setVibe] = useState<(typeof VIBES)[number]["value"]>("foodie");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<PlanPayload | null>(null);

  const grouped = useMemo(() => {
    const stops = plan?.stops || [];
    return { Morning: stops.filter((s) => s.dayPart === "Morning"), Afternoon: stops.filter((s) => s.dayPart === "Afternoon"), Evening: stops.filter((s) => s.dayPart === "Evening") };
  }, [plan]);

  async function runPlan() {
    setLoading(true);
    try {
      const res = await fetch("/api/plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, city, duration, vibe, regenerateSeed: Date.now() }) });
      setPlan(await res.json());
    } finally { setLoading(false); }
  }

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-2">
        <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="What's the plan?" className="min-h-12 rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-4" />
        <div className="grid grid-cols-3 gap-2">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="min-h-12 rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-3">{CITIES.slice(0, 5).map((c) => <option key={c}>{c}</option>)}</select>
          <select value={duration} onChange={(e) => setDuration(e.target.value as typeof duration)} className="min-h-12 rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-3">{DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}</select>
          <select value={vibe} onChange={(e) => setVibe(e.target.value as typeof vibe)} className="min-h-12 rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-3">{VIBES.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}</select>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <button onClick={runPlan} disabled={loading} className="min-h-11 rounded-full bg-[var(--cajun-red)] px-5 font-semibold text-white disabled:opacity-50">{loading ? "Planning…" : "Build My Plan"}</button>
        <button onClick={runPlan} disabled={loading || !plan} className="min-h-11 rounded-full border border-[var(--spanish-moss)]/35 bg-white px-5 disabled:opacity-40">Regenerate</button>
      </div>

      {plan && (
        <section className="mt-8">
          <div className="mb-6 rounded-2xl border border-[var(--sunset-gold)]/30 bg-[var(--cream)] p-4">
            <h2 className="text-3xl text-[var(--cajun-red)]">{plan.headline}</h2>
            <p className="mt-1 text-[var(--warm-gray)]">{plan.overview}</p>
            <p className="mt-2 text-sm">🌟 {plan.hiddenGemReason}</p>
          </div>
          {(["Morning", "Afternoon", "Evening"] as const).map((part) => (
            <div key={part} className="mb-8">
              <h3 className="mb-3 text-2xl">{part}</h3>
              <div className="space-y-4">
                {grouped[part].map((stop) => (
                  <div key={`${stop.time}-${stop.place.slug}`} className="rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-4">
                    <div className="mb-2 flex items-center gap-2 text-sm text-[var(--warm-gray)]">
                      <span className="rounded-full bg-[var(--sunset-gold)]/20 px-2 py-1 font-semibold text-[var(--cast-iron)]">{stop.time}</span>
                      {stop.hiddenGem ? <span>🌶️ Hidden Gem</span> : null}
                    </div>
                    <PlaceCard place={stop.place} compact />
                    <p className="mt-2 text-sm text-[var(--cast-iron)]/80">{stop.note}</p>
                    {stop.driveToNextMins ? <p className="mt-2 text-xs text-[var(--warm-gray)]">🚗 ~{stop.driveToNextMins} min to next stop</p> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}

/* ──────────────────── Weekend Tab ──────────────────── */
const groups = ["solo", "date", "family", "friends"] as const;
const budgets = ["$", "$$", "$$$"] as const;
const interestOptions = ["Food", "Music", "Outdoors", "Culture", "Nightlife"];

type WeekendStop = { slot: string; plan: string; slug: string; place: { slug: string; name: string; address: string; category: string; city: string } };

function WeekendTab() {
  const [group, setGroup] = useState<(typeof groups)[number]>("date");
  const [budget, setBudget] = useState<(typeof budgets)[number]>("$$");
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Food", "Music"]);
  const [overview, setOverview] = useState("");
  const [saturday, setSaturday] = useState<WeekendStop[]>([]);
  const [sunday, setSunday] = useState<WeekendStop[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleInterest = (interest: string) => setSelectedInterests((prev) => prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/weekend-plan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ group, budget, interests: selectedInterests }) });
      const data = await res.json();
      setOverview(data?.overview || "");
      setSaturday(Array.isArray(data?.saturday) ? data.saturday : []);
      setSunday(Array.isArray(data?.sunday) ? data.sunday : []);
    } finally { setLoading(false); }
  };

  const DaySection = ({ title, stops }: { title: string; stops: WeekendStop[] }) => (
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
    <div>
      <div className="grid gap-6 rounded-2xl border bg-white p-5 lg:grid-cols-3">
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
          <div className="flex flex-wrap gap-2">{interestOptions.map((item) => <button key={item} onClick={() => toggleInterest(item)} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${selectedInterests.includes(item) ? "bg-[var(--sunset-gold)] text-[var(--cast-iron)]" : "bg-white"}`}>{item}</button>)}</div>
        </div>
      </div>
      <button onClick={generate} disabled={loading} className="mt-6 min-h-11 rounded-full bg-[var(--cajun-red)] px-6 py-3 font-semibold text-white disabled:opacity-60">{loading ? "Generating itinerary…" : "Generate Weekend Plan"}</button>
      {overview && <p className="mt-6 rounded-xl border bg-white p-4">🐊 {overview}</p>}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {saturday.length > 0 && <DaySection title="Saturday" stops={saturday} />}
        {sunday.length > 0 && <DaySection title="Sunday" stops={sunday} />}
      </div>
    </div>
  );
}

/* ──────────────────── Main Plan Page ──────────────────── */
function PlanPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const tabParam = params.get("tab");
  const activeTab: TabKey = (tabParam === "vibe" || tabParam === "day" || tabParam === "weekend") ? tabParam : "vibe";

  const setTab = (tab: TabKey) => {
    const url = tab === "vibe" ? "/plan" : `/plan?tab=${tab}`;
    router.replace(url, { scroll: false });
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--sunset-gold)]/30 bg-[linear-gradient(140deg,#fff7ea,#fff)] p-6 md:p-8">
        <div className="absolute right-4 top-4 text-2xl opacity-35">⚜️</div>
        <h1 className="text-4xl text-[var(--cajun-red)] md:text-5xl">Plan Your Acadiana Adventure</h1>
        <p className="mt-2 max-w-2xl text-[var(--warm-gray)]">Whether you need a quick vibe check, a full day itinerary, or an entire weekend, this Cajun-country planner helps you map food, music, and must-see local stops.</p>
      </section>

      {/* Tab navigation */}
      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setTab(tab.key)}
            className={`min-h-11 shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-[var(--cajun-red)] text-white shadow-md"
                : "border border-[var(--spanish-moss)]/35 bg-white text-[var(--cast-iron)] hover:border-[var(--cajun-red)]/40"
            }`}
            aria-label={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-[var(--warm-gray)]">{TABS.find((t) => t.key === activeTab)?.desc}</p>

      {/* Tab content */}
      <div className="mt-6">
        {activeTab === "vibe" && <VibeTab />}
        {activeTab === "day" && <DayTab />}
        {activeTab === "weekend" && <WeekendTab />}
      </div>
    </main>
  );
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10"><div className="h-96 rounded-3xl bg-[var(--spanish-moss)]/20 shimmer" /></div>}>
      <PlanPageContent />
    </Suspense>
  );
}
