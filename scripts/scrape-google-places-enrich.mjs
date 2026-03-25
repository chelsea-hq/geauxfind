#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { readSecrets, writeJson } from "./lib/source-utils.mjs";

/**
 * Google Places enrichment
 * Uses nearby + place details to fill missing website/phone/hours/photos fields.
 * Suggested cadence: weekly full refresh + daily incremental.
 */

const SEARCH_CITIES = [
  { city: "Lafayette", latitude: 30.2241, longitude: -92.0198, radius: 10000 },
  { city: "Broussard", latitude: 30.1471, longitude: -91.9612, radius: 6500 },
  { city: "Youngsville", latitude: 30.0996, longitude: -91.9901, radius: 6500 }
];

const TYPES = ["restaurant", "cafe", "bar", "park", "museum", "tourist_attraction", "event_venue"];

async function searchNearby(apiKey, city, type) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.name,places.displayName,places.formattedAddress,places.rating,places.userRatingCount"
    },
    body: JSON.stringify({
      includedTypes: [type],
      maxResultCount: 20,
      locationRestriction: { circle: { center: { latitude: city.latitude, longitude: city.longitude }, radius: city.radius } }
    })
  });
  if (!res.ok) throw new Error(`search HTTP ${res.status}`);
  return (await res.json()).places || [];
}

async function details(apiKey, placeName) {
  const res = await fetch(`https://places.googleapis.com/v1/${placeName}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,userRatingCount,nationalPhoneNumber,websiteUri,regularOpeningHours.weekdayDescriptions,photos.name,priceLevel,googleMapsUri"
    }
  });
  if (!res.ok) throw new Error(`details HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const secrets = await readSecrets();
  const key = secrets.GOOGLE_PLACES_API_KEY;
  if (!key) {
    await writeJson("data/google-places-enrichment.json", { generatedAt: new Date().toISOString(), ok: false, reason: "Missing GOOGLE_PLACES_API_KEY", records: [] });
    console.log("Missing GOOGLE_PLACES_API_KEY");
    return;
  }

  const discovered = new Map();
  for (const city of SEARCH_CITIES) {
    for (const type of TYPES) {
      try {
        const found = await searchNearby(key, city, type);
        for (const p of found) if (p.id && p.name) discovered.set(p.id, { name: p.name, city: city.city });
      } catch (e) {
        console.warn(`warn ${city.city}/${type}: ${e.message}`);
      }
    }
  }

  const records = [];
  for (const [id, p] of discovered.entries()) {
    try {
      const d = await details(key, p.name);
      records.push({
        source: "google_places",
        source_id: id,
        name: d.displayName?.text || "",
        city: p.city,
        address: d.formattedAddress || "",
        rating: d.rating ?? null,
        review_count: d.userRatingCount ?? null,
        phone: d.nationalPhoneNumber || "",
        website: d.websiteUri || d.googleMapsUri || "",
        hours: d.regularOpeningHours?.weekdayDescriptions || [],
        price_level: d.priceLevel || null,
        photos: (d.photos || []).slice(0, 5).map((x) => x.name)
      });
    } catch {}
  }

  let seedCount = 0;
  try {
    const seedRaw = await readFile(new URL("./seed-data.json", import.meta.url), "utf8");
    const seed = JSON.parse(seedRaw);
    seedCount = Array.isArray(seed) ? seed.length : (seed?.places?.length || 0);
  } catch {}

  await writeJson("data/google-places-enrichment.json", { generatedAt: new Date().toISOString(), ok: true, discovered: records.length, seedReferenceCount: seedCount, records });
  console.log(`Wrote ${records.length} records`);
}

main().catch((e) => { console.error(e); process.exit(1); });
