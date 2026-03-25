#!/usr/bin/env node
import { readSecrets, writeJson } from "./lib/source-utils.mjs";

/**
 * Facebook Events via Graph API (requires app review/permissions for broad access).
 * If unavailable, rely on existing Apify Facebook scraper pipeline.
 */

const PAGES = ["DowntownLafayette", "FestivalInternational", "Cajundome", "LafayetteTravel"];

async function fetchPageEvents(page, token) {
  const u = new URL(`https://graph.facebook.com/v20.0/${page}/events`);
  u.searchParams.set("access_token", token);
  u.searchParams.set("fields", "id,name,start_time,end_time,place,description,ticket_uri");
  u.searchParams.set("limit", "100");
  const res = await fetch(u);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function main() {
  const secrets = await readSecrets();
  const token = secrets.FACEBOOK_GRAPH_TOKEN;
  if (!token) {
    await writeJson("data/facebook-events-graph.json", { generatedAt: new Date().toISOString(), ok: false, reason: "Missing FACEBOOK_GRAPH_TOKEN", records: [] });
    console.log("Missing FACEBOOK_GRAPH_TOKEN");
    return;
  }

  const records = [];
  for (const page of PAGES) {
    try {
      const d = await fetchPageEvents(page, token);
      for (const e of d.data || []) records.push({ ...e, source: "facebook_graph", page });
    } catch (e) {
      console.warn(`warn ${page}: ${e.message.slice(0, 120)}`);
    }
  }

  await writeJson("data/facebook-events-graph.json", { generatedAt: new Date().toISOString(), ok: true, count: records.length, records });
  console.log(`Wrote ${records.length} Facebook Graph events`);
}

main().catch((e) => { console.error(e); process.exit(1); });
