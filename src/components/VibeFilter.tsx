"use client";

import { Place } from "@/types";

export type VibeKey = "all" | "foodie" | "family" | "night-out" | "budget" | "new-here" | "live-music";

const vibeOptions: { key: VibeKey; label: string }[] = [
  { key: "all", label: "✨ All Vibes" },
  { key: "foodie", label: "🍳 Foodie" },
  { key: "family", label: "👨‍👩‍👧 Family" },
  { key: "night-out", label: "🌙 Night Out" },
  { key: "budget", label: "💰 Budget" },
  { key: "new-here", label: "🆕 New Here" },
  { key: "live-music", label: "🎵 Live Music" }
];

export function applyVibeFilter(items: Place[], vibe: VibeKey): Place[] {
  if (vibe === "all") return items;

  if (vibe === "new-here") {
    const starterPack = [...items].sort((a, b) => b.rating - a.rating).slice(0, 20);
    const starterIds = new Set(starterPack.map((p) => p.slug));
    return items.filter((p) => starterIds.has(p.slug));
  }

  return items.filter((place) => {
    const tags = new Set(place.smartTags ?? []);

    switch (vibe) {
      case "foodie":
        return tags.has("Cajun Classic") && place.rating >= 4.3;
      case "family":
        return tags.has("Kid-Friendly");
      case "night-out":
        return tags.has("Late Night") || tags.has("Date Night");
      case "budget":
        return tags.has("Budget Friendly");
      case "live-music":
        return tags.has("Live Music");
      default:
        return true;
    }
  });
}

export function VibeFilter({ selected, onChange }: { selected: VibeKey; onChange: (vibe: VibeKey) => void }) {
  return (
    <div className="-mx-1 overflow-x-auto pb-2">
      <div className="flex min-w-max gap-2 px-1">
        {vibeOptions.map((option) => {
          const active = option.key === selected;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-[var(--cajun-red)] bg-[var(--cajun-red)] text-white"
                  : "border-[var(--warm-gray)]/25 bg-white text-[var(--cast-iron)] hover:border-[var(--bayou-gold)]/50 hover:bg-[var(--cream-bg)]"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
