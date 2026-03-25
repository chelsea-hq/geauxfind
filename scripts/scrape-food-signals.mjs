#!/usr/bin/env node
import { fetchHtml, writeJson, cleanText, normalizeUrl } from "./lib/source-utils.mjs";

/**
 * Food-specific discovery signals:
 * - Crawfish-related pages
 * - Happy hour pages
 * - Food truck pages
 * - Menu links on local discovery sites
 * Suggested cadence: daily.
 */

const PAGES = [
  "https://www.lafayettetravel.com/restaurants/",
  "https://do337.com/food-drink",
  "https://www.yelp.com/search?find_desc=happy+hour&find_loc=Lafayette%2C+LA",
  "https://www.yelp.com/search?find_desc=food+trucks&find_loc=Lafayette%2C+LA",
  "https://thecrawfishapp.com/"
];

function extractLinks(html, base) {
  const out = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = normalizeUrl(m[1], base);
    const title = cleanText(m[2]);
    if (!url || !title || title.length < 4) continue;
    if (!/menu|happy hour|food truck|crawfish|restaurant|eat|drink|special/i.test(`${title} ${url}`)) continue;
    out.push({ title, url, source: new URL(base).hostname });
    if (out.length > 200) break;
  }
  return out;
}

async function main() {
  const records = [];
  for (const page of PAGES) {
    try {
      const html = await fetchHtml(page);
      records.push(...extractLinks(html, page));
    } catch (e) {
      console.warn(`warn ${page}: ${e.message}`);
    }
  }

  const dedup = new Map();
  for (const x of records) if (!dedup.has(x.url)) dedup.set(x.url, x);
  await writeJson("data/food-signals.json", { generatedAt: new Date().toISOString(), count: dedup.size, records: Array.from(dedup.values()) });
  console.log(`Wrote ${dedup.size} food-signal links`);
}

main().catch((e) => { console.error(e); process.exit(1); });
