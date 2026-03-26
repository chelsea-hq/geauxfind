import { promises as fs } from "node:fs";
import path from "node:path";

export type SignalSource = "search" | "event" | "crawfish" | "community" | "reddit" | "facebook";

export interface HotSignal {
  id: string;
  type: SignalSource;
  title: string;
  description: string;
  timestamp: string;
  source: string;
  sourceUrl?: string;
  heat: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}

const dataDir = path.join(process.cwd(), "data");

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(path.join(dataDir, file), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function ago(ms: number) {
  return new Date(Date.now() - ms).toISOString();
}

async function searchSignals(): Promise<HotSignal[]> {
  const data = await readJson<{ queries?: { query: string; timestamp: string }[] }>(
    "search-trends.json",
    {}
  );
  const entries = data.queries || [];
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = entries.filter((e) => new Date(e.timestamp).getTime() > cutoff);

  const counts = new Map<string, { count: number; latest: string }>();
  for (const e of recent) {
    const q = e.query.trim().toLowerCase();
    const existing = counts.get(q);
    const isNewer = !existing || e.timestamp > existing.latest;
    counts.set(q, { count: (existing?.count || 0) + 1, latest: isNewer ? e.timestamp : existing!.latest });
  }

  return [...counts.entries()]
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([query, v]) => ({
      id: `search-${query}`,
      type: "search" as SignalSource,
      title: `"${query}" is spiking`,
      description: `${v.count} people searched this in the last 48 hours`,
      timestamp: v.latest,
      source: "GeauxFind Search",
      heat: Math.min(5, Math.ceil(v.count / 2)) as HotSignal["heat"],
      tags: ["trending", "search"],
    }));
}

async function eventSignals(): Promise<HotSignal[]> {
  const events = await readJson<
    { slug: string; title: string; date: string; city: string; category: string; link: string | null; free: boolean }[]
  >("events.json", []);

  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  const recent = events.filter((e) => {
    const eventDate = new Date(e.date).getTime();
    return eventDate >= cutoff || eventDate >= Date.now();
  });

  return recent.slice(0, 6).map((e) => ({
    id: `event-${e.slug}`,
    type: "event" as SignalSource,
    title: e.title,
    description: `${e.city} · ${e.free ? "Free" : "Ticketed"} · ${e.category}`,
    timestamp: new Date(e.date).toISOString(),
    source: "Events",
    sourceUrl: e.link || undefined,
    heat: 2,
    tags: ["event", e.category, e.city.toLowerCase()],
  }));
}

async function crawfishSignals(): Promise<HotSignal[]> {
  const season = await readJson<{
    priceTracker: { currentRange: string; trend: string; lastUpdated?: string };
  }>("crawfish-season.json", { priceTracker: { currentRange: "", trend: "", lastUpdated: undefined } });

  const tracker = season.priceTracker;
  const isPriceDrop = /drop|down|lower|cheaper|falling/i.test(tracker.trend || "");

  if (!tracker.currentRange) return [];

  return [
    {
      id: "crawfish-price",
      type: "crawfish" as SignalSource,
      title: isPriceDrop ? "Crawfish prices just dropped!" : "Crawfish price update",
      description: `${tracker.currentRange} · ${tracker.trend}`,
      timestamp: tracker.lastUpdated || ago(2 * 60 * 60 * 1000),
      source: "Crawfish Tracker",
      sourceUrl: "/crawfish",
      heat: isPriceDrop ? 5 : 3,
      tags: ["crawfish", "price", "hot"],
    },
  ];
}

async function communitySignals(): Promise<HotSignal[]> {
  const subs = await readJson<
    { id: string; placeName: string; text: string; authorName: string; createdAt: string; moderation: string }[]
  >("community-submissions.json", []);

  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  return subs
    .filter((s) => s.moderation === "approved" && new Date(s.createdAt).getTime() > cutoff)
    .slice(0, 4)
    .map((s) => ({
      id: `community-${s.id}`,
      type: "community" as SignalSource,
      title: `New rec: ${s.placeName}`,
      description: s.text.slice(0, 120) + (s.text.length > 120 ? "…" : ""),
      timestamp: s.createdAt,
      source: "Community",
      sourceUrl: "/community",
      heat: 2,
      tags: ["community", "recommendation"],
    }));
}

async function facebookSignals(): Promise<HotSignal[]> {
  const feed = await readJson<{
    items?: { id: string; type: string; title: string; summary: string; date: string; source: string; engagement: { likes: number } }[];
  }>("facebook-feed.json", {});

  const items = feed.items || [];
  const cutoff = Date.now() - 48 * 60 * 60 * 1000;
  return items
    .filter((i) => new Date(i.date).getTime() > cutoff)
    .sort((a, b) => b.engagement.likes - a.engagement.likes)
    .slice(0, 4)
    .map((i) => ({
      id: `fb-${i.id}`,
      type: "facebook" as SignalSource,
      title: i.title,
      description: i.summary.slice(0, 120) + (i.summary.length > 120 ? "…" : ""),
      timestamp: i.date,
      source: i.source,
      heat: Math.min(5, Math.ceil(i.engagement.likes / 10) + 1) as HotSignal["heat"],
      tags: [i.type, "facebook"],
    }));
}

// Static Reddit-style signals (real Reddit integration would require API key + polling)
function redditSignals(): HotSignal[] {
  return [
    {
      id: "reddit-acadiana-1",
      type: "reddit",
      title: "r/Acadiana: Best lunch spots near ULL?",
      description: "Thread getting traction with 40+ comments recommending local favorites around the university.",
      timestamp: ago(6 * 60 * 60 * 1000),
      source: "r/Acadiana",
      sourceUrl: "https://reddit.com/r/Acadiana",
      heat: 3,
      tags: ["reddit", "lunch", "lafayette"],
    },
    {
      id: "reddit-lafayette-1",
      type: "reddit",
      title: "r/lafayette: New restaurant opening on Johnston?",
      description: "Community spotted a new spot going in. Speculation on what it is with 25 upvotes.",
      timestamp: ago(12 * 60 * 60 * 1000),
      source: "r/lafayette",
      sourceUrl: "https://reddit.com/r/lafayette",
      heat: 2,
      tags: ["reddit", "new-opening", "johnston"],
    },
  ];
}

export async function getHotSignals(): Promise<HotSignal[]> {
  const [search, events, crawfish, community, facebook] = await Promise.all([
    searchSignals(),
    eventSignals(),
    crawfishSignals(),
    communitySignals(),
    facebookSignals(),
  ]);

  const reddit = redditSignals();

  const all = [...crawfish, ...search, ...reddit, ...events, ...community, ...facebook];

  return all.sort((a, b) => {
    const heatDiff = b.heat - a.heat;
    if (heatDiff !== 0) return heatDiff;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });
}
