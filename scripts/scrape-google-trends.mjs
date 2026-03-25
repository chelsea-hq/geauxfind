#!/usr/bin/env node
import { load } from "cheerio";
import { fetchHtml, writeJson, cleanText } from "./lib/source-utils.mjs";

/**
 * Google Trends signal pull (RSS + explore pages)
 * Note: Official API access may require separate enrollment; this script uses public RSS.
 * Suggested cadence: daily.
 */

async function fetchRss() {
  const xml = await fetchHtml("https://trends.google.com/trending/rss?geo=US");
  const $ = load(xml, { xmlMode: true });
  const out = [];
  $("item").each((_, el) => {
    out.push({
      title: cleanText($(el).find("title").text()),
      link: cleanText($(el).find("link").text()),
      pubDate: cleanText($(el).find("pubDate").text())
    });
  });
  return out;
}

async function main() {
  let records = [];
  try {
    records = await fetchRss();
  } catch (e) {
    console.warn(`warn trends rss: ${e.message}`);
  }

  const acadianaHints = ["lafayette", "louisiana", "cajun", "crawfish", "zydeco", "acadiana"];
  const localish = records.filter((r) => acadianaHints.some((k) => r.title.toLowerCase().includes(k)));

  await writeJson("data/google-trends.json", {
    generatedAt: new Date().toISOString(),
    totalUSDaily: records.length,
    localishCount: localish.length,
    records,
    localish
  });

  console.log(`Wrote ${records.length} trend rows`);
}

main().catch((e) => { console.error(e); process.exit(1); });
