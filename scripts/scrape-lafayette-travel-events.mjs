#!/usr/bin/env node
import { fetchHtml, extractJsonLdEvents, writeJson, cleanText, normalizeUrl } from "./lib/source-utils.mjs";

/**
 * Lafayette Travel events scraper
 * Source: https://www.lafayettetravel.com/events/
 * Suggested cadence: daily.
 */

function extractCards(html, base) {
  const out = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = normalizeUrl(m[1], base);
    const text = cleanText(m[2]);
    if (!url || !text || text.length < 10) continue;
    if (!/lafayettetravel\.com\//.test(url)) continue;
    if (!/events|festival|music|concert|things-to-do|things to do/i.test(`${url} ${text}`)) continue;
    out.push({ title: text, link: url, source: "lafayette_travel" });
    if (out.length >= 250) break;
  }
  return out;
}

async function main() {
  const url = "https://www.lafayettetravel.com/events/";
  const html = await fetchHtml(url);
  const ld = extractJsonLdEvents(html, url).map((e) => ({ ...e, source: "lafayette_travel" }));
  const cards = extractCards(html, url);

  const map = new Map();
  for (const r of [...ld, ...cards]) {
    const k = r.link || `${r.title}|${r.date || ""}`;
    if (!map.has(k)) map.set(k, r);
  }

  const records = Array.from(map.values());
  await writeJson("data/lafayette-travel-events.json", { generatedAt: new Date().toISOString(), count: records.length, records });
  console.log(`Wrote ${records.length} Lafayette Travel records`);
}

main().catch((e) => { console.error(e); process.exit(1); });
