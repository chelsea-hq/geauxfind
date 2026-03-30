#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");
const CACHE_DIR = path.join(DATA_DIR, "cache");
const OUT_FILE = path.join(DATA_DIR, "weekend-events.json");

const EVENTBRITE_TOKEN = process.env.EVENTBRITE_API_TOKEN || process.env.EVENTBRITE_TOKEN;

function normalizeTitle(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function titleSimilarity(a, b) {
  const A = new Set(normalizeTitle(a).split(" ").filter(Boolean));
  const B = new Set(normalizeTitle(b).split(" ").filter(Boolean));
  if (!A.size || !B.size) return 0;
  let overlap = 0;
  for (const t of A) if (B.has(t)) overlap += 1;
  return overlap / Math.max(A.size, B.size);
}

function thisWeekendPlus7Window() {
  const now = new Date();
  const d = now.getDay();
  const daysToFriday = (5 - d + 7) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() + daysToFriday);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 9);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function inWindow(dateStr, win) {
  if (!dateStr) return false;
  const dt = new Date(dateStr);
  if (Number.isNaN(dt.getTime())) return false;
  return dt >= win.start && dt <= win.end;
}

async function ensureDirs() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

async function cachedFetch(url, cacheName, ttlMs = 6 * 60 * 60 * 1000, init = {}) {
  await ensureDirs();
  const p = path.join(CACHE_DIR, cacheName);
  try {
    const stat = await fs.stat(p);
    if (Date.now() - stat.mtimeMs < ttlMs) {
      return await fs.readFile(p, "utf8");
    }
  } catch {}

  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const txt = await res.text();
  await fs.writeFile(p, txt, "utf8");
  return txt;
}

function toEvent(e) {
  return {
    title: e.title || "",
    date: e.date || "",
    venue: e.venue || "",
    address: e.address || "",
    description: e.description || "",
    source: e.source || "unknown",
    url: e.url || "",
    category: e.category || "event",
  };
}

async function scrapeEventbrite() {
  if (!EVENTBRITE_TOKEN) return [];
  const url = "https://www.eventbriteapi.com/v3/events/search/?location.address=lafayette%2C%20la&expand=venue&sort_by=date&categories=103,105,110,113,115";
  const text = await cachedFetch(url, "eventbrite-lafayette.json", 3 * 60 * 60 * 1000, {
    headers: { Authorization: `Bearer ${EVENTBRITE_TOKEN}` },
  });
  const json = JSON.parse(text);
  return (json.events || []).map((ev) =>
    toEvent({
      title: ev.name?.text,
      date: ev.start?.local,
      venue: ev.venue?.name || "",
      address: [ev.venue?.address?.localized_address_display, ev.venue?.address?.city].filter(Boolean).join(", "),
      description: ev.summary || ev.description?.text || "",
      source: "Eventbrite",
      url: ev.url,
      category: ev.category_id ? `eventbrite-${ev.category_id}` : "event",
    })
  );
}

function extractJsonLdEvents($, source) {
  const events = [];
  $("script[type='application/ld+json']").each((_, el) => {
    const raw = $(el).text();
    try {
      const data = JSON.parse(raw);
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        const entries = Array.isArray(item?.['@graph']) ? item['@graph'] : [item];
        for (const x of entries) {
          const type = String(x?.['@type'] || "").toLowerCase();
          if (!type.includes("event")) continue;
          events.push(
            toEvent({
              title: x.name,
              date: x.startDate,
              venue: x.location?.name,
              address: x.location?.address?.streetAddress || x.location?.address?.addressLocality || "",
              description: x.description,
              source,
              url: x.url,
              category: Array.isArray(x.eventAttendanceMode) ? x.eventAttendanceMode[0] : "event",
            })
          );
        }
      }
    } catch {}
  });
  return events;
}

async function scrapeDo337() {
  const html = await cachedFetch("https://do337.com/", "do337-home.html", 6 * 60 * 60 * 1000);
  const $ = cheerio.load(html);
  const events = extractJsonLdEvents($, "Do337");

  $("a[href*='/events/']").slice(0, 80).each((_, el) => {
    const title = $(el).text().trim();
    const url = $(el).attr("href") || "";
    if (!title || title.length < 4) return;
    events.push(toEvent({ title, date: "", source: "Do337", url: url.startsWith("http") ? url : `https://do337.com${url}` }));
  });

  return events;
}

async function scrapeKrvs() {
  const html = await cachedFetch("https://www.krvs.org/", "krvs-home.html", 6 * 60 * 60 * 1000);
  const $ = cheerio.load(html);
  const events = extractJsonLdEvents($, "KRVS");

  $("a").each((_, el) => {
    const href = $(el).attr("href") || "";
    const text = $(el).text().trim();
    if (!/(event|calendar|festival|live|music)/i.test(`${href} ${text}`)) return;
    if (text.length < 5) return;
    events.push(toEvent({
      title: text,
      source: "KRVS",
      url: href.startsWith("http") ? href : `https://www.krvs.org${href}`,
      category: "community",
    }));
  });

  return events;
}

async function scrapeFacebookPublic() {
  const pages = [
    "https://www.facebook.com/LafayetteTravel/",
    "https://www.facebook.com/downtownlafayette/",
    "https://www.facebook.com/Acadiensocial/",
  ];
  const out = [];
  let idx = 0;
  for (const page of pages) {
    idx += 1;
    try {
      const html = await cachedFetch(page, `facebook-page-${idx}.html`, 12 * 60 * 60 * 1000, {
        headers: { "User-Agent": "Mozilla/5.0 (GeauxFind event scraper)" },
      });
      const $ = cheerio.load(html);
      out.push(...extractJsonLdEvents($, "Facebook"));

      $("a[href*='/events/']").each((_, el) => {
        const title = $(el).text().trim();
        const href = $(el).attr("href") || "";
        if (!title) return;
        const url = href.startsWith("http") ? href : `https://www.facebook.com${href}`;
        out.push(toEvent({ title, source: "Facebook", url, category: "social" }));
      });
    } catch {}
  }
  return out;
}

function dedupe(events) {
  const deduped = [];
  for (const ev of events) {
    if (!ev.title) continue;
    const dupe = deduped.find((x) => titleSimilarity(x.title, ev.title) >= 0.82 && (!x.date || !ev.date || x.date.slice(0, 10) === ev.date.slice(0, 10)));
    if (!dupe) deduped.push(ev);
  }
  return deduped;
}

async function main() {
  const win = thisWeekendPlus7Window();
  const all = [];

  for (const fn of [scrapeEventbrite, scrapeFacebookPublic, scrapeDo337, scrapeKrvs]) {
    try {
      const events = await fn();
      all.push(...events);
    } catch (e) {
      console.warn("Source failed:", e instanceof Error ? e.message : String(e));
    }
  }

  const filtered = all.filter((e) => !e.date || inWindow(e.date, win));
  const clean = dedupe(filtered).map(toEvent);

  await ensureDirs();
  await fs.writeFile(OUT_FILE, JSON.stringify({ events: clean }, null, 2), "utf8");

  console.log(`Saved ${clean.length} events to data/weekend-events.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
