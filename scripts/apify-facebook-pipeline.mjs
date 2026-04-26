#!/usr/bin/env node
/**
 * apify-facebook-pipeline.mjs
 *
 * Autonomous public-FB scraping for Acadiana food/news pages. Reads
 * curated targets from data/fb-targets.json, runs them through the
 * danek/* Apify actors (the community-maintained ones that work in 2026
 * after Meta blocked the official apify/* actors), filters results for
 * Acadiana-relevant food signals, and writes data/facebook-feed.json.
 *
 * Background — why danek/*:
 *   apify/facebook-pages-scraper and apify/facebook-groups-scraper
 *   consistently return robots_blocked since early 2026. The community
 *   migrated to danek/facebook-pages-posts-ppr (PPR = pay per result,
 *   $2.99/1K results) and danek/facebook-groups-lite. Logged-out scraping
 *   of public pages is legally clean per Meta v. Bright Data (Jan 2024).
 *
 * Cost: ~$2-5 per weekly run for 30 pages × 10 posts each.
 *
 * Optional AI relevance filter: if OPENROUTER_API_KEY is set, posts get
 * scored 0-1 for "Acadiana food relevance" and noise drops out. Without
 * the key, falls back to a regex-keyword filter.
 *
 * REQUIRES: APIFY_API_KEY in env or .env.local
 * Wired into .github/workflows/scrape-weekly.yml
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");

const APIFY_API_BASE = "https://api.apify.com/v2";
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 6 * 60 * 1000;

const PAGE_ACTOR = "danek~facebook-pages-posts-ppr";
const GROUP_ACTOR = "danek~facebook-groups-lite";

const POSTS_PER_PAGE = 10;
const POSTS_PER_GROUP = 25;

const TARGETS_PATH = path.join(root, "data", "fb-targets.json");
const FEED_PATH = path.join(root, "data", "facebook-feed.json");

const RELEVANCE_KEYWORDS = [
  "restaurant", "food", "eat", "crawfish", "gumbo", "boudin", "festival", "open", "opening", "new",
  "menu", "brunch", "dinner", "lunch", "chef", "seafood", "boil", "plate lunch", "taco", "bbq",
  "po-boy", "poboy", "cafe", "bar", "happy hour", "event", "downtown", "youngsville", "lafayette",
  "acadiana", "scott", "broussard", "carencro", "music", "live", "popup", "pop-up", "special",
  "drink", "cocktail", "beer", "winery", "brewery", "bakery", "donut", "king cake", "cajun",
];

const CATEGORY_RULES = [
  { type: "crawfish_update", regex: /\bcrawfish|live\s*sack|per\s*pound\b/i },
  { type: "new_opening", regex: /\b(opening|opens|grand\s*opening|coming\s*soon|now\s*open|new\s*location|debuts?)\b/i },
  { type: "event", regex: /\b(event|festival|live\s*music|popup|pop-up|this\s*weekend|market|celebration|tonight|saturday|sunday)\b/i },
  { type: "food_news", regex: /\b(menu|chef|special|feature|expansion|announcement|update|deal|happy\s*hour)\b/i },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitize(v) {
  return String(v || "").replace(/\s+/g, " ").trim();
}

function firstNonEmpty(...values) {
  for (const v of values) {
    if (v !== undefined && v !== null && String(v).trim()) return v;
  }
  return "";
}

function toIsoDate(v) {
  const d = new Date(v || Date.now());
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function categorize(text) {
  for (const rule of CATEGORY_RULES) {
    if (rule.regex.test(text)) return rule.type;
  }
  return "general";
}

function isRelevantByKeyword(text) {
  const lower = text.toLowerCase();
  return RELEVANCE_KEYWORDS.some((k) => lower.includes(k));
}

function buildId(source, sourceUrl, date, body) {
  return createHash("sha1").update(`${source}|${sourceUrl}|${date}|${body}`).digest("hex").slice(0, 16);
}

function extractArray(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function parseEnvFile(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [k, ...rest] = trimmed.split("=");
    out[k.trim()] = rest.join("=").trim().replace(/^['\"]|['\"]$/g, "");
  }
  return out;
}

async function readKey(name) {
  if (process.env[name]) return process.env[name];
  for (const f of [".env.local", ".env", ".secrets.env"]) {
    try {
      const raw = await readFile(path.join(root, f), "utf8");
      const parsed = parseEnvFile(raw);
      if (parsed[name]) return parsed[name];
    } catch {}
  }
  return null;
}

async function apifyRequest(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apify ${res.status}: ${body.slice(0, 240)}`);
  }
  return res.json();
}

async function runActor({ token, actorId, input }) {
  const start = await apifyRequest(
    `${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );

  const runId = start?.data?.id;
  if (!runId) throw new Error(`Missing run id for ${actorId}`);

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const statusRes = await apifyRequest(
      `${APIFY_API_BASE}/actor-runs/${runId}?token=${encodeURIComponent(token)}`,
    );
    const run = statusRes?.data;
    const status = run?.status;
    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) return run;
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ${actorId}`);
}

async function fetchDatasetItems(token, datasetId, limit = 500) {
  const res = await apifyRequest(
    `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${encodeURIComponent(token)}&clean=true&format=json&limit=${limit}&desc=true`,
  );
  return Array.isArray(res) ? res : [];
}

async function scrapePages(token, pages) {
  if (!pages.length) return [];
  const input = {
    startUrls: pages.map((p) => ({ url: p.url })),
    resultsLimit: POSTS_PER_PAGE,
    onlyPostsNewerThan: "30 days",
  };
  try {
    const run = await runActor({ token, actorId: PAGE_ACTOR, input });
    if (run?.status !== "SUCCEEDED") {
      console.warn(`pages actor ${run?.status}`);
      return [];
    }
    return await fetchDatasetItems(token, run.defaultDatasetId);
  } catch (err) {
    console.warn(`pages err: ${err.message}`);
    return [];
  }
}

async function scrapeGroups(token, groups) {
  if (!groups.length) return [];
  const input = {
    startUrls: groups.map((g) => ({ url: g.url })),
    resultsLimit: POSTS_PER_GROUP,
  };
  try {
    const run = await runActor({ token, actorId: GROUP_ACTOR, input });
    if (run?.status !== "SUCCEEDED") {
      console.warn(`groups actor ${run?.status}`);
      return [];
    }
    return await fetchDatasetItems(token, run.defaultDatasetId);
  } catch (err) {
    console.warn(`groups err: ${err.message}`);
    return [];
  }
}

function normalizeItem(raw, fallbackSource = "Facebook") {
  const source = sanitize(
    firstNonEmpty(raw?.pageName, raw?.groupName, raw?.ownerName, raw?.username, fallbackSource),
  );
  const text = sanitize(firstNonEmpty(raw?.text, raw?.content, raw?.postText, raw?.caption, raw?.message));
  const url = firstNonEmpty(raw?.url, raw?.postUrl, raw?.facebookUrl, raw?.permalink, raw?.link);
  const date = toIsoDate(firstNonEmpty(raw?.time, raw?.createdAt, raw?.timestamp, raw?.date, raw?.publishedAt));
  const images = extractArray(raw, ["images", "imageUrls", "media", "attachments"])
    .map((img) => (typeof img === "string" ? img : img?.url || img?.src))
    .filter(Boolean);
  return {
    source,
    sourceUrl: url || "",
    date,
    text,
    images,
    likes: safeNum(firstNonEmpty(raw?.likesCount, raw?.likes, raw?.reactionsCount, raw?.reactions)),
    comments: safeNum(firstNonEmpty(raw?.commentsCount, raw?.comments, raw?.commentCount)),
    shares: safeNum(firstNonEmpty(raw?.sharesCount, raw?.shares, raw?.shareCount)),
  };
}

function deriveTitleAndSummary(source, text) {
  const cleaned = sanitize(text);
  // Title = first sentence (or first 80 chars) of the post.
  const firstSentence = cleaned.split(/(?<=[.!?])\s+/)[0] || cleaned;
  const title = firstSentence.length > 100 ? `${source}: ${cleaned.slice(0, 80)}…` : firstSentence;
  // Summary = first ~220 chars, ending on a word boundary.
  const cap = cleaned.slice(0, 220);
  const summary = cap.length < cleaned.length ? `${cap.replace(/\s+\S*$/, "")}…` : cap;
  return { title, summary };
}

function toFeedItem(base) {
  const category = categorize(base.text);
  const { title, summary } = deriveTitleAndSummary(base.source, base.text);
  return {
    id: buildId(base.source, base.sourceUrl, base.date, base.text),
    type: category,
    title,
    summary,
    source: base.source,
    sourceUrl: base.sourceUrl,
    date: base.date,
    text: base.text.slice(0, 1200),
    images: (base.images || []).slice(0, 4),
    engagement: {
      likes: base.likes,
      comments: base.comments,
      shares: base.shares,
    },
  };
}

async function callOpenRouterRelevance(items, key) {
  // Batch the items, ask llama-4-scout to score each 0-1 for
  // "Acadiana food/news/event relevance". Returns score map.
  const batches = [];
  for (let i = 0; i < items.length; i += 20) batches.push(items.slice(i, i + 20));

  const scores = new Map();
  for (const batch of batches) {
    const prompt = `Score each Facebook post 0.0-1.0 for relevance to "Acadiana food, restaurants, events, or local news worth surfacing on a Lafayette discovery website". 1.0 = great signal (new restaurant, event, food news). 0.0 = noise (politics, generic life updates, ads, religion, jokes).

Return strict JSON: { "scores": [{ "id": "<id>", "score": <0-1>, "reason": "<short>" }] }

Posts:
${batch.map((b) => `[${b.id}] ${b.source}: ${b.text.slice(0, 280)}`).join("\n")}`;

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
          "HTTP-Referer": "https://geauxfind.com",
          "X-Title": "GeauxFind",
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout",
          temperature: 0.1,
          max_tokens: 1500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: "You are a strict editor curating local Acadiana food/event signals. Be ruthless about noise." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!res.ok) {
        console.warn(`AI batch ${res.status}; skipping`);
        continue;
      }
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content || "";
      const parsed = JSON.parse(content);
      for (const s of parsed?.scores || []) {
        if (s?.id) scores.set(s.id, { score: Number(s.score) || 0, reason: s.reason || "" });
      }
    } catch (e) {
      console.warn(`AI batch err: ${e.message}`);
    }
    await sleep(400);
  }
  return scores;
}

async function loadTargets() {
  try {
    const raw = await readFile(TARGETS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      pages: Array.isArray(parsed.pages) ? parsed.pages : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
    };
  } catch {
    return { pages: [], groups: [] };
  }
}

async function main() {
  const apifyToken = await readKey("APIFY_API_KEY");
  if (!apifyToken) {
    console.error("Missing APIFY_API_KEY. Skipping FB pipeline.");
    process.exit(0);
  }

  const targets = await loadTargets();
  console.log(`Targets: ${targets.pages.length} pages, ${targets.groups.length} groups`);
  if (targets.pages.length === 0 && targets.groups.length === 0) {
    console.log("No targets configured. Edit data/fb-targets.json to add some.");
    process.exit(0);
  }

  console.log("\nScraping public pages + groups via Apify (danek/*)...");
  const [pageRaw, groupRaw] = await Promise.all([
    scrapePages(apifyToken, targets.pages),
    scrapeGroups(apifyToken, targets.groups),
  ]);
  console.log(`Got ${pageRaw.length} page items, ${groupRaw.length} group items`);

  const all = [...pageRaw.map((r) => normalizeItem(r, "Page")), ...groupRaw.map((r) => normalizeItem(r, "Group"))]
    .filter((item) => item.text && item.sourceUrl);
  console.log(`Normalized: ${all.length}`);

  // Stage 1: keyword pre-filter (cheap)
  const keywordPassed = all.filter((item) => isRelevantByKeyword(item.text));
  console.log(`Keyword-passed: ${keywordPassed.length}`);

  // Stage 2: optional AI relevance scoring (better signal)
  const aiKey = await readKey("OPENROUTER_API_KEY");
  const feedItems = keywordPassed.map(toFeedItem);
  let aiFiltered = feedItems;
  if (aiKey && feedItems.length > 0) {
    console.log(`AI scoring ${feedItems.length} posts...`);
    const scores = await callOpenRouterRelevance(feedItems, aiKey);
    aiFiltered = feedItems
      .map((f) => ({ ...f, aiScore: scores.get(f.id)?.score ?? 0.5, aiReason: scores.get(f.id)?.reason }))
      .filter((f) => (f.aiScore ?? 0.5) >= 0.55);
    console.log(`AI-filtered: ${aiFiltered.length} (cutoff 0.55)`);
  } else {
    console.log("Skipping AI filter (no OPENROUTER_API_KEY).");
  }

  const sorted = aiFiltered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 200);

  const payload = {
    lastUpdated: new Date().toISOString(),
    targetsUsed: {
      pages: targets.pages.map((p) => p.name),
      groups: targets.groups.map((g) => g.name),
    },
    counts: {
      raw: all.length,
      keywordPassed: keywordPassed.length,
      aiFiltered: aiFiltered.length,
      finalPublished: sorted.length,
    },
    items: sorted,
  };

  await mkdir(path.dirname(FEED_PATH), { recursive: true });
  await writeFile(FEED_PATH, JSON.stringify(payload, null, 2) + "\n");
  console.log(`\nWrote ${sorted.length} items to data/facebook-feed.json`);
}

main().catch((err) => {
  console.error(`Pipeline failed: ${err.message}`);
  process.exit(1);
});
