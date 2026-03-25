#!/usr/bin/env node
import { fetchHtml, writeJson, cleanText, normalizeUrl } from "./lib/source-utils.mjs";

/**
 * Local blog/news discovery for Acadiana
 * Suggested cadence: 2x/day.
 */

const SOURCES = [
  "https://www.theadvertiser.com/",
  "https://lafayette365.com/",
  "https://973thedawg.com/categories/lafayette-news/",
  "https://kpel965.com/",
  "https://developinglafayette.com/"
];

function parseAnchors(html, base) {
  const out = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = normalizeUrl(m[1], base);
    const title = cleanText(m[2]);
    if (!url || !title || title.length < 20) continue;
    if (!/lafayette|acadiana|restaurant|festival|music|cajun|crawfish|event/i.test(`${title} ${url}`)) continue;
    out.push({ source: new URL(base).hostname, title, url });
    if (out.length > 120) break;
  }
  return out;
}

async function main() {
  const all = [];
  for (const src of SOURCES) {
    try {
      const html = await fetchHtml(src);
      all.push(...parseAnchors(html, src));
    } catch (e) {
      console.warn(`warn ${src}: ${e.message}`);
    }
  }

  const dedup = new Map();
  for (const x of all) if (!dedup.has(x.url)) dedup.set(x.url, x);
  const records = Array.from(dedup.values());
  await writeJson("data/local-blogs.json", { generatedAt: new Date().toISOString(), count: records.length, records });
  console.log(`Wrote ${records.length} local blog rows`);
}

main().catch((e) => { console.error(e); process.exit(1); });
