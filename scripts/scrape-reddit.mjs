#!/usr/bin/env node
import { writeJson } from "./lib/source-utils.mjs";

/**
 * Reddit local discovery scraper
 * Public JSON listing endpoints with explicit User-Agent.
 * Suggested cadence: every 4-6 hours.
 */

const SUBS = ["Acadiana", "Lafayette"];

async function pull(sub, listing = "top", t = "month") {
  const u = `https://www.reddit.com/r/${sub}/${listing}.json?limit=100&t=${t}&raw_json=1`;
  const res = await fetch(u, { headers: { "User-Agent": "geauxfind-research/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function mapPost(p, sub) {
  return {
    source: "reddit",
    subreddit: sub,
    id: p.id,
    title: p.title,
    url: p.url,
    permalink: `https://reddit.com${p.permalink}`,
    author: p.author,
    score: p.score,
    comments: p.num_comments,
    created_at: new Date(p.created_utc * 1000).toISOString(),
    flair: p.link_flair_text || null,
    keywords: ["food", "restaurant", "event", "festival", "crawfish", "music", "things to do"].filter((k) => `${p.title} ${p.selftext || ""}`.toLowerCase().includes(k))
  };
}

async function main() {
  const out = [];
  for (const sub of SUBS) {
    for (const listing of ["top", "new", "hot"]) {
      try {
        const data = await pull(sub, listing, "month");
        for (const c of data.data?.children || []) out.push(mapPost(c.data, sub));
      } catch (e) {
        console.warn(`warn ${sub}/${listing}: ${e.message}`);
      }
    }
  }

  const dedup = new Map();
  for (const row of out) if (!dedup.has(row.id)) dedup.set(row.id, row);
  const records = Array.from(dedup.values()).sort((a, b) => b.score - a.score);
  await writeJson("data/reddit.json", { generatedAt: new Date().toISOString(), count: records.length, records });
  console.log(`Wrote ${records.length} Reddit posts`);
}

main().catch((e) => { console.error(e); process.exit(1); });
