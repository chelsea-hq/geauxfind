#!/usr/bin/env node
import { writeJson, readSecrets } from "./lib/source-utils.mjs";

/**
 * Ticketmaster Discovery API scraper
 * Docs: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
 * Typical public quota: 5000/day, low QPS throttle.
 * Suggested cadence: every 6 hours.
 */

const CITIES = ["Lafayette", "Broussard", "Youngsville", "New Iberia"];

async function search(city, key) {
  const u = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
  u.searchParams.set("apikey", key);
  u.searchParams.set("city", city);
  u.searchParams.set("stateCode", "LA");
  u.searchParams.set("size", "100");
  u.searchParams.set("sort", "date,asc");
  u.searchParams.set("classificationName", "music,sports,arts & theatre,miscellaneous");
  const res = await fetch(u);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function mapEvent(e) {
  const venue = e._embedded?.venues?.[0];
  return {
    source: "ticketmaster",
    source_id: e.id,
    title: e.name,
    date: e.dates?.start?.localDate || e.dates?.start?.dateTime?.slice(0, 10) || null,
    time: e.dates?.start?.localTime || null,
    venue: venue?.name || null,
    city: venue?.city?.name || "Lafayette",
    address: [venue?.address?.line1, venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(", "),
    category: e.classifications?.[0]?.segment?.name || null,
    image: e.images?.[0]?.url || null,
    url: e.url || null,
    price_min: e.priceRanges?.[0]?.min ?? null,
    price_max: e.priceRanges?.[0]?.max ?? null,
    currency: e.priceRanges?.[0]?.currency ?? null
  };
}

async function main() {
  const secrets = await readSecrets();
  const key = secrets.TICKETMASTER_API_KEY;
  if (!key) {
    await writeJson("data/ticketmaster-events.json", { generatedAt: new Date().toISOString(), ok: false, reason: "Missing TICKETMASTER_API_KEY", records: [] });
    console.log("Missing TICKETMASTER_API_KEY");
    return;
  }

  const records = [];
  for (const city of CITIES) {
    try {
      const payload = await search(city, key);
      for (const e of payload._embedded?.events || []) records.push(mapEvent(e));
    } catch (e) {
      console.warn(`warn ${city}: ${e.message}`);
    }
  }

  const dedup = new Map();
  for (const r of records) if (!dedup.has(r.source_id)) dedup.set(r.source_id, r);
  await writeJson("data/ticketmaster-events.json", { generatedAt: new Date().toISOString(), ok: true, count: dedup.size, records: Array.from(dedup.values()) });
  console.log(`Wrote ${dedup.size} Ticketmaster events`);
}

main().catch((e) => { console.error(e); process.exit(1); });
