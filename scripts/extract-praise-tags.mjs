#!/usr/bin/env node
/**
 * extract-praise-tags.mjs
 *
 * Autonomous "best of" pipeline. Reads Google reviews already on disk
 * (scripts/seed-data.json), uses AI to extract what each place is being
 * praised for, then aggregates into data/community-recs.json topics.
 *
 * Why this exists:
 *   - 581+ places have 3-10 Google reviews each → thousands of authentic
 *     "best [dish] in Lafayette" mentions just sitting in JSON.
 *   - Manual FB-thread capture (extension/, /admin/paste-thread) reaches
 *     private groups but requires user effort. This runs zero-touch.
 *
 * Output:
 *   - data/place-praise-tags.json — per-place AI-extracted topic tags
 *   - data/community-recs.json — aggregated rankings (merged with existing)
 *
 * Cost: ~581 OpenRouter calls × ~500 tokens ≈ $0.05/run on llama-4-scout
 * Wired into .github/workflows/scrape-weekly.yml
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");

const SEED_PATH = path.join(root, "scripts", "seed-data.json");
const TAGS_PATH = path.join(root, "data", "place-praise-tags.json");
const RECS_PATH = path.join(root, "data", "community-recs.json");
// Dry-run writes to .dry-run.json siblings to avoid polluting real data.
const DRY_TAGS_PATH = path.join(root, "data", "place-praise-tags.dry-run.json");
const DRY_RECS_PATH = path.join(root, "data", "community-recs.dry-run.json");

const MIN_REVIEWS_PER_PLACE = 3;
const MAX_REVIEWS_PER_PLACE = 10;
const MAX_PLACES_PER_RUN = parseInt(process.env.MAX_PLACES || "1000", 10);
const BATCH_PAUSE_MS = 250;
const MIN_TOPIC_CONFIDENCE = 0.5;

const TOPIC_NORMALIZATION = {
  "po boy": "po-boy",
  "po-boys": "po-boy",
  "poboys": "po-boy",
  "poboy": "po-boy",
  "bbq": "barbecue",
  "bar-b-q": "barbecue",
  "bar-b-que": "barbecue",
  "etoufee": "étouffée",
  "etouffee": "étouffée",
  "boudain": "boudin",
  "fried chicken sandwich": "chicken sandwich",
  "shrimp & grits": "shrimp and grits",
};

const STOP_TOPICS = new Set([
  "food",
  "service",
  "atmosphere",
  "ambiance",
  "vibe",
  "music",
  "drinks",
  "menu",
  "experience",
  "restaurant",
  "place",
  "spot",
  "dining",
  "lunch",
  "dinner",
  "breakfast",
  "brunch",
  "everything",
]);

async function readJson(p, fallback = null) {
  try {
    return JSON.parse(await readFile(p, "utf8"));
  } catch {
    return fallback;
  }
}

async function readAiKey() {
  if (process.env.OPENROUTER_API_KEY) return { key: process.env.OPENROUTER_API_KEY, kind: "openrouter" };
  if (process.env.VENICE_API_KEY) return { key: process.env.VENICE_API_KEY, kind: "venice" };
  for (const f of [".env.local", ".env"]) {
    try {
      const raw = await readFile(path.join(root, f), "utf8");
      const orMatch = raw.match(/OPENROUTER_API_KEY=\"?([^\n\"]+)/);
      if (orMatch) return { key: orMatch[1].trim(), kind: "openrouter" };
      const vMatch = raw.match(/VENICE_API_KEY=\"?([^\n\"]+)/);
      if (vMatch) return { key: vMatch[1].trim(), kind: "venice" };
    } catch {}
  }
  return null;
}

async function callAi(messages, { key, kind }) {
  const apiUrl =
    kind === "openrouter"
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.venice.ai/api/v1/chat/completions";
  const model = kind === "openrouter" ? "meta-llama/llama-4-scout" : "qwen3-4b";

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
      ...(kind === "openrouter"
        ? { "HTTP-Referer": "https://geauxfind.com", "X-Title": "GeauxFind" }
        : {}),
    },
    body: JSON.stringify({
      model,
      stream: false,
      temperature: 0.2,
      max_tokens: 500,
      response_format: { type: "json_object" },
      messages,
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`AI ${res.status}: ${txt.slice(0, 200)}`);
  }
  const json = await res.json();
  return json?.choices?.[0]?.message?.content || "";
}

function normalizeTopic(t) {
  const lower = String(t || "")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return TOPIC_NORMALIZATION[lower] || lower;
}

function extractTopicsFromAi(raw) {
  if (!raw) return [];
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  const items = Array.isArray(parsed?.topics) ? parsed.topics : [];
  return items
    .map((t) => ({
      topic: normalizeTopic(t?.topic),
      confidence: Number(t?.confidence ?? t?.score ?? 0.6),
      mention_count: Number(t?.mention_count ?? 1),
    }))
    .filter((t) => t.topic && t.topic.length >= 3 && !STOP_TOPICS.has(t.topic) && t.confidence >= MIN_TOPIC_CONFIDENCE);
}

const SYSTEM_PROMPT = `You analyze Google reviews of restaurants in Acadiana, Louisiana. Identify the 1-3 specific dishes, drinks, or food categories the place is most consistently praised for. Skip generic praise like "good food" or "great service".

Return JSON: { "topics": [{ "topic": "<short food noun, e.g. 'gumbo', 'chicken salad', 'crawfish boudin'>", "confidence": <0.0-1.0>, "mention_count": <int> }] }

Rules:
- Lowercase, singular, no articles. e.g. "gumbo" not "the best gumbo"
- Skip ambiguous topics like "food", "service", "menu", "atmosphere"
- Only include topics with 2+ supporting reviews
- Return empty array if reviews are too generic to extract specific dishes`;

async function extractForPlace(place, ai) {
  const reviews = (place.reviews || []).slice(0, MAX_REVIEWS_PER_PLACE);
  if (reviews.length < MIN_REVIEWS_PER_PLACE) return [];

  const reviewText = reviews
    .map((r, i) => `[Review ${i + 1}] ${(r.comment || "").slice(0, 280)}`)
    .filter((line) => line.length > 14)
    .join("\n");

  if (reviewText.length < 80) return [];

  const userPrompt = `Place: ${place.name} (${place.cuisine || place.category || "restaurant"}, ${place.city})

${reviewText}

What 1-3 specific dishes/drinks/categories is this place praised for? JSON only.`;

  const raw = await callAi(
    [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    ai,
  );
  return extractTopicsFromAi(raw);
}

function topicSlug(topic) {
  return `best-${topic.replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}-in-acadiana`;
}

function topicTitle(topic) {
  const cap = topic.replace(/\b\w/g, (c) => c.toUpperCase());
  return `Best ${cap} in Acadiana`;
}

function buildCommunityRecs(tagsByPlace, places, existingRecs) {
  const placeBySlug = new Map(places.map((p) => [p.slug, p]));
  const topicAggregator = new Map(); // topic -> { businesses: Map<slug, count> }

  for (const [placeSlug, topics] of Object.entries(tagsByPlace)) {
    const place = placeBySlug.get(placeSlug);
    if (!place) continue;
    for (const t of topics) {
      if (!topicAggregator.has(t.topic)) {
        topicAggregator.set(t.topic, { businesses: new Map() });
      }
      const agg = topicAggregator.get(t.topic);
      const current = agg.businesses.get(place.slug) || 0;
      agg.businesses.set(place.slug, current + Math.max(1, t.mention_count));
    }
  }

  const aiTopics = [];
  const aiBusinesses = new Map();

  for (const [topic, agg] of topicAggregator) {
    if (agg.businesses.size < 2) continue;

    const ranked = [...agg.businesses.entries()]
      .map(([slug, count]) => ({
        slug,
        name: placeBySlug.get(slug)?.name || slug,
        mentionCount: count,
      }))
      .sort((a, b) => b.mentionCount - a.mentionCount)
      .slice(0, 20);

    const total = ranked.reduce((s, b) => s + b.mentionCount, 0);

    aiTopics.push({
      slug: topicSlug(topic),
      name: topicTitle(topic),
      category: topic.replace(/\b\w/g, (c) => c.toUpperCase()),
      businessCount: ranked.length,
      totalMentions: total,
      topBusinesses: ranked,
      source: "ai-praise-tags",
    });

    for (const b of ranked) {
      const existing = aiBusinesses.get(b.slug);
      if (existing) {
        existing.mentionCount += b.mentionCount;
        if (!existing.threads.includes(topicTitle(topic))) {
          existing.threads.push(topicTitle(topic));
        }
      } else {
        const place = placeBySlug.get(b.slug);
        aiBusinesses.set(b.slug, {
          slug: b.slug,
          name: b.name,
          category: place?.cuisine || place?.category || "Restaurant",
          categories: [topic],
          location: place?.city || "Lafayette, LA",
          address: place?.address || null,
          mentionCount: b.mentionCount,
          highlights: [],
          source: "ai-praise-tags",
          sourceThread: topicTitle(topic),
          threads: [topicTitle(topic)],
          rank: null,
          tags: [],
          specialNotes: null,
        });
      }
    }
  }

  // Merge with existing manual/FB-sourced topics — prefer manual data
  // when slugs collide, but stack their mention counts.
  const mergedTopics = [];
  const seenSlug = new Set();
  for (const t of existingRecs.topics || []) {
    mergedTopics.push(t);
    seenSlug.add(t.slug);
  }
  for (const t of aiTopics) {
    if (seenSlug.has(t.slug)) {
      // Merge into existing
      const idx = mergedTopics.findIndex((m) => m.slug === t.slug);
      const existing = mergedTopics[idx];
      const mergedMap = new Map(existing.topBusinesses.map((b) => [b.slug, b.mentionCount]));
      for (const b of t.topBusinesses) {
        mergedMap.set(b.slug, (mergedMap.get(b.slug) || 0) + b.mentionCount);
      }
      const remerged = [...mergedMap.entries()]
        .map(([slug, count]) => ({
          slug,
          name: placeBySlug.get(slug)?.name || existing.topBusinesses.find((b) => b.slug === slug)?.name || slug,
          mentionCount: count,
        }))
        .sort((a, b) => b.mentionCount - a.mentionCount)
        .slice(0, 20);
      mergedTopics[idx] = {
        ...existing,
        businessCount: remerged.length,
        totalMentions: remerged.reduce((s, b) => s + b.mentionCount, 0),
        topBusinesses: remerged,
      };
    } else {
      mergedTopics.push(t);
    }
  }

  const mergedBusinesses = [...(existingRecs.businesses || [])];
  const bizSlugSet = new Set(mergedBusinesses.map((b) => b.slug));
  for (const b of aiBusinesses.values()) {
    if (!bizSlugSet.has(b.slug)) {
      mergedBusinesses.push(b);
      bizSlugSet.add(b.slug);
    }
  }

  return {
    ...existingRecs,
    generatedAt: new Date().toISOString(),
    topics: mergedTopics,
    businesses: mergedBusinesses,
  };
}

function fakeExtractForPlace(place) {
  // Heuristic extraction for --dry-run mode. Pulls 1-2 likely topics from
  // the place's category/cuisine/tags. Useful for validating aggregation
  // without burning AI tokens.
  const topics = new Set();
  const cuisine = String(place.cuisine || "").toLowerCase();
  const cat = String(place.category || "").toLowerCase();
  const tags = (place.tags || []).map((t) => String(t).toLowerCase());

  const hints = [
    ["sushi", "sushi"],
    ["mexican", "tacos"],
    ["italian", "pasta"],
    ["seafood", "seafood gumbo"],
    ["cajun", "boudin"],
    ["bbq", "barbecue"],
    ["pizza", "pizza"],
    ["burger", "burger"],
    ["coffee", "coffee"],
    ["bakery", "pastries"],
    ["bar", "happy hour"],
  ];
  for (const [needle, topic] of hints) {
    if (cuisine.includes(needle) || cat.includes(needle) || tags.some((t) => t.includes(needle))) {
      topics.add(topic);
    }
  }
  return [...topics].slice(0, 2).map((topic) => ({ topic, confidence: 0.7, mention_count: 2 }));
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  let ai = null;
  if (!dryRun) {
    ai = await readAiKey();
    if (!ai) {
      console.error("Missing OPENROUTER_API_KEY or VENICE_API_KEY. Skipping.");
      process.exit(0);
    }
    console.log(`AI provider: ${ai.kind}`);
  } else {
    console.log("DRY RUN — using heuristic extraction (no AI calls).");
  }

  const seed = await readJson(SEED_PATH, []);
  const places = Array.isArray(seed) ? seed : seed.places || [];
  const existingRecs = (await readJson(RECS_PATH, { topics: [], businesses: [] })) || { topics: [], businesses: [] };
  const previousTags = (await readJson(TAGS_PATH, {})) || {};

  const candidates = places.filter((p) => Array.isArray(p.reviews) && p.reviews.length >= MIN_REVIEWS_PER_PLACE);
  console.log(`Candidate places with ≥${MIN_REVIEWS_PER_PLACE} reviews: ${candidates.length}`);

  // Skip places we've already processed unless their review count grew.
  // Local cache short-circuits 95%+ of weekly runs to a few new places.
  const toProcess = candidates.filter((p) => {
    const cached = previousTags[p.slug];
    if (!cached) return true;
    return (cached.reviewCount || 0) < (p.reviews?.length || 0);
  }).slice(0, MAX_PLACES_PER_RUN);

  console.log(`Processing ${toProcess.length} new/changed places this run...`);

  const tagsByPlace = { ...previousTags };
  let i = 0;
  let errCount = 0;
  for (const place of toProcess) {
    i++;
    try {
      const topics = dryRun ? fakeExtractForPlace(place) : await extractForPlace(place, ai);
      tagsByPlace[place.slug] = {
        reviewCount: place.reviews.length,
        extractedAt: new Date().toISOString(),
        topics,
      };
      if (i % 25 === 0) {
        console.log(`  [${i}/${toProcess.length}] ${place.name}: ${topics.map((t) => t.topic).join(", ") || "(none)"}`);
        await writeFile(dryRun ? DRY_TAGS_PATH : TAGS_PATH, JSON.stringify(tagsByPlace, null, 2) + "\n");
      }
    } catch (e) {
      errCount++;
      if (errCount > 20) {
        console.error("Too many AI errors — aborting.");
        break;
      }
      console.warn(`  err ${place.slug}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, BATCH_PAUSE_MS));
  }

  const tagsOutPath = dryRun ? DRY_TAGS_PATH : TAGS_PATH;
  const recsOutPath = dryRun ? DRY_RECS_PATH : RECS_PATH;

  // Final write of tags
  await writeFile(tagsOutPath, JSON.stringify(tagsByPlace, null, 2) + "\n");
  console.log(`\nWrote ${Object.keys(tagsByPlace).length} place-tag entries to ${tagsOutPath}`);

  // Aggregate into community-recs.json
  const tagsForAggregation = {};
  for (const [slug, entry] of Object.entries(tagsByPlace)) {
    tagsForAggregation[slug] = entry.topics || [];
  }
  const merged = buildCommunityRecs(tagsForAggregation, places, existingRecs);
  await writeFile(recsOutPath, JSON.stringify(merged, null, 2) + "\n");
  const aiTopicCount = (merged.topics || []).filter((t) => t.source === "ai-praise-tags").length;
  console.log(`\ncommunity-recs.json now has ${(merged.topics || []).length} topics (${aiTopicCount} AI-derived)`);
  console.log(`                              ${(merged.businesses || []).length} businesses`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
