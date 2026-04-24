// Shared reader for data/guides.json — the unified guide content store.

import { promises as fs } from "node:fs";
import path from "node:path";

export type GuideEntry = {
  name: string;
  slug: string;
  category: string;
  group?: string;
  description?: string;
  address?: string;
  city?: string;
  website?: string;
  priceRange?: string;
  tags?: string[];
  features?: string[];
  featured?: boolean;
  meta?: Record<string, unknown> & {
    day?: string;
    dayIndex?: number;
    hours?: string;
    genre?: string;
    offer?: string;
    age_limit?: string;
    ageLimit?: string;
    notes?: string;
    lastUpdated?: string;
  };
};

let cache: GuideEntry[] | null = null;

export async function loadGuides(): Promise<GuideEntry[]> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "guides.json"), "utf8");
    const data = JSON.parse(raw);
    cache = Array.isArray(data) ? (data as GuideEntry[]) : Object.values(data as Record<string, GuideEntry>);
    return cache;
  } catch {
    cache = [];
    return cache;
  }
}

export async function guidesByCategory(category: string): Promise<GuideEntry[]> {
  const all = await loadGuides();
  return all.filter((g) => g.category === category);
}
