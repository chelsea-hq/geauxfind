#!/usr/bin/env node
/**
 * verify-guide-websites.mjs
 *
 * Some guides.json entries have fabricated FB website URLs (auto-generated
 * from business name, never verified). Result: clicking links shows FB's
 * "This content isn't available right now" page.
 *
 * This script:
 *  1. Iterates every guide entry's `website` field.
 *  2. For Facebook URLs, fetches the page and checks for FB's "content
 *     unavailable" markers in the HTML — FB returns 200 for those, so
 *     status code alone isn't enough.
 *  3. For other URLs, simple HEAD/GET status check.
 *  4. Removes (sets null) any website that fails verification, with a
 *     report at the end.
 *
 * Run: node scripts/verify-guide-websites.mjs [--dry-run]
 * Wired into weekly cron later if useful.
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const GUIDES_PATH = path.join(root, "data", "guides.json");

const FB_DEAD_MARKERS = [
  "isn't available right now",
  "content isn't available",
  "This content isn't available",
  "Page Not Found",
  "Sorry, this page",
];

const FETCH_TIMEOUT_MS = 8000;
const PAUSE_MS = 200;

const dryRun = process.argv.includes("--dry-run");

async function fetchWithTimeout(url, ms = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    return res;
  } finally {
    clearTimeout(t);
  }
}

// Confidence levels:
//   "dead-confirmed" — FB explicitly says content unavailable. Safe to remove.
//   "dead-likely"    — DNS/network failure. Likely real but could be transient.
//   "blocked"        — HTTP 403/404 from a real site. Often bot-blocking, NOT actually dead.
//   "ok"             — verified working.
async function checkUrl(url) {
  try {
    const res = await fetchWithTimeout(url);

    if (/facebook\.com/i.test(url)) {
      // FB returns 200 even for unavailable pages. Must inspect HTML.
      if (!res.ok) return { confidence: "blocked", reason: `FB HTTP ${res.status}` };
      const html = await res.text();
      for (const marker of FB_DEAD_MARKERS) {
        if (html.includes(marker)) return { confidence: "dead-confirmed", reason: "FB content unavailable" };
      }
      return { confidence: "ok" };
    }

    if (!res.ok) return { confidence: "blocked", reason: `HTTP ${res.status}` };
    return { confidence: "ok" };
  } catch (err) {
    if (err.name === "AbortError") return { confidence: "blocked", reason: "timeout" };
    // Real DNS/connection failure — much higher confidence the site is down.
    if (/ENOTFOUND|ECONNREFUSED|getaddrinfo/i.test(err.message)) {
      return { confidence: "dead-likely", reason: "DNS failure" };
    }
    return { confidence: "blocked", reason: err.message.slice(0, 50) };
  }
}

async function main() {
  const raw = await readFile(GUIDES_PATH, "utf8");
  const guides = JSON.parse(raw);
  const arr = Array.isArray(guides) ? guides : Object.values(guides);

  // Dedupe by website to avoid checking the same URL multiple times.
  const urlToEntries = new Map();
  for (const g of arr) {
    if (!g.website) continue;
    if (!urlToEntries.has(g.website)) urlToEntries.set(g.website, []);
    urlToEntries.get(g.website).push(g);
  }
  console.log(`Checking ${urlToEntries.size} unique URLs across ${arr.length} guide entries...\n`);

  const buckets = { ok: [], "dead-confirmed": [], "dead-likely": [], blocked: [] };
  let i = 0;
  for (const [url, entries] of urlToEntries) {
    i++;
    const result = await checkUrl(url);
    buckets[result.confidence].push({ url, reason: result.reason || "", entries });
    if (result.confidence !== "ok") {
      const sym = result.confidence === "dead-confirmed" ? "✗" : result.confidence === "dead-likely" ? "?" : "·";
      console.log(`  ${sym} [${i}/${urlToEntries.size}] ${result.confidence} (${result.reason}): ${url}`);
    }
    await new Promise((r) => setTimeout(r, PAUSE_MS));
  }

  console.log(`\n=== Summary ===`);
  console.log(`✓ Verified OK:           ${buckets.ok.length}`);
  console.log(`✗ Dead (confirmed FB):   ${buckets["dead-confirmed"].length}`);
  console.log(`? Dead (likely DNS):     ${buckets["dead-likely"].length}`);
  console.log(`· Blocked/uncertain:     ${buckets.blocked.length}  (probably bot-blocking — preserving)`);

  // Only remove HIGH-CONFIDENCE dead URLs. Blocked = preserve (could be
  // bot-blocking real sites like state parks, restaurants).
  const toRemove = [...buckets["dead-confirmed"], ...buckets["dead-likely"]];
  const totalAffected = toRemove.reduce((s, d) => s + d.entries.length, 0);
  console.log(`\nWould remove ${toRemove.length} URLs affecting ${totalAffected} entries.`);

  if (toRemove.length === 0) {
    console.log("Nothing to remove.");
    return;
  }
  if (dryRun) {
    console.log("\n--dry-run: not modifying guides.json");
    return;
  }

  const deadUrls = new Set(toRemove.map((d) => d.url));
  let cleaned = 0;
  const updated = arr.map((g) => {
    if (g.website && deadUrls.has(g.website)) {
      cleaned++;
      const { website: _w, ...rest } = g;
      return { ...rest, website: null, _websiteRemovedAt: new Date().toISOString() };
    }
    return g;
  });

  await writeFile(GUIDES_PATH, JSON.stringify(updated, null, 2) + "\n");
  console.log(`\n✓ Removed ${cleaned} high-confidence dead website links from data/guides.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
