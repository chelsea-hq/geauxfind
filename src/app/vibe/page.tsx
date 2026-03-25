"use client";

import { FormEvent, useState } from "react";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { Place } from "@/types";

const suggestions = [
  "chill date night under $50",
  "family brunch with live music",
  "late night eats after a concert",
  "where the locals go for boudin",
];

type VibeResult = Place & { why: string };

export default function VibePage() {
  const [prompt, setPrompt] = useState("");
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
        body: JSON.stringify({ prompt: prompt.trim() }),
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
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">Vibe Match</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Describe your perfect outing and let AI curate the night.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your perfect outing..."
          className="min-h-32 w-full rounded-2xl border bg-white p-4 text-base outline-none focus:ring-2 focus:ring-[var(--bayou-gold)]"
        />
        <div className="flex flex-wrap gap-2">
          {suggestions.map((chip) => (
            <button key={chip} type="button" onClick={() => setPrompt(chip)} className="min-h-11 rounded-full border bg-white px-4 py-2 text-sm hover:bg-[var(--cream-bg)]">
              {chip}
            </button>
          ))}
        </div>
        <button type="submit" disabled={loading} className="min-h-11 rounded-full bg-[var(--cajun-red)] px-6 py-3 font-semibold text-white disabled:opacity-60">
          {loading ? "Matching your vibe..." : "Find My Vibe"}
        </button>
      </form>

      {summary && <div className="mt-8 rounded-2xl border bg-white p-5 text-sm">🤖 {summary}</div>}

      <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {results.map((place) => (
          <div key={place.slug} className="space-y-3">
            <PlaceCard place={place} />
            <p className="rounded-xl border bg-white p-3 text-sm text-[var(--cast-iron)]/85">✨ {place.why}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
