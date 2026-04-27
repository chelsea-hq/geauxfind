"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useNow } from "@/hooks/use-now";
import whosGotItData from "../../../data/whos-got-it.json";

type Item = (typeof whosGotItData.items)[number];
type Category = "All" | "Cajun Classics" | "Street Food" | "Sweet Treats" | "Global Flavors";

const CATEGORY_ITEMS: Record<Exclude<Category, "All">, string[]> = {
  "Cajun Classics": [
    "Boudin",
    "Cracklins",
    "Crawfish",
    "Gumbo",
    "Étouffée",
    "Plate Lunch",
    "Fried Chicken",
    "Fresh Sausage",
    "Chicken Salad",
    "BBQ / Smoked Meats",
    "Seafood Platter",
    "Meat Pies",
  ],
  "Street Food": ["Po'boys", "Burgers", "Wings", "Tacos", "Daiquiris", "Pizza"],
  "Sweet Treats": ["King Cake", "Bread Pudding", "Snowballs"],
  "Global Flavors": ["Sushi", "Mexican Food"],
};

const ITEM_EMOJI: Record<string, string> = {
  Boudin: "🌭",
  Cracklins: "🥓",
  Crawfish: "🦞",
  Gumbo: "🍲",
  "Étouffée": "🍛",
  "Plate Lunch": "🍽️",
  "Fried Chicken": "🍗",
  "Chicken Salad": "🥗",
  "Po'boys": "🥖",
  Burgers: "🍔",
  Pizza: "🍕",
  Wings: "🍗",
  Tacos: "🌮",
  "Mexican Food": "🇲🇽",
  Sushi: "🍣",
  Daiquiris: "🍹",
  Snowballs: "🍧",
  "BBQ / Smoked Meats": "🔥",
  "Meat Pies": "🥟",
  "Seafood Platter": "🦐",
  "King Cake": "👑",
  "Bread Pudding": "🍮",
  "Beef Jerky": "🥩",
  "Fresh Sausage": "🌶️",
};

function getSeasonSpotlight(now: Date | null) {
  // Stable default before hydration so SSR and client first paint match.
  if (!now) return "Gumbo";
  const month = now.getMonth() + 1;

  if (month >= 3 && month <= 6) return "Crawfish";
  if (month >= 6 && month <= 9) return "Snowballs";
  if (month >= 1 && month <= 2) return "King Cake";
  return "Gumbo";
}

export default function WhosGotItPage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const now = useNow();
  const spotlight = getSeasonSpotlight(now);

  const filteredItems = useMemo(() => {
    if (activeCategory === "All") return whosGotItData.items;
    const allowed = new Set(CATEGORY_ITEMS[activeCategory]);
    return whosGotItData.items.filter((entry) => allowed.has(entry.item));
  }, [activeCategory]);

  return (
    <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:pt-10">
      <section className="rounded-3xl border border-[var(--warm-gray)]/40 bg-[var(--cream)] p-6 shadow-sm sm:p-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cajun-red)]">Acadiana Food Debates</p>
        <h1 className="text-4xl font-black tracking-tight text-[var(--cast-iron)] sm:text-5xl">👑 Who&apos;s Got It?</h1>
        <p className="mt-3 max-w-2xl text-sm text-[var(--cast-iron)]/80 sm:text-base">
          The definitive (and highly debatable) guide to Acadiana&apos;s best bites.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--spanish-moss)]/30 bg-white px-4 py-2 text-sm text-[var(--cast-iron)]">
          <span className="font-semibold text-[var(--moss)]">Season Spotlight:</span>
          <span>{ITEM_EMOJI[spotlight] ?? "🍽️"} {spotlight}</span>
        </div>
      </section>

      <section className="mt-6 flex flex-wrap gap-2">
        {(["All", "Cajun Classics", "Street Food", "Sweet Treats", "Global Flavors"] as Category[]).map((pill) => {
          const active = activeCategory === pill;
          return (
            <button
              key={pill}
              type="button"
              onClick={() => setActiveCategory(pill)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-[var(--cajun-red)] bg-[var(--cajun-red)] text-white"
                  : "border-[var(--warm-gray)]/50 bg-white text-[var(--cast-iron)] hover:border-[var(--spanish-moss)]"
              }`}
            >
              {pill}
            </button>
          );
        })}
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filteredItems.map((entry) => (
          <DebateCard key={entry.item} entry={entry} />
        ))}
      </section>
    </main>
  );
}

function DebateCard({ entry }: { entry: Item }) {
  const topContenders = entry.contenders.slice(0, 3);

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-[var(--warm-gray)]/40 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight text-[var(--cast-iron)]">
          {ITEM_EMOJI[entry.item] ?? "🍴"} {entry.item}
        </h2>
        <span className="shrink-0 rounded-full bg-[var(--cream)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--moss)]">
          {entry.type}
        </span>
      </div>

      <p className="mb-4 text-sm leading-relaxed text-[var(--cast-iron)]/80">{entry.description}</p>

      <div className="space-y-3">
        {topContenders.map((contender) => (
          <div key={`${entry.item}-${contender.placeName}`} className="rounded-xl border border-[var(--warm-gray)]/30 bg-[var(--cream)]/55 p-3">
            <div className="mb-1 flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--cajun-red)]">{contender.badge}</span>
              <span className="text-xs font-semibold text-[var(--cast-iron)]">⭐ {contender.rating.toFixed(1)}</span>
            </div>
            {contender.slug ? (
              <Link href={`/place/${contender.slug}`} className="text-sm font-bold text-[var(--cast-iron)] underline-offset-2 hover:text-[var(--cajun-red)] hover:underline">
                {contender.placeName}
              </Link>
            ) : (
              <p className="text-sm font-bold text-[var(--cast-iron)]">{contender.placeName}</p>
            )}
            <p className="mt-1 text-xs italic leading-relaxed text-[var(--cast-iron)]/80">“{contender.caseFor}”</p>
          </div>
        ))}
      </div>

      {entry.allSpots.length > 0 && (
        <details className="mt-4 rounded-lg border border-[var(--warm-gray)]/30 bg-[var(--cream)]/35 p-3 text-sm">
          <summary className="cursor-pointer font-semibold text-[var(--cast-iron)]">Also Worth Trying</summary>
          <ul className="mt-2 space-y-2">
            {entry.allSpots.map((spot) => (
              <li key={`${entry.item}-${spot.placeName}`} className="text-xs text-[var(--cast-iron)]/85">
                {spot.slug ? (
                  <Link href={`/place/${spot.slug}`} className="font-semibold text-[var(--moss)] hover:text-[var(--cajun-red)] hover:underline">
                    {spot.placeName}
                  </Link>
                ) : (
                  <span className="font-semibold text-[var(--moss)]">{spot.placeName}</span>
                )}
                {spot.note ? <span> — {spot.note}</span> : null}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-auto pt-4">
        <a href="/community" className="text-xs font-medium text-[var(--cast-iron)]/65 transition group-hover:text-[var(--cajun-red)]">
          Have a hot take? Tell us →
        </a>
      </div>
    </article>
  );
}
