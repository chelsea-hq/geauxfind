"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import data from "../../../data/whos-got-it.json";
import communityRecs from "../../../data/community-recs.json";
import { places } from "@/data/mock-data";
import { JsonLd } from "@/components/JsonLd";

const badgeTone: Record<string, string> = {
  "👑 Crowd Favorite": "bg-amber-100 text-amber-900",
  "🏆 Geaux's Pick": "bg-emerald-100 text-emerald-900",
  "🌶️ Spicy Take": "bg-rose-100 text-rose-900",
  "🆕 Rising Star": "bg-sky-100 text-sky-900",
  "⚔️ Split Verdict": "bg-violet-100 text-violet-900",
};

function getCommunityTopic(itemName: string) {
  const normalized = itemName.toLowerCase();
  if (normalized === "gumbo") {
    return communityRecs.topics.find((t) => t.category.toLowerCase() === "seafood gumbo");
  }
  return communityRecs.topics.find((t) => t.category.toLowerCase() === normalized || t.name.toLowerCase().includes(normalized));
}

const isLocalFamilyBusiness = (name?: string) =>
  !!name && name.toLowerCase().includes("cade's market");

export default function WhosGotItPage() {
  const [search, setSearch] = useState("");
  const [votes, setVotes] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem("whos-got-it-votes") || "{}"); } catch { return {}; }
  });
  const [voted, setVoted] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try { return new Set(JSON.parse(localStorage.getItem("whos-got-it-voted") || "[]")); } catch { return new Set(); }
  });

  const filtered = useMemo(() => data.items.filter((item) => item.item.toLowerCase().includes(search.toLowerCase()) || item.type.toLowerCase().includes(search.toLowerCase())), [search]);

  function vote(key: string) {
    if (voted.has(key)) return;
    const next = { ...votes, [key]: (votes[key] || 0) + 1 };
    setVotes(next);
    localStorage.setItem("whos-got-it-votes", JSON.stringify(next));
    const nextVoted = new Set(voted);
    nextVoted.add(key);
    setVoted(nextVoted);
    localStorage.setItem("whos-got-it-voted", JSON.stringify([...nextVoted]));
  }

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Who's Got It Acadiana contenders",
    itemListElement: filtered.slice(0, 20).map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.item,
      description: item.description,
    })),
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={itemListSchema} />
      <section className="rounded-3xl border border-[var(--sunset-gold)]/35 bg-[linear-gradient(140deg,#fff7ea,#fff)] p-6">
        <p className="text-sm tracking-wider text-[var(--cajun-red)]">ARGUE AT THE CRAWFISH BOIL</p>
        <h1 className="text-4xl text-[var(--cajun-red)]">Who&apos;s Got It?</h1>
        <p className="mt-2 text-[var(--warm-gray)]">Hot takes, local legends, and friendly food fights from all over Acadiana — compare contenders, cast your vote, and see what locals back most.</p>
        <div className="mt-3 rounded-xl border border-[var(--cajun-red)]/20 bg-white p-3 text-sm">
          <strong>Debate of the Week:</strong> {data.debateOfTheWeek.item} — {data.debateOfTheWeek.hook}
        </div>
      </section>

      <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search item type..." className="mt-6 min-h-11 w-full rounded-xl border border-[var(--spanish-moss)]/30 bg-white px-4" />

      <div className="mt-6 space-y-6">
        {filtered.map((item) => (
          <section key={item.item} className="rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-4">
            <h2 className="text-2xl">{item.item}</h2>
            <p className="text-sm text-[var(--warm-gray)]">{item.description}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {item.contenders.map((c) => {
                const place = places.find((p) => p.slug === c.slug) || places.find((p) => p.name.toLowerCase().includes(c.placeName.toLowerCase()));
                const key = `${item.item}-${c.slug}`;
                const familyBusiness = isLocalFamilyBusiness(c.placeName);
                return (
                  <article key={key} className="rounded-xl border border-[var(--spanish-moss)]/20 bg-[var(--cream)] p-3">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${badgeTone[c.badge] || "bg-gray-100"}`}>{c.badge}</span>
                      {familyBusiness ? <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-900">Local Family Business</span> : null}
                    </div>
                    <h3 className="text-lg">{place ? <Link className="underline" href={`/place/${place.slug}`}>{c.placeName}</Link> : c.placeName}</h3>
                    <p className="text-sm text-[var(--cast-iron)]/85">The Case For: {c.caseFor}</p>
                    <p className="mt-1 text-xs text-[var(--warm-gray)]">Rating: {c.rating.toFixed(1)}</p>
                    <button onClick={() => vote(key)} disabled={voted.has(key)} className={`mt-2 min-h-10 rounded-full px-4 text-sm font-semibold text-white transition-colors ${voted.has(key) ? "bg-emerald-600 cursor-default" : "bg-[var(--cajun-red)] hover:-translate-y-0.5 active:scale-[0.98]"}`}>{voted.has(key) ? `Voted ✓ (${votes[key] || 0})` : `Vote (${votes[key] || 0})`}</button>
                  </article>
                );
              })}
            </div>

            {(() => {
              const topic = getCommunityTopic(item.item);
              if (!topic) return null;
              return (
                <div className="mt-4 rounded-xl border border-[var(--sunset-gold)]/40 bg-[linear-gradient(160deg,#fff8ef,#fff)] p-4">
                  <p className="text-xs font-semibold tracking-wide text-[var(--cajun-red)]">COMMUNITY RANKINGS (FACEBOOK)</p>
                  <p className="mt-1 text-sm text-[var(--warm-gray)]">{topic.name}</p>
                  <ol className="mt-2 space-y-1 text-sm">
                    {topic.topBusinesses.slice(0, 5).map((biz, index) => (
                      <li key={biz.slug}>
                        <span className="font-semibold">#{index + 1}</span> {biz.name} <span className="text-[var(--warm-gray)]">({biz.mentionCount} mentions)</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })()}

            {item.allSpots && item.allSpots.length > 0 ? (
              <details className="mt-4 rounded-xl border border-[var(--spanish-moss)]/20 bg-[var(--cream)]/55 p-3">
                <summary className="cursor-pointer text-sm font-semibold text-[var(--cajun-red)]">
                  See all {item.allSpots.length} spots
                </summary>
                <ul className="mt-3 space-y-2 text-sm">
                  {item.allSpots.map((spot) => {
                    const place = places.find((p) => p.slug === spot.slug) || places.find((p) => p.name.toLowerCase().includes(spot.placeName.toLowerCase()));
                    const familyBusiness = isLocalFamilyBusiness(spot.placeName) || ('specialTag' in spot && spot.specialTag === "Local Family Business");
                    return (
                      <li key={`${item.item}-${spot.slug}`} className="rounded-lg border border-[var(--spanish-moss)]/15 bg-white p-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold">
                            {place ? <Link className="underline" href={`/place/${place.slug}`}>{spot.placeName}</Link> : spot.placeName}
                          </span>
                          {familyBusiness ? <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900">Local Family Business</span> : null}
                        </div>
                        {spot.note ? <p className="mt-1 text-xs text-[var(--warm-gray)]">{spot.note}</p> : null}
                      </li>
                    );
                  })}
                </ul>
              </details>
            ) : null}

            {item.relatedLink ? <Link href={item.relatedLink} className="mt-3 inline-block text-sm underline">Track live crawfish prices →</Link> : null}
          </section>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-[var(--sunset-gold)]/35 bg-[var(--cream)] p-5">
        <h3 className="text-2xl">Seasonal Rotation</h3>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {data.seasonalRotation.map((s) => <li key={s.item}><strong>{s.item}</strong> ({s.season}) — {s.note}</li>)}
        </ul>
      </section>
    </main>
  );
}
