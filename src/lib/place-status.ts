import closedData from "@/../data/closed-businesses.json";

type ClosedEntry = {
  slug: string;
  name: string;
  status: "closed" | "temporarily-closed" | "relocated" | "unverified";
  reason: string;
  source: string;
  closedAt: string;
  matchNames?: string[];
};

const entries = (closedData as { entries: ClosedEntry[] }).entries || [];

// Exact slug hits — cheap O(1) lookup
const slugSet = new Set(entries.map((e) => e.slug.toLowerCase()));

// Name-based match set, case-insensitive, normalized
const normalize = (s: string) => s.toLowerCase().replace(/['']/g, "'").replace(/\s+/g, " ").trim();
const nameSet = new Set<string>();
for (const e of entries) {
  nameSet.add(normalize(e.name));
  for (const alt of e.matchNames || []) nameSet.add(normalize(alt));
}

export type PlaceLike = {
  slug?: string;
  name?: string;
};

export function isClosed(place: PlaceLike): boolean {
  if (!place) return false;
  if (place.slug && slugSet.has(place.slug.toLowerCase())) return true;
  if (place.name && nameSet.has(normalize(place.name))) return true;
  return false;
}

export function closedReason(place: PlaceLike): ClosedEntry | null {
  if (!place) return null;
  const slug = place.slug?.toLowerCase();
  const byName = place.name ? normalize(place.name) : null;
  for (const e of entries) {
    if (slug && e.slug.toLowerCase() === slug) return e;
    if (byName && (normalize(e.name) === byName || (e.matchNames || []).some((n) => normalize(n) === byName))) return e;
  }
  return null;
}

export function filterOperational<T extends PlaceLike>(list: T[]): T[] {
  return list.filter((item) => !isClosed(item));
}

export function closedCount(): number {
  return entries.length;
}

export function closedEntries(): ClosedEntry[] {
  return entries.slice();
}
