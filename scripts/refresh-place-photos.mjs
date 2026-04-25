#!/usr/bin/env node
// Refreshes photo references for every place in scripts/seed-data.json by
// calling Places API (New) Place Details. Photo names are stable per-place
// but stale references from older API calls sometimes don't resolve via the
// new /v1/{name}/media endpoint. This re-fetches fresh refs.
//
// Also prints diagnostic info so we can tell if the issue is the API key,
// the photo refs, or something else entirely.
//
// Usage:
//   GOOGLE_PLACES_API_KEY=AIza... node scripts/refresh-place-photos.mjs
//   (or have the key in .env.local)
//
// Flags:
//   --limit=N    Only process the first N places (for testing)
//   --slugs=a,b  Only process specific slugs

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const seedPath = path.join(root, "scripts", "seed-data.json");

async function readSecrets() {
  const candidates = [
    path.join(root, ".env.local"),
    path.join(root, ".env"),
    path.join(process.env.HOME || "", ".secrets.env"),
  ];
  for (const f of candidates) {
    try {
      const raw = await readFile(f, "utf8");
      const m = raw.match(/GOOGLE_PLACES_API_KEY=\"?([^\n\"]+)/);
      if (m) return m[1].trim();
    } catch {}
  }
  return process.env.GOOGLE_PLACES_API_KEY;
}

function arg(name, fallback) {
  const a = process.argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : fallback;
}

async function fetchPhotos(placeId, key) {
  const url = `https://places.googleapis.com/v1/places/${placeId}?fields=photos&key=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, error: text.slice(0, 300) };
  }
  const data = await res.json();
  const names = (data.photos || []).map((p) => p.name).filter(Boolean);
  return { ok: true, names };
}

async function main() {
  const key = await readSecrets();
  if (!key) {
    console.error("Missing GOOGLE_PLACES_API_KEY (set in .env.local or env)");
    process.exit(1);
  }
  console.log(`Using key: ${key.slice(0, 8)}...${key.slice(-4)} (${key.length} chars)`);

  const limit = Number(arg("limit", "0")) || Infinity;
  const onlySlugs = arg("slugs", "").split(",").filter(Boolean);

  const seedRaw = await readFile(seedPath, "utf8");
  const seed = JSON.parse(seedRaw);
  const places = Array.isArray(seed) ? seed : seed.places || [];

  let processed = 0;
  let updated = 0;
  let errors = 0;
  const errorSamples = [];

  for (const place of places) {
    if (processed >= limit) break;
    if (!place.google_place_id) continue;
    if (onlySlugs.length && !onlySlugs.includes(place.slug)) continue;

    processed++;
    const result = await fetchPhotos(place.google_place_id, key);
    if (!result.ok) {
      errors++;
      if (errorSamples.length < 3) {
        errorSamples.push({ slug: place.slug, status: result.status, error: result.error });
      }
      console.log(`  [${processed}] ${place.slug} → ERROR ${result.status}`);
      continue;
    }

    if (!result.names.length) {
      console.log(`  [${processed}] ${place.slug} → no photos`);
      continue;
    }

    // Build /api/photo proxy URLs from fresh photo names
    const newGallery = result.names.slice(0, 8).map(
      (name) => `/api/photo?ref=${encodeURIComponent(name)}`,
    );

    place.gallery = newGallery;
    place.photo_references = result.names;
    updated++;

    if (processed % 25 === 0) console.log(`  [${processed}] ${place.slug} ✓ ${result.names.length} photos`);

    // 100ms between requests = max 10 req/sec
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log("");
  console.log(`Processed: ${processed}, Updated: ${updated}, Errors: ${errors}`);
  if (errorSamples.length) {
    console.log("Error samples:");
    for (const e of errorSamples) console.log(`  - ${e.slug}: ${e.status} ${e.error}`);
  }

  if (updated > 0) {
    await writeFile(seedPath, JSON.stringify(places, null, 2) + "\n");
    console.log(`\nWrote ${seedPath}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
