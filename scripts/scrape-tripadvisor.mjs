#!/usr/bin/env node
import { readSecrets, writeJson, fetchHtml, cleanText, normalizeUrl } from "./lib/source-utils.mjs";

/**
 * TripAdvisor content pull.
 * Preferred: official Content API (partner key required).
 * Fallback: lightweight public-page extraction for discovery only.
 * Suggested cadence: weekly.
 */

async function scrapeFallback() {
  const url = "https://www.tripadvisor.com/Search?q=Lafayette%20Louisiana%20things%20to%20do";
  const html = await fetchHtml(url);
  const out = [];
  const re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const link = normalizeUrl(m[1], "https://www.tripadvisor.com");
    const title = cleanText(m[2]);
    if (!/tripadvisor\.com/.test(link) || title.length < 8) continue;
    if (!/Attraction|Restaurant|Things to Do|Lafayette/i.test(`${title} ${link}`)) continue;
    out.push({ title, url: link, source: "tripadvisor" });
    if (out.length >= 120) break;
  }
  return out;
}

async function main() {
  const secrets = await readSecrets();
  const key = secrets.TRIPADVISOR_API_KEY;

  if (!key) {
    const records = await scrapeFallback().catch(() => []);
    await writeJson("data/tripadvisor.json", {
      generatedAt: new Date().toISOString(),
      ok: false,
      reason: "Missing TRIPADVISOR_API_KEY; wrote fallback scraped links",
      count: records.length,
      records
    });
    console.log(`No API key. Wrote fallback ${records.length} records`);
    return;
  }

  // API endpoint can vary by partnership scope; keeping placeholder for configured accounts.
  await writeJson("data/tripadvisor.json", {
    generatedAt: new Date().toISOString(),
    ok: false,
    reason: "TRIPADVISOR_API_KEY present but endpoint not configured in script yet",
    records: []
  });
  console.log("TripAdvisor key found, but endpoint mapping needed per partner account.");
}

main().catch((e) => { console.error(e); process.exit(1); });
