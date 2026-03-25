#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

function norm(v = "") { return String(v).toLowerCase().replace(/[^a-z0-9]/g, ""); }
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
  if (!seed?.places?.length) throw new Error("Missing scripts/seed-data.json places array");

  const yelp = (await readJson(yelpPath))?.records || [];
  const fsq = (await readJson(fsqPath))?.records || [];
  const google = (await readJson(gPath))?.records || [];

  const yIndex = new Map(yelp.map((r) => [keyFor(r), r]));
  const fIndex = new Map(fsq.map((r) => [keyFor(r), r]));
  const gIndex = new Map(google.map((r) => [keyFor(r), r]));

  const conflicts = [];
  const mergedPlaces = seed.places.map((p) => {
    const key = keyFor(p);
    let out = { ...p };
    out = mergeOne(out, "yelp", yIndex.get(key), conflicts);
    out = mergeOne(out, "foursquare", fIndex.get(key), conflicts);
    out = mergeOne(out, "google", gIndex.get(key), conflicts);
    return out;
  });

  const newFromExternal = [];
  for (const src of [...yelp, ...fsq, ...google]) {
    const key = keyFor(src);
    if (!mergedPlaces.some((p) => keyFor(p) === key)) {
      newFromExternal.push({
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
        description: `${src.name} in ${src.city || "Lafayette"}.`,
        image: src.image || src.photo || "/globe.svg",
        gallery: (src.photos || []).slice(0, 6),
        tags: (src.categories || []).slice(0, 8),
        reviews: []
      });
    }
  }

  const final = {
    generatedAt: new Date().toISOString(),
    total: mergedPlaces.length + newFromExternal.length,
    places: [...mergedPlaces, ...newFromExternal],
    mergeReport: {
      matched: mergedPlaces.length,
      addedNew: newFromExternal.length,
      conflicts: conflicts.slice(0, 500)
    }
  };

  await writeFile(seedPath, `${JSON.stringify(final, null, 2)}\n`);
  await writeFile(path.resolve(__dirname, "../data/merge-report.json"), `${JSON.stringify(final.mergeReport, null, 2)}\n`);
  console.log(`Merged. Existing: ${mergedPlaces.length}, added: ${newFromExternal.length}, conflicts: ${conflicts.length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
