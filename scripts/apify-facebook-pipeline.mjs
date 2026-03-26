#!/usr/bin/env node
/**
 * apify-facebook-pipeline.mjs
 *
 * STATUS: BLOCKED — as of early 2026 the Apify actors listed below
 * (apify~facebook-pages-scraper, apify~facebook-groups-scraper) consistently
 * return robots_blocked and produce 0 results. Facebook's anti-scraping
 * infrastructure actively blocks all known Apify actors for group/page feeds.
 *
 * CURRENT WORKAROUND:
 *   Chelsea manually exports Facebook group threads via Discord, drops them in
 *   data/fb-dumps/ as *.txt files, then runs:
 *
 *     npm run parse:fb-dumps
 *
 *   See scripts/parse-fb-dumps.mjs for the parser that processes those dumps.
 *
 * POSSIBLE FUTURE ALTERNATIVES (as of 2026):
 *   - apify/facebook-scraper (unofficial, community-maintained)
 *   - brightdata-facebook-scraper (paid, residential proxy rotation)
 *   - ScrapeCreators (targets FB public pages via mobile API quirks)
 *   - Facebook Content Library API (requires Academic Research qualification)
 *   - Meta Content Library + CrowdTangle replacement program
 *   Before enabling any actor, verify current reviews on Apify Store for
 *   robots_blocked / login_required failure rates.
 *
 * REQUIRES: APIFY_API_KEY in .env.local or .secrets.env
 */

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APIFY_API_BASE = "https://api.apify.com/v2";
const POLL_INTERVAL_MS = 3500;
const POLL_TIMEOUT_MS = 4 * 60 * 1000;

const PAGE_TARGETS = [
  { name: "Developing Lafayette", url: "https://www.facebook.com/DevelopingLafayette" },
  { name: "Downtown Lafayette", url: "https://www.facebook.com/DowntownLafayette" },
  { name: "Lafayette Travel", url: "https://www.facebook.com/LafayetteTravel" },
  { name: "Acadiana Advocate", url: "https://www.facebook.com/TheAcadianaAdvocate" },
];

const GROUP_TARGETS = [
  { name: "Lafayette Foodies Group", url: "https://www.facebook.com/groups/437445600497753" },
];

const RELEVANCE_KEYWORDS = [
  "restaurant", "food", "eat", "crawfish", "gumbo", "boudin", "festival", "open", "opening", "new",
  "menu", "brunch", "dinner", "lunch", "chef", "seafood", "boil", "plate lunch", "taco", "bbq",
  "po-boy", "cafe", "bar", "happy hour", "event", "downtown", "youngsville", "lafayette", "acadiana",
];

const CATEGORY_RULES = [
  { type: "crawfish_update", regex: /\bcrawfish|boil|live sack|per pound\b/i },
  { type: "new_opening", regex: /\bopening|opens|grand opening|coming soon|now open|new location\b/i },
  { type: "event", regex: /\bevent|festival|live music|popup|this weekend|market|celebration\b/i },
  { type: "restaurant_rec", regex: /\brecommend|favorite|best|where should|suggestion|anyone tried\b/i },
  { type: "food_news", regex: /\bmenu|chef|special|feature|expansion|announcement|update\b/i },
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeText(v) {
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

function parseEnvFile(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [k, ...rest] = trimmed.split("=");
    const raw = rest.join("=").trim();
    out[k.trim()] = raw.replace(/^['\"]|['\"]$/g, "");
  }
  return out;
}

async function resolveApifyToken() {
  if (process.env.APIFY_API_KEY) return process.env.APIFY_API_KEY;

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const secretsPath = path.resolve(__dirname, "../../.secrets.env");

  try {
    const secretsRaw = await readFile(secretsPath, "utf-8");
    const parsed = parseEnvFile(secretsRaw);
    return parsed.APIFY_API_KEY || "";
  } catch {
    return "";
  }
}

function redactPersonName(name) {
  const cleaned = sanitizeText(name).replace(/[^a-zA-Z\s'-]/g, "");
  const parts = cleaned.split(" ").filter(Boolean);
  if (!parts.length) return "Community Member";
  const first = parts[0];
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return [first, lastInitial].filter(Boolean).join(" ");
}

function extractArray(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function extractTopComments(rawItem) {
  const rawComments = extractArray(rawItem, ["comments", "topComments", "recentComments"]);
  return rawComments.slice(0, 3).map((comment) => {
    const commentText = sanitizeText(firstNonEmpty(comment?.text, comment?.commentText, comment?.content));
    return {
      author: redactPersonName(firstNonEmpty(comment?.authorName, comment?.author, comment?.userName)),
      text: commentText,
    };
  });
}

function isRelevant(text) {
  const lower = text.toLowerCase();
  return RELEVANCE_KEYWORDS.some((k) => lower.includes(k));
}

function categorize(text) {
  for (const rule of CATEGORY_RULES) {
    if (rule.regex.test(text)) return rule.type;
  }
  return "general";
}

function extractPlaces(text) {
  const known = ["Lafayette", "Youngsville", "Broussard", "Scott", "Carencro", "Acadiana", "Downtown"];
  return known.filter((p) => new RegExp(`\\b${p}\\b`, "i").test(text));
}

function toTags(text, category) {
  const tags = new Set([category]);
  const lower = text.toLowerCase();
  if (lower.includes("crawfish")) tags.add("crawfish");
  if (/\bopen|opening|coming soon|now open\b/.test(lower)) tags.add("new-restaurant");
  if (/\bfestival|event|weekend|live music\b/.test(lower)) tags.add("events");
  if (/\bmenu|chef|special\b/.test(lower)) tags.add("food-news");
  return Array.from(tags);
}

function buildId(source, sourceUrl, date, body) {
  return createHash("sha1").update(`${source}|${sourceUrl}|${date}|${body}`).digest("hex").slice(0, 16);
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function summarizePagePost(sourceName, text) {
  const cleaned = sanitizeText(text);
  const sentence = cleaned.slice(0, 220);
  return `${sentence || "A local Facebook page shared an update relevant to Acadiana food and events."} Source: ${sourceName}.`;
}

function summarizeGroupPost(sourceName, author, text, topComments) {
  const cleaned = sanitizeText(text);
  const gist = cleaned.slice(0, 170);
  const commentHint = topComments.length
    ? ` Community replies highlighted themes like ${topComments
        .map((c) => sanitizeText(c.text).split(" ").slice(0, 5).join(" "))
        .filter(Boolean)
        .slice(0, 2)
        .join(" and ")}.`
    : "";

  return `A community member (${author}) discussed local food-related activity in Acadiana, including ${gist || "recent dining and event updates"}. This summary is paraphrased for privacy and legal safety.${commentHint} Source: ${sourceName}.`;
}

async function apifyRequest(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apify request failed (${res.status}): ${body.slice(0, 240)}`);
  }
  return res.json();
}

async function runActor({ token, actorId, input }) {
  const start = await apifyRequest(`${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const runId = start?.data?.id;
  if (!runId) throw new Error(`Missing run id for actor ${actorId}`);

  const startedAt = Date.now();
  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const statusRes = await apifyRequest(`${APIFY_API_BASE}/actor-runs/${runId}?token=${encodeURIComponent(token)}`);
    const run = statusRes?.data;
    const status = run?.status;

    if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
      return run;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for actor ${actorId}`);
}

async function fetchDatasetItems(token, datasetId) {
  const res = await apifyRequest(
    `${APIFY_API_BASE}/datasets/${datasetId}/items?token=${encodeURIComponent(token)}&clean=true&format=json&limit=200&desc=true`
  );
  return Array.isArray(res) ? res : [];
}

async function scrapePages(token) {
  const input = {
    startUrls: PAGE_TARGETS.map((p) => ({ url: p.url })),
    maxPosts: 10,
  };

  try {
    const run = await runActor({ token, actorId: "apify~facebook-pages-scraper", input });
    if (run?.status !== "SUCCEEDED") {
      throw new Error(`Pages actor finished with ${run?.status}`);
    }

    return await fetchDatasetItems(token, run.defaultDatasetId);
  } catch (err) {
    console.warn(`⚠️ Pages scrape failed: ${err.message}`);
    return [];
  }
}

async function scrapeGroups(token) {
  const input = {
    startUrls: GROUP_TARGETS.map((g) => ({ url: g.url })),
    maxPosts: 20,
  };

  try {
    const run = await runActor({ token, actorId: "apify~facebook-groups-scraper", input });
    if (run?.status !== "SUCCEEDED") {
      throw new Error(`Groups actor finished with ${run?.status}`);
    }

    return await fetchDatasetItems(token, run.defaultDatasetId);
  } catch (err) {
    console.warn(`⚠️ Groups scrape failed: ${err.message}`);
    return [];
  }
}

function normalizePageItem(raw) {
  const source = sanitizeText(firstNonEmpty(raw?.pageName, raw?.ownerName, raw?.username, "Facebook Page"));
  const text = sanitizeText(firstNonEmpty(raw?.text, raw?.content, raw?.postText, raw?.caption));
  const url = firstNonEmpty(raw?.url, raw?.postUrl, raw?.facebookUrl, raw?.permalink);
  const date = toIsoDate(firstNonEmpty(raw?.time, raw?.createdAt, raw?.timestamp, raw?.date));

  const links = extractArray(raw, ["links", "externalLinks"]).map((l) => (typeof l === "string" ? l : l?.url)).filter(Boolean);
  const images = extractArray(raw, ["images", "imageUrls", "media"]).map((img) => (typeof img === "string" ? img : img?.url)).filter(Boolean);

  return {
    source,
    sourceUrl: url,
    date,
    text,
    likes: safeNum(firstNonEmpty(raw?.likesCount, raw?.likes, raw?.reactionsCount)),
    comments: safeNum(firstNonEmpty(raw?.commentsCount, raw?.comments, raw?.commentCount)),
    links,
    images,
  };
}

function normalizeGroupItem(raw) {
  const source = sanitizeText(firstNonEmpty(raw?.groupName, raw?.pageName, "Community Group"));
  const author = redactPersonName(firstNonEmpty(raw?.authorName, raw?.userName, raw?.ownerName));
  const text = sanitizeText(firstNonEmpty(raw?.text, raw?.content, raw?.postText, raw?.caption));
  const url = firstNonEmpty(raw?.url, raw?.postUrl, raw?.facebookUrl, raw?.permalink);
  const date = toIsoDate(firstNonEmpty(raw?.time, raw?.createdAt, raw?.timestamp, raw?.date));
  const topComments = extractTopComments(raw);

  return {
    source,
    sourceUrl: url,
    date,
    text,
    author,
    likes: safeNum(firstNonEmpty(raw?.likesCount, raw?.likes, raw?.reactionsCount)),
    comments: safeNum(firstNonEmpty(raw?.commentsCount, raw?.comments, raw?.commentCount)),
    topComments,
  };
}

function toFeedItem(base) {
  const fullText = [base.text, ...(base.topComments || []).map((c) => c.text)].join(" ");
  const category = categorize(fullText);
  const summary = base.author
    ? summarizeGroupPost(base.source, base.author, base.text, base.topComments || [])
    : summarizePagePost(base.source, base.text);

  return {
    id: buildId(base.source, base.sourceUrl, base.date, fullText),
    type: category,
    title: base.author
      ? `${base.source}: Community food discussion`
      : `${base.source}: Local update`,
    summary,
    source: base.source,
    sourceUrl: base.sourceUrl,
    date: base.date,
    engagement: {
      likes: safeNum(base.likes),
      comments: safeNum(base.comments),
    },
    relatedPlaces: extractPlaces(fullText),
    tags: toTags(fullText, category),
  };
}

async function main() {
  const token = await resolveApifyToken();
  if (!token) {
    throw new Error("Missing APIFY_API_KEY. Set process.env.APIFY_API_KEY or add it to .secrets.env.");
  }

  console.log("Starting Apify Facebook pipeline...");

  const [pageRaw, groupRaw] = await Promise.all([scrapePages(token), scrapeGroups(token)]);

  const normalizedPages = pageRaw
    .map(normalizePageItem)
    .filter((item) => item.sourceUrl && item.text && !/not_available/i.test(item.text));

  const normalizedGroups = groupRaw
    .map(normalizeGroupItem)
    .filter((item) => item.sourceUrl && item.text && !/not_available/i.test(item.text));

  const relevantPageItems = normalizedPages.filter((item) => isRelevant(item.text));
  const relevantGroupItems = normalizedGroups.filter((item) => isRelevant(`${item.text} ${(item.topComments || []).map((c) => c.text).join(" ")}`));

  const feedItems = [...relevantPageItems, ...relevantGroupItems]
    .map(toFeedItem)
    .filter((item) => item.sourceUrl)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const payload = {
    lastUpdated: new Date().toISOString(),
    sources: {
      pages: PAGE_TARGETS.map((p) => p.name),
      groups: GROUP_TARGETS.map((g) => g.name),
    },
    items: feedItems,
  };

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(__dirname, "../data/facebook-feed.json");

  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(payload, null, 2));

  console.log(`Done. Wrote ${feedItems.length} filtered items to data/facebook-feed.json`);
}

main().catch((err) => {
  console.error(`Pipeline failed: ${err.message}`);
  process.exit(1);
});
