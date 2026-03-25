#!/usr/bin/env node
import { fetchHtml, extractJsonLdEvents, writeJson, cleanText, normalizeUrl } from "./lib/source-utils.mjs";

/**
 * DO337 events scrape
 * Source: https://do337.com/events
 * Suggested cadence: 2-4x/day.
 */

function extractAnchorEvents(html, base) {
  const out = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const url = normalizeUrl(m[1], base);
    const text = cleanText(m[2]);
    if (!url || !text || text.length < 10) continue;
    if (!/do337\.com\//.test(url)) continue;
    if (!/event|festival|concert|show|party|market|night/i.test(`${url} ${text}`)) continue;
    out.push({ title: text, link: url, source: "do337" });
    if (out.length >= 300) break;
  }
  return out;
}

async function main() {
  const candidates = ["https://do337.com/events", "https://www.do337.com/events", "https://www.downtownlafayette.org/events"];
  let html = "";
  let base = "";
  for (const url of candidates) {
    try {
      html = await fetchHtml(url);
      base = url;
      break;
    } catch {}
  }
  if (!html) throw new Error("Unable to fetch do337 or fallback event source");

  const ld = extractJsonLdEvents(html, base).map((e) => ({ ...e, source: "do337" }));
  const anchors = extractAnchorEvents(html, base);

  const byUrl = new Map();
  for (const r of [...ld, ...anchors]) {
    const k = r.link || `${r.title}|${r.date || ""}`;
    if (!byUrl.has(k)) byUrl.set(k, r);
  }

  const records = Array.from(byUrl.values());
  await writeJson("data/do337-events.json", { generatedAt: new Date().toISOString(), sourceUsed: base, count: records.length, records });
  console.log(`Wrote ${records.length} DO337/fallback records`);
}

main().catch((e) => { console.error(e); process.exit(1); });
