import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { load } from "cheerio";

export const USER_AGENT = "GeauxFindBot/1.0 (+https://geauxfind.local)";

export function cleanText(v = "") {
  return String(v)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function slugify(v = "") {
  return String(v)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 96);
}

export function normalizeUrl(raw, base = "") {
  if (!raw) return "";
  try {
    const u = new URL(raw, base);
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid"].forEach((k) => u.searchParams.delete(k));
    u.hash = "";
    return u.toString();
  } catch {
    return "";
  }
}

export function parseEnv(raw = "") {
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [k, ...rest] = trimmed.split("=");
    out[k.trim()] = rest.join("=").trim().replace(/^['\"]|['\"]$/g, "");
  }
  return out;
}

export async function readSecrets() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const candidates = [
    path.resolve(__dirname, "../../.env.local"),
    path.resolve(__dirname, "../../../.env.local"),
    path.resolve(__dirname, "../../.secrets.env"),
    path.resolve(__dirname, "../../../.secrets.env"),
    path.resolve(__dirname, "../../../../.secrets.env")
  ];

  const merged = { ...process.env };
  for (const file of candidates) {
    try {
      const raw = await readFile(file, "utf8");
      Object.assign(merged, parseEnv(raw));
    } catch {}
  }
  return merged;
}

export async function fetchHtml(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml"
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export function extractJsonLdEvents(html, baseUrl) {
  const $ = load(html);
  const out = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text();
    if (!raw) return;
    let parsed;
    try { parsed = JSON.parse(raw); } catch { return; }

    const q = Array.isArray(parsed) ? [...parsed] : [parsed];
    while (q.length) {
      const n = q.shift();
      if (!n || typeof n !== "object") continue;
      if (Array.isArray(n)) { q.push(...n); continue; }
      if (Array.isArray(n["@graph"])) q.push(...n["@graph"]);

      const t = String(n["@type"] || "").toLowerCase();
      if (t.includes("event")) {
        const loc = n.location || {};
        const addr = loc.address || {};
        const image = Array.isArray(n.image) ? n.image[0] : n.image?.url || n.image;
        out.push({
          title: cleanText(n.name || n.headline),
          date: n.startDate || "",
          endDate: n.endDate || "",
          venue: cleanText(loc.name || ""),
          address: cleanText([addr.streetAddress, addr.addressLocality, addr.addressRegion].filter(Boolean).join(", ")),
          description: cleanText(n.description || ""),
          link: normalizeUrl(n.url || n.offers?.url || "", baseUrl),
          image: normalizeUrl(image || "", baseUrl)
        });
      }

      for (const v of Object.values(n)) if (v && typeof v === "object") q.push(v);
    }
  });
  return out;
}

export async function writeJson(relPath, payload) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outPath = path.resolve(__dirname, "../..", relPath);
  await mkdir(path.dirname(outPath), { recursive: true });
  await writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`);
  return outPath;
}
