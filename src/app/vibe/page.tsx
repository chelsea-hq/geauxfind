"use client";

import { FormEvent, useState } from "react";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { Place } from "@/types";

const CITIES = [
  "Lafayette", "Breaux Bridge", "Scott", "Broussard", "Youngsville",
  "Opelousas", "Crowley", "Eunice", "Abbeville", "New Iberia",
  "Rayne", "Carencro", "Sunset",
];

const suggestions = [
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

export default function VibePage() {
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
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-4xl text-[var(--cajun-red)]">✨ Vibe Match</h1>
        <p className="mt-2 text-lg text-[var(--warm-gray)]">
          Describe your perfect outing and we&apos;ll find the spots — from hidden gems to local favorites.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* City selector */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--cast-iron)]">📍 Where are you?</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCity("")}
              className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                !city
                  ? "bg-[var(--cajun-red)] text-white shadow-md"
                  : "border border-[var(--spanish-moss)]/40 bg-white text-[var(--cast-iron)] hover:border-[var(--cajun-red)]/40"
              }`}
            >
              All Acadiana
            </button>
            {CITIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCity(c === city ? "" : c)}
                className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  city === c
                    ? "bg-[var(--cajun-red)] text-white shadow-md"
                    : "border border-[var(--spanish-moss)]/40 bg-white text-[var(--cast-iron)] hover:border-[var(--cajun-red)]/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Vibe input */}
        <div>
          <label htmlFor="vibe-input" className="mb-2 block text-sm font-medium text-[var(--cast-iron)]">🎯 What&apos;s the vibe?</label>
          <textarea
            id="vibe-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your perfect outing…"
            className="min-h-28 w-full rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-4 text-base text-[var(--cast-iron)] outline-none transition-shadow duration-200 focus:ring-2 focus:ring-[var(--sunset-gold)]"
          />
        </div>

        {/* Suggestion chips */}
        <div className="flex flex-wrap gap-2">
          {suggestions.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setPrompt(chip)}
              className={`min-h-10 rounded-full border px-4 py-2 text-sm transition-all duration-200 hover:scale-105 ${
                prompt === chip
                  ? "border-[var(--sunset-gold)] bg-[var(--sunset-gold)]/10 text-[var(--cast-iron)]"
                  : "border-[var(--spanish-moss)]/30 bg-white text-[var(--warm-gray)] hover:border-[var(--sunset-gold)]/50 hover:bg-[var(--cream)]"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading || !prompt.trim()}
          className="min-h-12 rounded-full bg-[var(--cajun-red)] px-8 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:translate-y-[-1px] hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
        >
          {loading ? "Matching your vibe…" : "Find My Vibe ✨"}
        </button>
      </form>

      {summary && (
        <div className="fade-up mt-10 rounded-2xl border border-[var(--sunset-gold)]/30 bg-[var(--sunset-gold)]/5 p-5">
          <p className="text-sm text-[var(--cast-iron)]">🐊 {summary}</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {results.map((place, i) => (
            <div key={place.slug} className="fade-up space-y-3" style={{ animationDelay: `${i * 80}ms` }}>
              <PlaceCard place={place} />
              <p className="rounded-xl border border-[var(--moss)]/20 bg-[var(--moss)]/5 p-3 text-sm text-[var(--cast-iron)]/85">
                ✨ {place.why}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
