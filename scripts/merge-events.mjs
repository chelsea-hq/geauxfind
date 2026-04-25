#!/usr/bin/env node
// Merges all scraped event sources into data/events.json.
//
// Why: the daily scrapers populate per-source files in data/scraped/,
// data/weekend-events.json, etc. But events.json (which the website reads)
// only gets eventbrite. This script bridges them all so the homepage,
// /tonight, and /this-weekend show the full picture.
//
// Usage: node scripts/merge-events.mjs
// Run daily via cron after scrapers finish.

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");

const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

// Curated annual festivals — pinned dates + descriptions for events that
// repeat every year. Keeps these surfaced even when scrapers say "annual".
const ANNUAL_FESTIVALS_2026 = [
  {
    slug: "festival-international-de-louisiane-2026",
    title: "Festival International de Louisiane 2026",
    date: "2026-04-22",
    endDate: "2026-04-26",
    time: "All day",
    venue: "Downtown Lafayette",
    address: "Downtown Lafayette, LA",
    city: "Lafayette",
    description: "The 40th anniversary of Festival International de Louisiane. Five days of free music, food, and culture from around the world in downtown Lafayette. The largest international music festival in the United States — 300,000+ visitors from 48 states and 26 countries.",
    category: "festival",
    image: null,
    link: "https://festivalinternational.org",
    source: "manual",
    free: true,
    price: null,
  },
  {
    slug: "festivals-acadiens-et-creoles-2026",
    title: "Festivals Acadiens et Créoles 2026",
    date: "2026-10-09",
    endDate: "2026-10-11",
    time: "All day",
    venue: "Girard Park",
    address: "Girard Park, Lafayette, LA",
    city: "Lafayette",
    description: "Three days of Cajun and Creole music, food, crafts, and culture in Girard Park — Acadiana's signature fall festival.",
    category: "festival",
    image: null,
    link: "https://festivalsacadiens.com",
    source: "manual",
    free: true,
    price: null,
  },
  {
    slug: "breaux-bridge-crawfish-festival-2026",
    title: "Breaux Bridge Crawfish Festival 2026",
    date: "2026-05-01",
    endDate: "2026-05-03",
    time: "All day",
    venue: "Parc Hardy",
    address: "Parc Hardy, Breaux Bridge, LA",
    city: "Breaux Bridge",
    description: "The Crawfish Capital of the World's annual festival — three days of crawfish boils, eating contests, Cajun music, and second-line parades.",
    category: "festival",
    image: null,
    link: "https://bbcrawfest.com",
    source: "manual",
    free: false,
    price: "$8",
  },
];

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

async function readJson(rel, fallback = null) {
  try {
    const raw = await readFile(path.join(root, rel), "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalize(e, sourceTag) {
  // Each scraper has a slightly different shape; normalize to our events.json schema.
  const title = e.title || e.name || e.headline || "";
  if (!title) return null;
  const date = e.date || e.startDate || e.start_date || "";
  // Skip "annual" / non-ISO dates from lafayettetravel scraper — those need
  // ANNUAL_FESTIVALS_2026 curation, not raw scraper output.
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) return null;
  const endDate = e.endDate || e.end_date || date;
  return {
    slug: e.slug || slugify(`${title}-${date}`),
    title,
    date: date.slice(0, 10),
    endDate: endDate.slice(0, 10),
    time: e.time || "TBA",
    venue: e.venue || e.location || "TBA",
    address: e.address || null,
    city: e.city || "Lafayette",
    description: e.description || e.summary || "",
    category: e.category || "community",
    image: e.image || null,
    link: e.link || e.url || null,
    source: sourceTag,
    free: e.free ?? (typeof e.price === "string" && /free/i.test(e.price)),
    price: e.price ?? null,
  };
}

function dedupe(events) {
  const seen = new Map();
  for (const e of events) {
    if (!e) continue;
    const key = `${e.slug}|${e.date}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, e);
      continue;
    }
    // Keep the entry with the longer description (more info = better)
    if ((e.description?.length || 0) > (existing.description?.length || 0)) {
      seen.set(key, e);
    }
  }
  return Array.from(seen.values());
}

function filterUpcoming(events) {
  return events.filter((e) => {
    const end = new Date(`${e.endDate || e.date}T23:59:59`).getTime();
    return Number.isFinite(end) && end >= TODAY.getTime();
  });
}

async function main() {
  // Existing events.json (already includes eventbrite scrape output)
  const existing = (await readJson("data/events.json", [])) || [];

  // Per-source scraped files
  const scrapedSources = [
    { file: "data/scraped/lafayette-travel-events.json", key: "events", tag: "lafayette_travel" },
    { file: "data/scraped/eventbrite-events.json", key: "events", tag: "eventbrite_scraped" },
    { file: "data/scraped/krvs-events.json", key: "events", tag: "krvs" },
    { file: "data/scraped/ul-lafayette-events.json", key: "events", tag: "ul_lafayette" },
    { file: "data/lafayette-travel-events.json", key: "records", tag: "lafayette_travel" },
    { file: "data/developing-lafayette-events.json", key: "records", tag: "developing_lafayette" },
    { file: "data/do337-events.json", key: "records", tag: "do337" },
    { file: "data/weekend-events.json", key: "events", tag: "weekend" },
  ];

  const fromScrapers = [];
  for (const src of scrapedSources) {
    const data = await readJson(src.file);
    if (!data) continue;
    const arr = Array.isArray(data) ? data : (data[src.key] || []);
    for (const item of arr) {
      const norm = normalize(item, src.tag);
      if (norm) fromScrapers.push(norm);
    }
  }

  const annual = ANNUAL_FESTIVALS_2026.filter((f) => {
    const end = new Date(`${f.endDate || f.date}T23:59:59`).getTime();
    return end >= TODAY.getTime();
  });

  // Merge: existing + annual festivals + scraper outputs, dedupe, filter to upcoming
  const merged = dedupe([...existing, ...annual, ...fromScrapers]);
  const upcoming = filterUpcoming(merged).sort((a, b) => a.date.localeCompare(b.date));

  await writeFile(
    path.join(root, "data/events.json"),
    JSON.stringify(upcoming, null, 2) + "\n",
    "utf8",
  );
  console.log(`Merged events: ${upcoming.length} upcoming`);
  console.log(`  existing: ${existing.length}`);
  console.log(`  annual festivals: ${annual.length}`);
  console.log(`  from scrapers: ${fromScrapers.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
