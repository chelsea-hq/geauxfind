#!/usr/bin/env node

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const USER_AGENT = "GeauxFind/1.0 (local news aggregator)";

const SOURCES = [
  {
    name: "Developing Lafayette",
    sourceUrl: "https://developinglafayette.com/wp/category/restaurant/",
    urls: [
      "https://developinglafayette.com/wp/category/restaurant/",
      "https://developinglafayette.com/wp/category/local-business/",
      "https://developinglafayette.com/"
    ]
  },
  {
    name: "Lafayette Travel",
    sourceUrl: "https://www.lafayettetravel.com/blog/stories/post/whats-new-in-lafayette/",
    urls: [
      "https://www.lafayettetravel.com/blog/stories/post/new-restaurants-in-lafayette/",
      "https://www.lafayettetravel.com/blog/stories/post/whats-new-in-lafayette/"
    ]
  },
  {
    name: "973 The Dawg",
    sourceUrl: "https://973thedawg.com/categories/lafayette-news/",
    urls: ["https://973thedawg.com/categories/lafayette-news/", "https://973thedawg.com/category/lafayette-news/"],
    allowHosts: ["973thedawg.com"]
  },
  {
    name: "KPEL 96.5",
    sourceUrl: "https://kpel965.com/",
    urls: ["https://kpel965.com/"],
    allowHosts: ["kpel965.com"]
  },
  {
    name: "The Advocate Acadiana",
    sourceUrl: "https://www.theadvocate.com/acadiana/entertainment_life/food/",
    urls: ["https://www.theadvocate.com/acadiana/entertainment_life/food/"],
    allowHosts: ["theadvocate.com", "www.theadvocate.com", "nola.com", "www.nola.com"]
  }
];

const CITY_KEYWORDS = ["Lafayette", "Broussard", "Scott", "Youngsville", "Carencro", "Breaux Bridge", "New Iberia", "Abbeville", "Rayne", "Duson"];
const TAG_KEYWORDS = ["downtown", "cajun", "creole", "seafood", "bbq", "brunch", "coffee", "pizza", "mexican", "asian", "festival", "live music", "family", "new", "opening", "coming soon", "weekend"];
const BLOCK_PATHS = ["/tag/", "/tags/", "/category/", "/categories/", "/account", "/login", "/subscribe", "/privacy", "/terms", "/about", "/contact", "/facebook", "/instagram", "/youtube", "/podcast", "/weather", "/sports"];

const stripTags = (v = "") =>
  v.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();

const slugify = (v = "") => v.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);

function toAbsoluteUrl(href, baseUrl) {
  if (!href) return "";
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return "";
  }
}

function normalizeUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid"].forEach((k) => u.searchParams.delete(k));
    u.hash = "";
    return u.toString();
  } catch {
    return rawUrl;
  }
}

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function parseDateFromUrl(rawUrl) {
  try {
    const { pathname } = new URL(rawUrl);
    const m = pathname.match(/\/(20\d{2})\/(\d{1,2})(?:\/(\d{1,2}))?\//);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3] || 1);
    return new Date(Date.UTC(y, mo, d, 12, 0, 0)).toISOString();
  } catch {
    return null;
  }
}

function inferCategory(title, excerpt) {
  const text = `${title} ${excerpt}`.toLowerCase();
  if (/coming soon|opening soon|set to open|plans to open/.test(text)) return "Coming Soon";
  if (/festival|concert|weekend|event|things to do/.test(text)) return "Event";
  if (/review|taste test|best of|food writer/.test(text)) return "Food Review";
  if (/(\brestaurant\b|\beatery\b|\bcafe\b|\bbar\b|\bbistro\b|\bkitchen\b|\bmenu\b)/.test(text)) return "New Restaurant";
  if (/business|store|shop|retail|opening/.test(text)) return "Business Opening";
  return "Food News";
}

const inferCity = (title, excerpt) => CITY_KEYWORDS.find((c) => `${title} ${excerpt}`.toLowerCase().includes(c.toLowerCase()));

function inferTags(title, excerpt, category) {
  const text = `${title} ${excerpt}`.toLowerCase();
  const tags = new Set([category.toLowerCase()]);
  TAG_KEYWORDS.forEach((t) => text.includes(t) && tags.add(t));
  text.includes("lafayette") && tags.add("lafayette");
  text.includes("acadiana") && tags.add("acadiana");
  return Array.from(tags).slice(0, 8);
}

function isLikelyStoryTitle(title) {
  const t = title.toLowerCase();
  if (/(subscribe|donation|manage your|skip to main content|follow us|visit us)/.test(t)) return false;
  if (/(shooting|murder|arrest|police|lawsuit|court|chief|school|election|storm|traffic|tsa|marketing and advertising solutions)/.test(t)) return false;
  return /(\brestaurant\b|\beatery\b|\bcafe\b|\bbar\b|\bkitchen\b|opening|opens|coming soon|new in|\bfood\b|\bmenu\b|\bchef\b|\bshop\b|\bstore\b|\bmarket\b|festival|event|things to do|weekend|brewery|downtown|review)/.test(t);
}

function isLikelyStoryUrl(rawUrl, source) {
  if (!rawUrl) return false;
  let u;
  try {
    u = new URL(rawUrl);
  } catch {
    return false;
  }

  const host = u.hostname.toLowerCase();
  const path = u.pathname.toLowerCase();

  if (source.allowHosts && !source.allowHosts.some((h) => host === h || host.endsWith(`.${h}`))) return false;
  if (BLOCK_PATHS.some((p) => path.includes(p))) return false;
  if (path === "/" || path.length < 5) return false;

  if (source.name === "Lafayette Travel") return path.includes("/blog/stories/post/");
  if (source.name === "Developing Lafayette") return /\/\d{4}\//.test(path) || path.includes("/wp/") || path.includes("/restaurant/") || path.includes("/local-business/");
  if (source.name === "KPEL 96.5" || source.name === "973 The Dawg") return !path.includes("/categories/") && path.split("/").filter(Boolean).length >= 1;
  if (source.name === "The Advocate Acadiana") return path.includes("/food/") || path.includes("/restaurants/") || path.includes("/entertainment_life/");

  return true;
}

function parseJsonLdArticles(html, baseUrl) {
  const out = [];
  const scripts = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];

  for (const s of scripts) {
    const m = s.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!m) continue;
    let parsed;
    try {
      parsed = JSON.parse(m[1]);
    } catch {
      continue;
    }

    const q = Array.isArray(parsed) ? [...parsed] : [parsed];
    while (q.length) {
      const node = q.shift();
      if (!node || typeof node !== "object") continue;
      if (Array.isArray(node)) {
        q.push(...node);
        continue;
      }
      if (Array.isArray(node["@graph"])) q.push(...node["@graph"]);

      const t = String(node["@type"] || "").toLowerCase();
      if (/(article|newsarticle|blogposting)/.test(t)) {
        const title = stripTags(node.headline || node.name || "");
        const url = toAbsoluteUrl(node.url || node.mainEntityOfPage || "", baseUrl);
        const excerpt = stripTags(node.description || "");
        const date = parseDate(node.datePublished || node.dateCreated || node.dateModified || "") || parseDateFromUrl(url);
        const image = typeof node.image === "string" ? node.image : Array.isArray(node.image) ? node.image[0] : node.image?.url;
        const imageUrl = toAbsoluteUrl(image || "", baseUrl);
        if (title && url) out.push({ title, url, excerpt, date, imageUrl });
      }

      for (const v of Object.values(node)) if (v && typeof v === "object") q.push(v);
    }
  }

  return out;
}

function parseAnchorCards(html, baseUrl) {
  const out = [];
  const seen = new Set();
  const re = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m;

  while ((m = re.exec(html))) {
    const url = toAbsoluteUrl(m[1], baseUrl);
    const title = stripTags(m[2]);
    if (!url || !title || title.length < 28 || title.split(" ").length < 4) continue;
    if (seen.has(url)) continue;

    const around = html.slice(Math.max(0, m.index - 1200), Math.min(html.length, m.index + 1600));
    const excerptMatch = around.match(/<(?:p|div)[^>]*>([\s\S]{30,350}?)<\/(?:p|div)>/i);
    const dateMatch = around.match(/datetime=["']([^"']+)["']/i) || around.match(/\b([A-Z][a-z]+\s+\d{1,2},\s+\d{4})\b/);
    const date = parseDate(dateMatch?.[1] || "") || parseDateFromUrl(url);
    const imgMatch = around.match(/<img[^>]+src=["']([^"']+)["']/i);

    out.push({
      title,
      url,
      excerpt: stripTags(excerptMatch?.[1] || ""),
      date,
      imageUrl: toAbsoluteUrl(imgMatch?.[1] || "", baseUrl)
    });

    seen.add(url);
    if (out.length >= 60) break;
  }

  return out;
}

function buildItem(raw, source) {
  const title = stripTags(raw.title || "");
  const resolvedDate = raw.date || parseDateFromUrl(raw.url) || new Date().toISOString();
  if (!title || !raw.url) return null;
  if (!isLikelyStoryTitle(title)) return null;
  if (!isLikelyStoryUrl(raw.url, source)) return null;

  const excerpt = stripTags(raw.excerpt || "") || `Local update from ${title}.`;
  const category = inferCategory(title, excerpt);

  return {
    id: slugify(title) || slugify(raw.url),
    title,
    source: source.name,
    sourceUrl: source.sourceUrl,
    url: normalizeUrl(raw.url),
    excerpt: excerpt.slice(0, 260),
    date: resolvedDate,
    imageUrl: raw.imageUrl || undefined,
    category,
    tags: inferTags(title, excerpt, category),
    city: inferCity(title, excerpt)
  };
}

async function fetchSource(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function scrape() {
  const collected = [];

  for (const source of SOURCES) {
    for (const url of source.urls) {
      try {
        const html = await fetchSource(url);
        const rawItems = [...parseJsonLdArticles(html, url), ...parseAnchorCards(html, url)];
        const built = rawItems.map((r) => buildItem(r, source)).filter(Boolean);
        collected.push(...built);
        console.log(`✓ ${source.name}: ${built.length} items from ${url}`);
      } catch (e) {
        console.warn(`⚠ ${source.name}: failed ${url} (${e.message})`);
      }
    }
  }

  const dedup = new Map();
  for (const item of collected) if (!dedup.has(item.url)) dedup.set(item.url, item);

  const items = Array.from(dedup.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 50);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(__dirname, "../data/whats-new.json");
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(items, null, 2));

  console.log(`\nDone. Wrote ${items.length} items to data/whats-new.json`);
}

scrape().catch((err) => {
  console.error(err);
  process.exit(1);
});
