#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeDescription, dedupePlaces, normalizePlace, normToken } from "./lib/places.mjs";

function norm(v = "") { return normToken(v); }
function keyFor(p) { return `${norm(p.name)}|${norm(p.city || "lafayette")}`; }

async function readJson(p) {
  try { return JSON.parse(await readFile(p, "utf8")); } catch { return null; }
}

function mergeOne(place, sourceName, incoming, conflicts) {
  if (!incoming) return place;
  const out = { ...place };

  const maybeSet = (field, value) => {
    if (value === undefined || value === null || value === "" || (Array.isArray(value) && !value.length)) return;
    if (!out[field] || out[field] === "" || (Array.isArray(out[field]) && !out[field].length)) {
      out[field] = value;
      return;
    }
    if (typeof out[field] === "number" && typeof value === "number" && out[field] !== value) {
      conflicts.push({ place: out.name, field, existing: out[field], incoming: value, source: sourceName });
    }
  };

  maybeSet("phone", incoming.phone);
  maybeSet("website", incoming.website);
  maybeSet("hours", incoming.hours);
  maybeSet("price", incoming.price || incoming.price_level);

  if (incoming.rating && !out[`${sourceName}_rating`]) out[`${sourceName}_rating`] = incoming.rating;
  if (incoming.review_count && !out[`${sourceName}_review_count`]) out[`${sourceName}_review_count`] = incoming.review_count;
  if (incoming.tip && !out.foursquare_tip) out.foursquare_tip = incoming.tip;
  if (incoming.photos?.length) out.externalPhotos = Array.from(new Set([...(out.externalPhotos || []), ...incoming.photos])).slice(0, 12);

  return out;
}

async function main() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const seedPath = path.resolve(__dirname, "seed-data.json");
  const yelpPath = path.resolve(__dirname, "../data/yelp.json");
  const fsqPath = path.resolve(__dirname, "../data/foursquare.json");
  const gPath = path.resolve(__dirname, "../data/google-places-enrichment.json");

  const seed = await readJson(seedPath);
  const seedPlaces = Array.isArray(seed) ? seed : (seed?.places || []);
  if (!seedPlaces.length) throw new Error("Missing scripts/seed-data.json places array");

  const yelp = (await readJson(yelpPath))?.records || [];
  const fsq = (await readJson(fsqPath))?.records || [];
  const google = (await readJson(gPath))?.records || [];

  const yIndex = new Map(yelp.map((r) => [keyFor(r), r]));
  const fIndex = new Map(fsq.map((r) => [keyFor(r), r]));
  const gIndex = new Map(google.map((r) => [keyFor(r), r]));

  const conflicts = [];
  const mergedPlaces = seedPlaces.map((p) => {
    const key = keyFor(p);
    let out = { ...p };
    out = mergeOne(out, "yelp", yIndex.get(key), conflicts);
    out = mergeOne(out, "foursquare", fIndex.get(key), conflicts);
    out = mergeOne(out, "google", gIndex.get(key), conflicts);
    return out;
  });

  const seedKeys = new Set(mergedPlaces.map((p) => keyFor(p)));
  const newFromExternal = [];
  for (const src of [...yelp, ...fsq, ...google]) {
    const key = keyFor(src);
    if (seedKeys.has(key)) continue;
    seedKeys.add(key);
    const entry = {
      slug: (src.slug || `${norm(src.name)}-${norm(src.city || "lafayette")}`).slice(0, 90),
      name: src.name,
      city: src.city || "Lafayette",
      category: "finds",
      cuisine: (src.categories || [])[0] || "Local Spot",
      rating: src.rating || 0,
      price: src.price || "$$",
      address: src.address || "",
      phone: src.phone || "",
      website: src.website || "",
      hours: src.hours || [],
      description: "",
      image: src.image || src.photo || "/globe.svg",
      gallery: (src.photos || []).slice(0, 6),
      tags: (src.categories || []).slice(0, 8),
      reviews: []
    };
    entry.description = composeDescription(entry);
    newFromExternal.push(entry);
  }

  // Final safety net: normalize every record and collapse any duplicates so a
  // bad upstream source can never reintroduce schema drift or dupes.
  const deduped = dedupePlaces([...mergedPlaces, ...newFromExternal]);
  const finalPlaces = deduped.places.map(normalizePlace);
  const mergeReport = {
    matched: mergedPlaces.length,
    addedNew: newFromExternal.length,
    dedupedOnWrite: deduped.removed,
    junkDropped: deduped.junk,
    conflicts: conflicts.slice(0, 500)
  };

  // Tight shrink guard: seed-data is the most load-bearing file in the weekly
  // cron and gets auto-committed; a >30% record loss means something upstream
  // broke, so keep the existing data and let the log surface it.
  await writeJsonGuarded(seedPath, finalPlaces, { maxShrinkRatio: 0.3 });
  await writeFile(path.resolve(__dirname, "../data/merge-report.json"), `${JSON.stringify(mergeReport, null, 2)}\n`);
  console.log(`Merged. Existing: ${mergedPlaces.length}, added: ${newFromExternal.length}, conflicts: ${conflicts.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
