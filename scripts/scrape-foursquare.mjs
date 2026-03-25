#!/usr/bin/env node
import { readSecrets, slugify, writeJson } from "./lib/source-utils.mjs";

/**
 * Foursquare Places scraper (places/search)
 * Docs: https://docs.foursquare.com/developer/reference/place-search
 * Rate limit: typically QPS-throttled; check dashboard quotas.
 * Suggested cadence: daily.
 */

const LL_POINTS = [
  { city: "Lafayette", ll: "30.2241,-92.0198" },
  { city: "Broussard", ll: "30.1471,-91.9612" },
  { city: "Youngsville", ll: "30.0996,-91.9901" },
  { city: "New Iberia", ll: "30.0035,-91.8187" }
];

const QUERIES = ["restaurant", "bar", "coffee", "museum", "park", "live music", "festival", "attraction"];

async function search(apiKey, ll, query) {
  const u = new URL("https://api.foursquare.com/v3/places/search");
  u.searchParams.set("ll", ll);
  u.searchParams.set("query", query);
  u.searchParams.set("radius", "30000");
  u.searchParams.set("limit", "50");
  u.searchParams.set("fields", "fsq_id,name,location,tel,website,rating,categories,hours,price,photos,tips,geocodes");
  const res = await fetch(u, { headers: { Authorization: apiKey, Accept: "application/json" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function mapVenue(v, city) {
  const photo = (v.photos || [])[0];
  const photoUrl = photo ? `${photo.prefix}original${photo.suffix}` : null;
  return {
    source: "foursquare",
    source_id: v.fsq_id,
    name: v.name,
    slug: slugify(`${v.name}-${city}`),
    city,
    address: [v.location?.address, v.location?.locality || city, v.location?.region, v.location?.postcode].filter(Boolean).join(", "),
    phone: v.tel || "",
    website: v.website || "",
    rating: v.rating ?? null,
    categories: (v.categories || []).map((c) => c.name),
    hours: v.hours?.display || "",
    price: v.price || null,
    latitude: v.geocodes?.main?.latitude ?? null,
    longitude: v.geocodes?.main?.longitude ?? null,
    photo: photoUrl,
    tip: (v.tips || [])[0]?.text || null
  };
}

async function main() {
  const secrets = await readSecrets();
  const key = secrets.FOURSQUARE_API_KEY || secrets.FSQ_API_KEY;
  if (!key) {
    await writeJson("data/foursquare.json", { generatedAt: new Date().toISOString(), ok: false, reason: "Missing FOURSQUARE_API_KEY", records: [] });
    console.log("Missing FOURSQUARE_API_KEY; wrote empty data/foursquare.json");
    return;
  }

  const all = [];
  for (const point of LL_POINTS) {
    for (const q of QUERIES) {
      try {
        const data = await search(key, point.ll, q);
        for (const r of data.results || []) all.push(mapVenue(r, point.city));
      } catch (e) {
        console.warn(`warn ${point.city}/${q}: ${e.message.slice(0, 120)}`);
      }
    }
  }

  const dedup = new Map();
  for (const x of all) if (!dedup.has(x.source_id)) dedup.set(x.source_id, x);
  const records = Array.from(dedup.values());
  await writeJson("data/foursquare.json", { generatedAt: new Date().toISOString(), ok: true, count: records.length, records });
  console.log(`Wrote ${records.length} Foursquare venues`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
