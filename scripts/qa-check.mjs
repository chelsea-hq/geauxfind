#!/usr/bin/env node
/**
 * GeauxFind QA Check (upgraded)
 * - Page health + broken images + dead links
 * - seed-data schema/quality checks
 * - nav completeness checks
 * - console error checks (Playwright when available)
 */

import fs from "node:fs/promises";
import path from "node:path";

const arg = (name, fallback = null) => {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.split("=")[1];
  const idx = process.argv.indexOf(`--${name}`);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
};

const BASE = arg("url", "https://geauxfind.com");
const ROOT = process.cwd();
const PAGES = [
  "/",
  "/explore",
  "/crawfish",
  "/vibe",
  "/weekend",
  "/plan",
  "/whos-got-it",
  "/trending",
  "/ask",
  "/food",
  "/music",
  "/events",
  "/finds",
  "/recipes",
  "/whats-new",
  // Recently shipped — community picks surface
  "/best-of",
  "/best-of/best-donuts-in-acadiana",
  "/best-of/best-coffee-in-acadiana",
  "/best-of/best-chicken-salad-in-acadiana",
  "/best-of/best-gumbo-in-acadiana",
  // Guide pages where dead-FB-link audit found bad data
  "/farmers-markets",
  "/festivals",
];
const REQUIRED_NAV_ROUTES = ["/plan", "/whos-got-it", "/trending", "/best-of"];

const issues = [];
let totalChecks = 0;
let passed = 0;

const fail = (page, category, detail) => {
  issues.push({ page, category, detail });
  console.log(`❌ [${page}] ${category}: ${detail}`);
};
const pass = () => { passed += 1; };
const check = (ok, page, category, detail) => {
  totalChecks += 1;
  if (!ok) fail(page, category, detail); else pass();
};

const absoluteUrl = (src) => {
  if (!src) return null;
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("data:") || src.startsWith("blob:")) return null;
  if (src.startsWith("/")) return `${BASE}${src}`;
  return `${BASE}/${src}`;
};

async function headOrGet(url) {
  try {
    const head = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (head.ok || head.status === 405) return head.ok ? head : await fetch(url, { method: "GET", redirect: "follow" });
    return head;
  } catch {
    return fetch(url, { method: "GET", redirect: "follow" });
  }
}

async function checkDataFile() {
  const seedPath = path.join(ROOT, "scripts", "seed-data.json");
  const raw = await fs.readFile(seedPath, "utf8");
  const data = JSON.parse(raw);

  check(Array.isArray(data), "seed-data.json", "DATA_SCHEMA", "seed-data.json must be a flat JSON array");
  const places = Array.isArray(data) ? data : (Array.isArray(data?.places) ? data.places : []);
  check(places.length > 0, "seed-data.json", "DATA_CONTENT", "No places found");

  const slugSeen = new Set();
  const nameCitySeen = new Set();
  let dupes = 0;
  let missingImage = 0;
  let shortDescription = 0;

  for (const p of places) {
    const slug = String(p?.slug || "").trim();
    const nameCity = `${String(p?.name || "").trim().toLowerCase()}|${String(p?.city || "").trim().toLowerCase()}`;
    if (!slug || slugSeen.has(slug) || nameCitySeen.has(nameCity)) dupes += 1;
    slugSeen.add(slug);
    nameCitySeen.add(nameCity);

    const image = String(p?.image || "").trim();
    if (!image) missingImage += 1;

    const desc = String(p?.description || "").trim();
    if (desc.length < 40) shortDescription += 1;
  }

  check(dupes === 0, "seed-data.json", "DUPLICATES", `${dupes} duplicate entries detected`);
  check(missingImage === 0, "seed-data.json", "MISSING_IMAGES", `${missingImage} places with missing images`);
  check(shortDescription === 0, "seed-data.json", "DESCRIPTIONS", `${shortDescription} places with short/empty descriptions (<40 chars)`);
}

async function checkPage(route) {
  const url = `${BASE}${route}`;
  console.log(`🔍 ${route}`);
  let html = "";
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "User-Agent": "GeauxFind-QA/2.0" } });
    check(res.ok, route, "HTTP", `Status ${res.status}`);
    if (!res.ok) return;
    html = await res.text();
  } catch (e) {
    check(false, route, "FETCH", e.message);
    return;
  }

  check(html.length > 500, route, "CONTENT", "Page appears too small (<500 chars)");
  check(!/Application error|Internal Server Error|__next_error__/i.test(html), route, "ERROR_PAGE", "Runtime error markers detected");
  check(!/Hydration failed|Text content does not match/i.test(html), route, "HYDRATION", "Hydration mismatch markers detected");

  const imageRefs = [
    ...[...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((m) => m[1]),
    ...[...html.matchAll(/"src":"(.*?)"/g)].map((m) => m[1].replace(/\\u0026/g, "&")),
  ].filter(Boolean);

  const uniqueImages = [...new Set(imageRefs)].slice(0, 25);
  let broken = 0;
  let apiPhotoFails = 0;
  for (const src of uniqueImages) {
    const full = absoluteUrl(src);
    if (!full) continue;
    // External CDNs that block HEAD (Eventbrite, etc.) — 403 is not truly broken
    const knownExternalCdns = ["img.evbuc.com", "cdn.evbuc.com", "eventbrite.com"];
    if (knownExternalCdns.some((cdn) => src.includes(cdn))) continue;
    // /api/photo requires Google API key — skip hard-fail, just warn
    if (src.includes("/api/photo")) {
      try {
        const r = await headOrGet(full);
        if (!r.ok) apiPhotoFails += 1;
      } catch { apiPhotoFails += 1; }
      continue;
    }
    try {
      const r = await headOrGet(full);
      if (!r.ok) broken += 1;
    } catch { broken += 1; }
  }
  if (apiPhotoFails > 0) console.log(`  ⚠️  ${apiPhotoFails} /api/photo refs 404 (Google API key needed — expected in dev/without key)`);
  check(broken === 0, route, "BROKEN_IMAGES", `${broken} broken non-API image URLs`);

  const links = [...html.matchAll(/href="(\/[^"#?]*)/g)].map((m) => m[1]);
  const uniqueLinks = [...new Set(links)].slice(0, 40);
  let deadLinks = 0;
  for (const href of uniqueLinks) {
    try {
      const r = await headOrGet(`${BASE}${href}`);
      if (!r.ok) deadLinks += 1;
    } catch { deadLinks += 1; }
  }
  check(deadLinks === 0, route, "DEAD_LINKS", `${deadLinks} internal links not reachable`);
}

async function checkNavCompleteness() {
  const res = await fetch(`${BASE}/`, { redirect: "follow" });
  const html = await res.text();
  for (const route of REQUIRED_NAV_ROUTES) {
    check(html.includes(`href="${route}"`), "/", "NAV", `${route} is not reachable from homepage nav/quick links/footer`);
  }
}

// Surface check: did any closed business slip through filterOperational
// onto a public page? Compares closed-businesses.json slugs against
// HTML on key pages. Catches closed-business "zombies" early.
async function checkClosedBusinessLeak() {
  let closed;
  try {
    closed = JSON.parse(await fs.readFile(path.join(ROOT, "data", "closed-businesses.json"), "utf8"));
  } catch {
    console.log("⚠️  closed-businesses.json not readable; skipping leak check");
    return;
  }
  const slugs = (closed.entries || []).map((e) => e.slug).filter(Boolean);
  if (!slugs.length) return;
  console.log(`\n🔒 Closed-business leak check (${slugs.length} known slugs)`);

  const checkRoutes = ["/", "/food", "/whos-got-it", "/best-of", "/farmers-markets"];
  for (const route of checkRoutes) {
    try {
      const res = await fetch(`${BASE}${route}`, { redirect: "follow" });
      if (!res.ok) continue;
      const html = await res.text();
      const leaked = slugs.filter((s) => html.includes(`/place/${s}"`));
      check(
        leaked.length === 0,
        route,
        "CLOSED_LEAK",
        leaked.length > 0 ? `Closed business(es) leaked: ${leaked.slice(0, 5).join(", ")}` : "",
      );
    } catch {}
  }
}

// The most important check — actually loads each page in a real browser
// and listens for runtime exceptions. This is what catches the
// "Application error: client-side exception" issues that don't show up
// in the SSR'd HTML.
async function checkConsoleErrorsWithPlaywright() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("\n⚠️  Playwright not installed; browser-based error checks skipped");
    console.log("   Install: npm i -D playwright && npx playwright install chromium --only-shell");
    return;
  }

  console.log(`\n🌐 Browser smoke test (${PAGES.length} routes)`);
  const browser = await chromium.launch({ headless: true });
  try {
    for (const route of PAGES) {
      const page = await browser.newPage();
      const errors = [];
      const consoleErrors = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200));
      });
      page.on("pageerror", (err) => errors.push((err.message || String(err)).slice(0, 200)));
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: "networkidle", timeout: 25000 });
        // Wait briefly for any deferred error to fire
        await page.waitForTimeout(800);
        // Also detect Next.js error overlay text rendered into the DOM
        const errorText = await page.evaluate(() => {
          const txt = document.body?.innerText || "";
          const lower = txt.toLowerCase();
          if (lower.includes("application error") && lower.includes("client-side exception")) return "Next.js error overlay rendered";
          if (lower.includes("a server-side exception")) return "Server-side exception page";
          return null;
        });
        if (errorText) errors.push(errorText);
      } catch (e) {
        errors.push(`navigation: ${e.message.slice(0, 150)}`);
      }
      check(errors.length === 0, route, "RUNTIME_ERROR", errors.slice(0, 3).join(" | "));
      // Console errors are softer — log but don't fail (Vercel Analytics / 3p widgets often log)
      if (consoleErrors.length) {
        console.log(`  ⚠️  ${route}: ${consoleErrors.length} console.error(s) — first: ${consoleErrors[0].slice(0, 100)}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log(`\n🐊 GeauxFind QA Check v2 — ${BASE}\n${"═".repeat(56)}\n`);
  const start = Date.now();

  await checkDataFile();
  for (const route of PAGES) await checkPage(route);
  await checkNavCompleteness();
  await checkClosedBusinessLeak();
  await checkConsoleErrorsWithPlaywright();

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n${"═".repeat(56)}`);
  console.log(`📊 ${passed}/${totalChecks} checks passed | ${issues.length} issues | ${elapsed}s`);

  const report = { timestamp: new Date().toISOString(), base: BASE, totalChecks, passed, failed: issues.length, issues };
  await fs.mkdir(path.join(ROOT, "data"), { recursive: true });
  await fs.writeFile(path.join(ROOT, "data", "qa-report.json"), JSON.stringify(report, null, 2));
  console.log("💾 Report: data/qa-report.json");

  process.exit(issues.length ? 1 : 0);
})();