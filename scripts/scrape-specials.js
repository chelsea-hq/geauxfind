#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const ROOT = process.cwd();
const SEED_PATH = path.join(ROOT, "scripts", "seed-data.json");
const DEALS_PATH = path.join(ROOT, "data", "deals.json");
const OUT_PATH = path.join(ROOT, "data", "verified-deals.json");
const CACHE_DIR = path.join(ROOT, "data", "cache");

const BRAVE_API_KEY = process.env.BRAVE_API_KEY || process.env.BRAVE_SEARCH_API_KEY;

async function ensureCache() {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function normalize(s = "") {
  return String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function scoreMatch(text, terms) {
  const n = normalize(text);
  let score = 0;
  for (const t of terms) {
    if (n.includes(normalize(t))) score += 1;
  }
  return score;
}

async function readJson(file, fallback) {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function cachedFetch(url, cacheName, ttlMs = 24 * 60 * 60 * 1000, init = {}) {
  await ensureCache();
  const file = path.join(CACHE_DIR, cacheName);
  try {
    const stat = await fs.stat(file);
    if (Date.now() - stat.mtimeMs < ttlMs) return await fs.readFile(file, "utf8");
  } catch {}
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const text = await res.text();
  await fs.writeFile(file, text, "utf8");
  return text;
}

async function searchWeb(query) {
  if (BRAVE_API_KEY) {
    const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&country=US&search_lang=en`;
    const text = await cachedFetch(url, `brave-${Buffer.from(query).toString("hex").slice(0, 80)}.json`, 24 * 60 * 60 * 1000, {
      headers: { Accept: "application/json", "X-Subscription-Token": BRAVE_API_KEY },
    });
    const json = JSON.parse(text);
    return (json.web?.results || []).map((r) => ({ title: r.title, url: r.url, snippet: r.description || "" }));
  }

  const ddg = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const html = await cachedFetch(ddg, `ddg-${Buffer.from(query).toString("hex").slice(0, 80)}.html`, 24 * 60 * 60 * 1000, {
    headers: { "User-Agent": "Mozilla/5.0 (GeauxFind specials verifier)" },
  });
  const $ = cheerio.load(html);
  return $(".result")
    .slice(0, 5)
    .map((_, el) => ({
      title: $(el).find(".result__title").text().trim(),
      url: $(el).find(".result__a").attr("href") || "",
      snippet: $(el).find(".result__snippet").text().trim(),
    }))
    .get();
}

function chooseRestaurants(seed) {
  const foodish = new Set(["restaurant", "food", "bar", "cafe", "coffee", "brunch", "bakery", "bbq", "seafood"]);
  return seed.filter((p) => {
    const cat = normalize(p.category || "");
    const tags = (p.tags || []).map(normalize).join(" ");
    return [...foodish].some((k) => cat.includes(k) || tags.includes(k));
  });
}

async function main() {
  const seed = await readJson(SEED_PATH, []);
  const deals = await readJson(DEALS_PATH, { communityDeals: [] });

  const restaurants = chooseRestaurants(seed);
  const communityDeals = Array.isArray(deals.communityDeals) ? deals.communityDeals : [];

  const output = [];

  for (const deal of communityDeals) {
    const restaurantName = deal.restaurant || "";
    const rest = restaurants.find((r) => normalize(r.name) === normalize(restaurantName)) ||
      restaurants.find((r) => normalize(restaurantName).includes(normalize(r.name)) || normalize(r.name).includes(normalize(restaurantName)));

    const queries = [
      `${restaurantName} Lafayette LA happy hour`,
      `${restaurantName} Lafayette LA daily specials`,
      `${restaurantName} site:yelp.com Lafayette`,
      `${restaurantName} site:google.com/maps Lafayette`,
    ];

    const evidence = [];
    for (const q of queries) {
      try {
        const results = await searchWeb(q);
        evidence.push(...results);
      } catch {}
    }

    const blob = evidence.map((e) => `${e.title}\n${e.snippet}\n${e.url}`).join("\n");
    const verifyTerms = [restaurantName, "happy hour", "special", "deal", "lafayette"];
    const score = scoreMatch(blob, verifyTerms);
    const verified = score >= 3;

    output.push({
      id: deal.id,
      restaurant: restaurantName,
      deal: deal.deal,
      category: deal.category,
      sourceDealStatus: deal.status,
      matchedSeedPlace: rest ? { slug: rest.slug, name: rest.name, address: rest.address } : null,
      verified,
      verificationScore: score,
      checkedAt: new Date().toISOString(),
      evidence: evidence.slice(0, 8),
    });
  }

  await fs.writeFile(OUT_PATH, JSON.stringify({ generatedAt: new Date().toISOString(), deals: output }, null, 2));
  console.log(`Wrote ${output.length} verified deals to data/verified-deals.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
