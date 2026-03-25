#!/usr/bin/env node
import { readSecrets, writeJson } from "./lib/source-utils.mjs";

/**
 * PredictHQ Events API
 * Docs: https://docs.predicthq.com/
 * Requires account token. Trial/plan limits vary.
 * Suggested cadence: every 6 hours.
 */

async function fetchEvents(token) {
  const u = new URL("https://api.predicthq.com/v1/events/");
  u.searchParams.set("location_around.origin", "30.2241,-92.0198");
  u.searchParams.set("location_around.radius", "75km");
  u.searchParams.set("active.gte", new Date().toISOString().slice(0, 10));
  u.searchParams.set("limit", "100");
  u.searchParams.set("category", "concerts,festivals,performing-arts,sports,community");
  const res = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

function mapEvent(e) {
  return {
    source: "predicthq",
    source_id: e.id,
    title: e.title,
    category: e.category,
    start: e.start,
    end: e.end,
    rank: e.rank,
    location: e.location,
    labels: e.labels || [],
    entities: e.entities || [],
    timezone: e.timezone
  };
}

async function main() {
  const secrets = await readSecrets();
  const token = secrets.PREDICTHQ_API_TOKEN;
  if (!token) {
    await writeJson("data/predicthq-events.json", { generatedAt: new Date().toISOString(), ok: false, reason: "Missing PREDICTHQ_API_TOKEN", records: [] });
    console.log("Missing PREDICTHQ_API_TOKEN");
    return;
  }

  const payload = await fetchEvents(token);
  const records = (payload.results || []).map(mapEvent);
  await writeJson("data/predicthq-events.json", { generatedAt: new Date().toISOString(), ok: true, count: records.length, records });
  console.log(`Wrote ${records.length} PredictHQ events`);
}

main().catch((e) => { console.error(e); process.exit(1); });
