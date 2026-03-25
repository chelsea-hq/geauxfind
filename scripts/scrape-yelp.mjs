#!/usr/bin/env node
import { readSecrets, slugify, writeJson } from "./lib/source-utils.mjs";

/**
 * Yelp Fusion Places scraper
 * Docs: https://docs.developer.yelp.com/
 * Notes: newer Yelp plans may have lower limits for newly-created apps; verify in dashboard.
 * Suggested cadence: 1x/day
 */

const CITIES = ["Lafayette", "Broussard", "Youngsville", "Scott", "Breaux Bridge", "Carencro", "New Iberia", "Opelousas", "Abbeville"];
const CATEGORIES = ["restaurants", "bars", "coffee", "arts", "active", "nightlife", "localflavor"];

async function search(apiKey, city, category, offset = 0) {
  const u = new URL("https://api.yelp.com/v3/businesses/search");
  u.searchParams.set("location", `${city}, LA`);
  u.searchParams.set("categories", category);
  u.searchParams.set("limit", "50");
  u.searchParams.set("offset", String(offset));
  u.searchParams.set("sort_by", "best_match");

  const res = await fetch(u, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function mapBiz(b, cityHint) {
  return {
    source: "yelp",
    source_id: b.id,
    name: b.name,
    slug: slugify(`${b.name}-${cityHint || b.location?.city || "lafayette"}`),
    city: b.location?.city || cityHint || "Lafayette",
    address: [b.location?.address1, b.location?.city, b.location?.state, b.location?.zip_code].filter(Boolean).join(", "),
    phone: b.display_phone || b.phone || "",
    website: b.url || "",
    rating: b.rating ?? null,
    review_count: b.review_count ?? null,
    categories: (b.categories || []).map((c) => c.title),
    price: b.price || null,
    latitude: b.coordinates?.latitude ?? null,
    longitude: b.coordinates?.longitude ?? null,
    image: b.image_url || null,
    photos: b.image_url ? [b.image_url] : [],
    closed: b.is_closed ?? null,
    transactions: b.transactions || []
  };
}

async function main() {
  const secrets = await readSecrets();
  const key = secrets.YELP_API_KEY || secrets.YELP_FUSION_API_KEY;
  if (!key) {
    await writeJson("data/yelp.json", { generatedAt: new Date().toISOString(), ok: false, reason: "Missing YELP_API_KEY", records: [] });
    console.log("Missing YELP_API_KEY; wrote empty data/yelp.json");
    return;
  }

  const all = [];
  for (const city of CITIES) {
    for (const cat of CATEGORIES) {
      for (const offset of [0, 50, 100]) {
        try {
          const data = await search(key, city, cat, offset);
          for (const b of data.businesses || []) all.push(mapBiz(b, city));
        } catch (e) {
          console.warn(`warn ${city}/${cat}/${offset}: ${e.message.slice(0, 120)}`);
        }
      }
    }
  }

  const dedup = new Map();
  for (const item of all) {
    const k = item.source_id || `${item.name}|${item.address}`.toLowerCase();
    if (!dedup.has(k)) dedup.set(k, item);
  }

  const records = Array.from(dedup.values()).sort((a, b) => (b.rating || 0) - (a.rating || 0));
  await writeJson("data/yelp.json", { generatedAt: new Date().toISOString(), ok: true, count: records.length, records });
  console.log(`Wrote ${records.length} Yelp places`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
