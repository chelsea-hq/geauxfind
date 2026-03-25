"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type UnifiedItem = {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceBadge: string;
  sourceUrl: string;
  url: string;
  date: string;
  category: string;
  stream: "news" | "community";
  engagement?: { likes: number; comments: number };
  imageUrl?: string;
};

type FeedFilter = "All" | "News" | "Community" | "Events";

const filters: FeedFilter[] = ["All", "News", "Community", "Events"];

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Recent";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function isEventItem(item: UnifiedItem) {
  return /event|festival/i.test(item.category);
}

export default function WhatsNewPage() {
  const [active, setActive] = useState<FeedFilter>("All");
  const [items, setItems] = useState<UnifiedItem[] | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/whats-new", { cache: "no-store" });
        const data = (await res.json()) as UnifiedItem[];
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (active === "All") return items;
    if (active === "News") return items.filter((item) => item.stream === "news" && !isEventItem(item));
    if (active === "Community") return items.filter((item) => item.stream === "community" && !isEventItem(item));
    return items.filter(isEventItem);
  }, [active, items]);

  if (items === null) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="font-serif text-4xl text-[var(--cajun-red)]">What&apos;s New in Acadiana</h1>
        <p className="mt-3 text-[var(--warm-gray)]">Refreshing local feed…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-[var(--bayou-green)]">Fresh from local sources</p>
        <h1 className="font-serif text-4xl text-[var(--cajun-red)]">What&apos;s New in Acadiana</h1>
        <p className="mt-2 text-[var(--warm-gray)]">
          Openings, food news, events, and community signals from trusted local media and public Facebook sources.
        </p>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => setActive(filter)}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm ${
              active === filter
                ? "border-[var(--cajun-red)] bg-[var(--cajun-red)] text-white"
                : "border-[var(--warm-gray)]/25 bg-white text-[var(--cast-iron)]"
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((item) => (
          <a
            key={`${item.stream}-${item.source}-${item.id}`}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <article className="md:flex">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.title} className="h-44 w-full object-cover md:h-auto md:w-56" />
              ) : (
                <div className="h-24 w-full bg-[var(--cream-bg)] md:h-auto md:w-56" />
              )}
              <div className="flex-1 p-5">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[var(--bayou-green)]/10 px-3 py-1 text-xs font-semibold text-[var(--bayou-green)]">
                    {item.sourceBadge}
                  </span>
                  <span className="rounded-full bg-[var(--cream-bg)] px-3 py-1 text-xs text-[var(--cajun-red)]">{item.category}</span>
                </div>
                <h2 className="font-serif text-2xl text-[var(--cast-iron)]">{item.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-[var(--cast-iron)]/85">{item.summary}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--warm-gray)]">
                  <span>{formatDate(item.date)}</span>
                  <span>•</span>
                  <span>Source: {item.source}</span>
                  {item.engagement ? (
                    <>
                      <span>•</span>
                      <span>👍 {item.engagement.likes} · 💬 {item.engagement.comments}</span>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          </a>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--warm-gray)]">No stories in this filter right now. Try another category.</p>
      ) : null}

      <div className="mt-8 flex items-center justify-between">
        <Link href="/" className="text-sm underline">
          Back to home
        </Link>
        <p className="text-xs text-[var(--warm-gray)]">Powered by local journalism + community insights</p>
      </div>
    </main>
  );
}
