#!/usr/bin/env node
// Weekly maintenance script:
//   1. Verify EVERY business (places + guides) against Google Places
//      business_status. Anything CLOSED_PERMANENTLY gets auto-added to
//      data/closed-businesses.json so it disappears from the site.
//   2. Refresh photo references for places (because Google rotates them
//      and stale refs return NOT_FOUND).
//
// Manual entries in closed-businesses.json (matchNames + slug) are
// preserved. Auto-flagged entries get source: "google-verify" so manual
// curation is distinguishable.
//
// Run weekly via .github/workflows/scrape-weekly.yml

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");

const SEED_PATH = path.join(root, "scripts", "seed-data.json");
const GUIDES_PATH = path.join(root, "data", "guides.json");
const CLOSED_PATH = path.join(root, "data", "closed-businesses.json");

const RATE_MS = 100;
const BATCH = 50;
const BATCH_PAUSE_MS = 3000;

async function readJson(p, fallback = null) {
  try { return JSON.parse(await readFile(p, "utf8")); } catch { return fallback; }
}

async function readKey() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY;
  for (const p of [".env.local", ".env"].map((f) => path.join(root, f))) {
    try {
      const raw = await readFile(p, "utf8");
      const m = raw.match(/GOOGLE_PLACES_API_KEY=\"?([^\n\"]+)/);
      if (m) return m[1].trim();
    } catch {}
  }
  return null;
}

async function placeDetails(placeId, key, fields) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=${fields}&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    return { ok: false, status: res.status, body: (await res.text()).slice(0, 200) };
  }
  return { ok: true, data: await res.json() };
}

async function searchPlace(query, key) {
  // Used for guides.json entries that don't have a google_place_id —
  // search by name + city, get the top hit, then check its status.
  const url = "https://places.googleapis.com/v1/places:searchText";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "places.id,places.displayName,places.businessStatus,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 1,
      regionCode: "US",
      locationBias: {
        circle: { center: { latitude: 30.2241, longitude: -92.0198 }, radius: 30000 },
      },
    }),
  });
  if (!res.ok) return { ok: false, status: res.status };
  const data = await res.json();
  return { ok: true, place: (data.places || [])[0] };
}

function loadClosed(closed) {
  const entries = Array.isArray(closed?.entries) ? [...closed.entries] : [];
  const seen = new Set(entries.map((e) => e.slug?.toLowerCase()).filter(Boolean));
  return { entries, seen };
}

function addClosed(entries, seen, entry) {
  const k = entry.slug?.toLowerCase();
  if (!k || seen.has(k)) return false;
  entries.push(entry);
  seen.add(k);
  return true;
}

async function verifyPlaces(key, closed) {
  const seed = await readJson(SEED_PATH, []);
  const places = Array.isArray(seed) ? seed : seed.places || [];
  const withId = places.filter((p) => p.google_place_id);

  console.log(`\n[places] verifying ${withId.length} of ${places.length}...`);
  let closedCount = 0;
  let photoUpdates = 0;
  let i = 0;
  for (const p of withId) {
    i++;
    const result = await placeDetails(p.google_place_id, key, "businessStatus,photos");
    if (!result.ok) {
      if (i % 50 === 0) console.log(`  [${i}] err ${result.status} on ${p.slug}`);
      await new Promise((r) => setTimeout(r, RATE_MS));
      continue;
    }

    // Auto-flag closed
    const status = result.data.businessStatus;
    if (status === "CLOSED_PERMANENTLY") {
      const added = addClosed(closed.entries, closed.seen, {
        slug: p.slug,
        name: p.name,
        status: "closed",
        reason: `Google Places business_status = CLOSED_PERMANENTLY (auto-detected ${new Date().toISOString().slice(0,10)})`,
        source: "google-verify",
        closedAt: new Date().toISOString().slice(0,10),
        matchNames: [p.name],
      });
      if (added) closedCount++;
    }

    // Refresh photo refs
    const photoNames = (result.data.photos || []).map((ph) => ph.name).filter(Boolean);
    if (photoNames.length) {
      p.gallery = photoNames.slice(0, 8).map((name) => `/api/photo?ref=${encodeURIComponent(name)}`);
      p.photo_references = photoNames;
      photoUpdates++;
    }

    if (i % BATCH === 0) {
      console.log(`  [${i}/${withId.length}] +${closedCount} closed, +${photoUpdates} photo updates`);
      await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS));
    } else {
      await new Promise((r) => setTimeout(r, RATE_MS));
    }
  }

  await writeFile(SEED_PATH, JSON.stringify(places, null, 2) + "\n");
  console.log(`[places] done. ${closedCount} new closures flagged, ${photoUpdates} photo refs refreshed.`);
  return { closedCount, photoUpdates };
}

async function verifyGuides(key, closed) {
  const guides = await readJson(GUIDES_PATH, []);
  const arr = Array.isArray(guides) ? guides : Object.values(guides);

  // Dedupe by slug — each guide entry shows up once per category but it's
  // the same physical place. We only need to verify each name once.
  const seenSlug = new Set();
  const unique = [];
  for (const g of arr) {
    if (!g.slug || seenSlug.has(g.slug)) continue;
    seenSlug.add(g.slug);
    unique.push(g);
  }

  console.log(`\n[guides] verifying ${unique.length} unique entries (across ${arr.length} category rows)...`);
  let closedCount = 0;
  let i = 0;
  for (const g of unique) {
    i++;
    const query = `${g.name} ${g.city || "Lafayette"} LA`;
    const r = await searchPlace(query, key);
    if (!r.ok || !r.place) {
      await new Promise((res) => setTimeout(res, RATE_MS));
      continue;
    }
    const status = r.place.businessStatus;
    if (status === "CLOSED_PERMANENTLY") {
      const added = addClosed(closed.entries, closed.seen, {
        slug: g.slug,
        name: g.name,
        status: "closed",
        reason: `Google Places business_status = CLOSED_PERMANENTLY (auto-detected from guides.json on ${new Date().toISOString().slice(0,10)})`,
        source: "google-verify",
        closedAt: new Date().toISOString().slice(0,10),
        matchNames: [g.name],
      });
      if (added) closedCount++;
    }

    if (i % BATCH === 0) {
      console.log(`  [${i}/${unique.length}] +${closedCount} closed`);
      await new Promise((res) => setTimeout(res, BATCH_PAUSE_MS));
    } else {
      await new Promise((res) => setTimeout(res, RATE_MS));
    }
  }
  console.log(`[guides] done. ${closedCount} closures flagged.`);
  return { closedCount };
}

async function main() {
  const key = await readKey();
  if (!key) {
    console.error("Missing GOOGLE_PLACES_API_KEY");
    process.exit(1);
  }
  console.log(`Using key: ${key.slice(0, 8)}...${key.slice(-4)}`);

  const closedFile = await readJson(CLOSED_PATH, { entries: [] });
  const closed = loadClosed(closedFile);
  const before = closed.entries.length;

  const places = await verifyPlaces(key, closed);
  const guides = await verifyGuides(key, closed);

  if (closed.entries.length > before) {
    closedFile.entries = closed.entries;
    closedFile.generatedAt = new Date().toISOString();
    await writeFile(CLOSED_PATH, JSON.stringify(closedFile, null, 2) + "\n");
    console.log(`\nAdded ${closed.entries.length - before} new closures to ${CLOSED_PATH}`);
  } else {
    console.log("\nNo new closures detected.");
  }

  console.log(`\nSummary:`);
  console.log(`  Places: ${places.closedCount} closed, ${places.photoUpdates} photo refs refreshed`);
  console.log(`  Guides: ${guides.closedCount} closed`);
  console.log(`  Total closed-businesses entries: ${closed.entries.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
