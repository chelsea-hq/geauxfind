#!/usr/bin/env node
// Weekly place-status verification via Google Places.
// For every place in scripts/seed-data.json that has a google_place_id,
// query the Place Details endpoint and record business_status.
// Output: data/place-verification.json
//
// Any non-OPERATIONAL status (CLOSED_TEMPORARILY, CLOSED_PERMANENTLY) gets
// appended to the "autoFlagged" list in data/closed-businesses.json during
// a separate reconciliation step (kept separate so manual curation and
// auto-flagging stay auditable).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readSecrets } from "./lib/source-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const seedPath = path.join(root, "scripts", "seed-data.json");
const outPath = path.join(root, "data", "place-verification.json");

const PLACES_API = "https://maps.googleapis.com/maps/api/place/details/json";
const FIELDS = "business_status,name,url,place_id";

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const env = await readSecrets();
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    console.error("Missing GOOGLE_PLACES_API_KEY — skipping verify-places (writing empty result)");
    await writeFile(outPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      verified: [],
      skipped: "missing_api_key",
    }, null, 2) + "\n");
    return;
  }

  const raw = await readFile(seedPath, "utf8");
  const seed = JSON.parse(raw);
  const places = Array.isArray(seed) ? seed : (seed.places || []);
  const withId = places.filter((p) => p.google_place_id);

  const verified = [];
  const errors = [];
  const CONCURRENCY = 1; // Google Places has per-IP limits; keep it simple
  const RATE_MS = 150;

  console.log(`Verifying ${withId.length} places via Google Places…`);

  for (let i = 0; i < withId.length; i++) {
    const p = withId[i];
    const url = `${PLACES_API}?place_id=${encodeURIComponent(p.google_place_id)}&fields=${FIELDS}&key=${key}`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === "OK" && data.result) {
        verified.push({
          slug: p.slug,
          name: p.name,
          google_place_id: p.google_place_id,
          business_status: data.result.business_status || "UNKNOWN",
          verifiedAt: new Date().toISOString(),
        });
      } else if (data.status === "NOT_FOUND" || data.status === "INVALID_REQUEST") {
        verified.push({
          slug: p.slug,
          name: p.name,
          google_place_id: p.google_place_id,
          business_status: "NOT_FOUND",
          verifiedAt: new Date().toISOString(),
          note: data.status,
        });
      } else {
        errors.push({ slug: p.slug, status: data.status, error_message: data.error_message });
      }
    } catch (e) {
      errors.push({ slug: p.slug, error: String(e?.message || e) });
    }
    if (i % 25 === 0 && i > 0) console.log(`  ${i}/${withId.length}…`);
    await sleep(RATE_MS);
  }

  const closed = verified.filter((v) => v.business_status === "CLOSED_PERMANENTLY");
  const temp = verified.filter((v) => v.business_status === "CLOSED_TEMPORARILY");

  await writeFile(outPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalChecked: withId.length,
    verified,
    summary: {
      operational: verified.filter((v) => v.business_status === "OPERATIONAL").length,
      closedPermanently: closed.length,
      closedTemporarily: temp.length,
      notFound: verified.filter((v) => v.business_status === "NOT_FOUND").length,
      errors: errors.length,
    },
    errors,
  }, null, 2) + "\n");

  console.log(`Wrote ${outPath}`);
  console.log(`  ${closed.length} CLOSED_PERMANENTLY, ${temp.length} CLOSED_TEMPORARILY`);
  if (closed.length > 0) {
    console.log(`  Candidates for data/closed-businesses.json:`);
    for (const c of closed.slice(0, 10)) console.log(`    - ${c.slug} (${c.name})`);
    if (closed.length > 10) console.log(`    … +${closed.length - 10} more`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
