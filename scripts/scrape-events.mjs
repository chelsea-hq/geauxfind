#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const APIFY_API_BASE = "https://api.apify.com/v2";
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);

const SOURCES = [
  { key: "developinglafayette", url: "https://developinglafayette.com/wp/category/events/" },
  { key: "lafayettetravel", url: "https://www.lafayettetravel.com/events" },
  { key: "do337", url: "https://do337.com/events" },
  { key: "eventbrite", url: "https://www.eventbrite.com/d/la--lafayette/events/" },
  { key: "theadvertiser", url: "https://www.theadvertiser.com/things-to-do/" },
];

const FB_CITIES = ["Lafayette LA", "Breaux Bridge LA", "New Iberia LA", "Opelousas LA"];

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function cleanText(v = "") {
  return String(v)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(v = "") {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
}

function parseDateLoose(value) {
  if (!value) return null;
  const d = new Date(value);
  if (!Number.isNaN(d.getTime())) return d;

  const m = String(value).match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);
  if (m) {
    const year = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
    const parsed = new Date(year, Number(m[1]) - 1, Number(m[2]), 12);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const m2 = String(value).match(/\b([A-Za-z]{3,9})\s+(\d{1,2})(?:,\s*(\d{4}))?/);
  if (m2) {
    const year = Number(m2[3] || new Date().getFullYear());
    const parsed = new Date(`${m2[1]} ${m2[2]}, ${year} 12:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

function toYmd(date) {
  if (!date) return null;
  const d = typeof date === "string" ? parseDateLoose(date) : date;
  if (!d || Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function inferCity(text = "") {
  const cities = ["Lafayette", "Breaux Bridge", "New Iberia", "Opelousas", "Broussard", "Youngsville", "Scott", "Carencro", "Abbeville", "Rayne", "Duson", "St. Martinville"];
  const lower = text.toLowerCase();
  return cities.find((c) => lower.includes(c.toLowerCase())) || "Lafayette";
}

function inferCategory(text = "") {
  const t = text.toLowerCase();
  if (/concert|live music|zydeco|band|show/.test(t)) return "music";
  if (/festival|fair|mardi gras|parade/.test(t)) return "festival";
  if (/food|cook|tasting|crawfish|gumbo|boil|boudin/.test(t)) return "food";
  if (/art|gallery|museum|theater|theatre|film/.test(t)) return "arts";
  if (/game|soccer|football|baseball|run|5k|marathon|sports/.test(t)) return "sports";
  if (/night|club|dj|party|happy hour/.test(t)) return "nightlife";
  if (/kids|family|children/.test(t)) return "family";
  return "community";
}

function inferFreePrice(text = "") {
  const t = text.toLowerCase();
  if (/\bfree\b|no cover|free admission/.test(t)) return { free: true, price: null };
  const m = text.match(/\$\s?\d+(?:\.\d{2})?/);
  if (m) return { free: false, price: m[0].replace(/\s+/g, "") };
  return { free: false, price: null };
}

function normalizeUrl(raw, base) {
  if (!raw) return "";
  try {
    const u = new URL(raw, base);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((k) => u.searchParams.delete(k));
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

function eventKey(title, date) {
  return createHash("sha1").update(`${title}|${date}`).digest("hex").slice(0, 14);
}

function similarTitle(a, b) {
  const sa = slugify(a).split("-").filter(Boolean);
  const sb = slugify(b).split("-").filter(Boolean);
  if (!sa.length || !sb.length) return 0;
  const setA = new Set(sa);
  const setB = new Set(sb);
  let inter = 0;
  for (const t of setA) if (setB.has(t)) inter += 1;
  return inter / Math.max(setA.size, setB.size);
}

function toEvent(raw, sourceKey) {
  const title = cleanText(raw.title || "").slice(0, 170);
  const dateObj = parseDateLoose(raw.date || raw.startDate || raw.startTime || "");
  const date = toYmd(dateObj);
  if (!title || !date) return null;

  const desc = cleanText(raw.description || "").slice(0, 380);
  const venue = cleanText(raw.venue || raw.location || "") || "TBA";
  const address = cleanText(raw.address || "");
  const city = cleanText(raw.city || inferCity(`${venue} ${address} ${title} ${desc}`));
  const time = cleanText(raw.time || raw.startTimeText || "") || "TBA";
  const image = raw.image ? normalizeUrl(raw.image, raw.link || "") : null;
  const link = normalizeUrl(raw.link || raw.url || "", raw.baseUrl || "");
  const category = inferCategory(`${title} ${desc} ${venue}`);
  const { free, price } = inferFreePrice(`${raw.price || ""} ${title} ${desc}`);

  return {
    slug: slugify(title) || eventKey(title, date),
    title,
    date,
    endDate: toYmd(parseDateLoose(raw.endDate || raw.endTime || "")) || date,
    time,
    venue,
    address: address || null,
    city,
    description: desc || `${title} in ${city}.`,
    category,
    image: image || null,
    link: link || null,
    source: sourceKey,
    free,
    price,
  };
}

function extractJsonLd($, baseUrl) {
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return; }

    const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
    while (queue.length) {
      const n = queue.shift();
      if (!n || typeof n !== "object") continue;
      if (Array.isArray(n)) { queue.push(...n); continue; }
      if (Array.isArray(n["@graph"])) queue.push(...n["@graph"]);

      const type = String(n["@type"] || "").toLowerCase();
      if (type.includes("event")) {
        const location = n.location || {};
        const addr = location.address || {};
        const image = Array.isArray(n.image) ? n.image[0] : n.image?.url || n.image;
        out.push({
          title: n.name || n.headline,
          date: n.startDate,
          endDate: n.endDate,
          description: n.description,
          venue: location.name,
          address: cleanText([addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ")),
          city: addr.addressLocality,
          image,
          link: normalizeUrl(n.url || n.offers?.url || "", baseUrl),
          price: n.offers?.price ? `$${n.offers.price}` : n.offers?.priceCurrency,
          baseUrl,
        });
      }

      for (const v of Object.values(n)) if (v && typeof v === "object") queue.push(v);
    }
  });
  return out;
}

function extractAnchors($, baseUrl) {
  const out = [];
  $("a[href]").each((_, a) => {
    const href = $(a).attr("href") || "";
    const link = normalizeUrl(href, baseUrl);
    const text = cleanText($(a).text());
    if (!link || !text || text.length < 8) return;
    if (!/event|festival|concert|show|things to do|weekend|party|live/i.test(`${text} ${link}`)) return;

    const card = $(a).closest("article, li, .event, .card, .item, div");
    const cardText = cleanText(card.text()).slice(0, 500);
    const timeMatch = cardText.match(/\b\d{1,2}:\d{2}\s?(?:AM|PM)\b/i);
    const dateMatch = cardText.match(/\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:,\s*\d{4})?/i)
      || cardText.match(/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/);

    const img = normalizeUrl(card.find("img").first().attr("src") || "", baseUrl);

    out.push({
      title: text,
      date: dateMatch?.[0],
      time: timeMatch?.[0],
      description: cardText,
      image: img || null,
      link,
      baseUrl,
    });
  });

  return out.slice(0, 180);
}

async function fetchHtml(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function scrapeSource(source) {
  try {
    const html = await fetchHtml(source.url);
    const $ = load(html);
    const records = [...extractJsonLd($, source.url), ...extractAnchors($, source.url)];
    const normalized = records.map((r) => toEvent(r, source.key)).filter(Boolean);
    console.log(`✓ ${source.key}: ${normalized.length}`);
    return { events: normalized, ok: true };
  } catch (err) {
    console.warn(`⚠ ${source.key}: ${err.message}`);
    return { events: [], ok: false, error: err.message };
  }
}

function parseEnv(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [k, ...rest] = trimmed.split("=");
    out[k.trim()] = rest.join("=").trim().replace(/^['\"]|['\"]$/g, "");
  }
  return out;
}

async function readApifyKey() {
  if (process.env.APIFY_API_KEY) return process.env.APIFY_API_KEY;
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const candidates = [
    path.resolve(__dirname, "../.secrets.env"),
    path.resolve(__dirname, "../../.secrets.env"),
    path.resolve(__dirname, "../../../.secrets.env"),
  ];

  for (const p of candidates) {
    try {
      const raw = await readFile(p, "utf8");
      const parsed = parseEnv(raw);
      if (parsed.APIFY_API_KEY) return parsed.APIFY_API_KEY;
    } catch {}
  }
  return "";
}

async function apifyRequest(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Apify HTTP ${res.status}: ${body.slice(0, 180)}`);
  }
  return res.json();
}

async function runActorByAnyId(token, actorIds, input) {
  for (const actorId of actorIds) {
    try {
      const start = await apifyRequest(`${APIFY_API_BASE}/acts/${encodeURIComponent(actorId)}/runs?token=${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const runId = start?.data?.id;
      if (!runId) throw new Error("missing run id");

      const started = Date.now();
      while (Date.now() - started < 4 * 60 * 1000) {
        const stat = await apifyRequest(`${APIFY_API_BASE}/actor-runs/${runId}?token=${encodeURIComponent(token)}`);
        const status = stat?.data?.status;
        if (["SUCCEEDED", "FAILED", "ABORTED", "TIMED-OUT"].includes(status)) {
          return { actorId, run: stat.data };
        }
        await sleep(3500);
      }
      throw new Error("timeout");
    } catch (err) {
      console.warn(`⚠ facebook actor ${actorId} failed: ${err.message}`);
    }
  }
  return null;
}

async function fetchDataset(token, datasetId) {
  return apifyRequest(`${APIFY_API_BASE}/datasets/${datasetId}/items?token=${encodeURIComponent(token)}&clean=true&format=json&limit=250&desc=true`);
}

async function scrapeFacebookEvents() {
  const token = await readApifyKey();
  if (!token) {
    console.warn("⚠ APIFY_API_KEY missing; skipping facebook source");
    return [];
  }

  const actorIds = [
    "apify/facebook-events-scraper",
    "curious_coder/facebook-events-scraper",
    "legible_center/facebook-events-scraper",
  ];

  const input = {
    searchTerms: FB_CITIES,
    maxEvents: 120,
    maxItems: 120,
    includePrivateDetails: false,
    proxy: { useApifyProxy: true },
  };

  const result = await runActorByAnyId(token, actorIds, input);
  if (!result || result.run?.status !== "SUCCEEDED") return [];

  const dataset = await fetchDataset(token, result.run.defaultDatasetId);
  const items = Array.isArray(dataset) ? dataset : [];

  const normalized = items
    .map((it) => toEvent({
      title: it.name || it.title,
      date: it.startDate || it.date,
      endDate: it.endDate,
      time: it.startTime || it.time,
      venue: it.locationName || it.venue || it.location,
      address: it.address || it.locationAddress,
      city: it.city,
      description: it.description || it.about || it.summary,
      image: it.coverPhoto || it.image || it.imageUrl,
      link: it.url || it.eventUrl,
      price: it.ticketPrice || it.price,
    }, "facebook"))
    .filter(Boolean);

  console.log(`✓ facebook: ${normalized.length}`);
  return normalized;
}

function dedupeAndSort(events) {
  const upcoming = events.filter((e) => parseDateLoose(e.date)?.getTime() >= TODAY.getTime());
  const deduped = [];

  for (const ev of upcoming) {
    const existing = deduped.find((d) => d.date === ev.date && (similarTitle(d.title, ev.title) >= 0.72 || d.slug === ev.slug));
    if (!existing) {
      deduped.push(ev);
      continue;
    }

    if (!existing.image && ev.image) existing.image = ev.image;
    if ((!existing.description || existing.description.length < 60) && ev.description) existing.description = ev.description;
    if ((!existing.venue || existing.venue === "TBA") && ev.venue) existing.venue = ev.venue;
    if (!existing.link && ev.link) existing.link = ev.link;
  }

  deduped.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.title.localeCompare(b.title));
  return deduped;
}

async function main() {
  const sourceResults = [];
  for (const source of SOURCES) {
    const result = await scrapeSource(source);
    sourceResults.push({ source: source.key, ...result });
  }

  const fbEvents = await scrapeFacebookEvents();
  const all = [...sourceResults.flatMap((s) => s.events), ...fbEvents];
  const finalEvents = dedupeAndSort(all).slice(0, 200);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(__dirname, "../data/events.json");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(finalEvents, null, 2));

  const report = {
    generatedAt: new Date().toISOString(),
    totals: { raw: all.length, final: finalEvents.length },
    sources: sourceResults.map((s) => ({ source: s.source, ok: s.ok, count: s.events.length, error: s.error || null })),
    facebookCount: fbEvents.length,
  };
  const reportPath = path.resolve(__dirname, "../data/events-scrape-report.json");
  await writeFile(reportPath, JSON.stringify(report, null, 2));

  console.log(`\nDone. Raw: ${all.length} | Final upcoming deduped: ${finalEvents.length}`);
}

main().catch((err) => {
  console.error(`Scrape failed: ${err.message}`);
  process.exit(1);
});
