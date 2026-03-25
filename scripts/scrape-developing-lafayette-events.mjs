#!/usr/bin/env node
import { writeJson, cleanText, normalizeUrl } from "./lib/source-utils.mjs";

/**
 * DevelopingLafayette events via WP JSON API
 * Suggested cadence: daily.
 */

const API = "https://developinglafayette.com/wp-json/wp/v2";
const CATEGORY_SLUGS = ["social-events", "events", "festivals"];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function categoryMap() {
  const cats = await fetchJson(`${API}/categories?per_page=100`);
  const map = new Map();
  for (const c of cats) map.set(c.slug, c.id);
  return map;
}

async function fetchPostsByCategory(catId) {
  return fetchJson(`${API}/posts?categories=${catId}&per_page=100&_embed=1`);
}

function strip(html = "") { return cleanText(String(html).replace(/<[^>]+>/g, " ")); }

function mapPost(p) {
  return {
    source: "developinglafayette",
    source_id: p.id,
    title: cleanText(p.title?.rendered || ""),
    date: (p.date || "").slice(0, 10),
    link: normalizeUrl(p.link || ""),
    excerpt: strip(p.excerpt?.rendered || ""),
    categories: (p._embedded?.["wp:term"]?.[0] || []).map((t) => t.name),
    image: p._embedded?.["wp:featuredmedia"]?.[0]?.source_url || null
  };
}

async function main() {
  const cats = await categoryMap();
  const ids = CATEGORY_SLUGS.map((s) => cats.get(s)).filter(Boolean);

  const all = [];
  for (const id of ids) {
    try {
      const posts = await fetchPostsByCategory(id);
      all.push(...posts.map(mapPost));
    } catch (e) {
      console.warn(`warn category ${id}: ${e.message}`);
    }
  }

  const dedup = new Map();
  for (const x of all) if (!dedup.has(x.source_id)) dedup.set(x.source_id, x);
  const records = Array.from(dedup.values()).sort((a, b) => b.date.localeCompare(a.date));

  await writeJson("data/developing-lafayette-events.json", { generatedAt: new Date().toISOString(), count: records.length, records });
  console.log(`Wrote ${records.length} DevelopingLafayette event records`);
}

main().catch((e) => { console.error(e); process.exit(1); });
