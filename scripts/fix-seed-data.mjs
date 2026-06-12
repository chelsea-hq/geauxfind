#!/usr/bin/env node
/**
 * Normalize and deduplicate scripts/seed-data.json in place.
 *
 * - Coerces every record to the canonical schema (hours array, reviews array,
 *   description >= 40 chars, numeric counts in google_review_count)
 * - Removes duplicate records (same google_place_id or same name|city),
 *   merging their data into the first-seen record so existing slugs survive
 * - Drops junk records (no slug or no real name)
 * - Remaps any references to dropped slugs in data/guides.json
 *
 * Safe to run repeatedly. Run with --dry-run to report without writing.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dedupePlaces, normalizePlace } from "./lib/places.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SEED_PATH = path.join(ROOT, "scripts", "seed-data.json");
const GUIDES_PATH = path.join(ROOT, "data", "guides.json");

const dryRun = process.argv.includes("--dry-run");

async function main() {
  const raw = await readFile(SEED_PATH, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("seed-data.json must be a flat array");

  const before = data.length;
  const { places, removed, junk, slugRemap } = dedupePlaces(data);
  const normalized = places.map(normalizePlace);

  let shortDesc = 0;
  for (const p of normalized) {
    if (String(p.description || "").trim().length < 40) shortDesc += 1;
  }

  console.log(`Places: ${before} -> ${normalized.length}`);
  console.log(`Duplicates merged: ${removed}, junk dropped: ${junk}`);
  console.log(`Slugs remapped: ${slugRemap.size}`);
  console.log(`Remaining short descriptions: ${shortDesc}`);

  // Remap references to dropped slugs in guides.json.
  let guidesPatched = 0;
  try {
    let guidesRaw = await readFile(GUIDES_PATH, "utf8");
    for (const [dropped, kept] of slugRemap) {
      // Raw string splice into JSON text: only kebab-case slugs are safe.
      // Anything else (quotes, backslashes) would corrupt guides.json.
      if (!/^[a-z0-9-]+$/.test(dropped) || !/^[a-z0-9-]+$/.test(kept)) {
        console.warn(`Skipping remap of non-kebab slug: ${JSON.stringify(dropped)} -> ${JSON.stringify(kept)}`);
        continue;
      }
      const needle = `"${dropped}"`;
      if (guidesRaw.includes(needle)) {
        guidesRaw = guidesRaw.split(needle).join(`"${kept}"`);
        guidesPatched += 1;
      }
    }
    if (guidesPatched && !dryRun) await writeFile(GUIDES_PATH, guidesRaw);
    console.log(`guides.json slug references remapped: ${guidesPatched}`);
  } catch {
    console.log("guides.json not found, skipping reference remap");
  }

  if (dryRun) {
    console.log("Dry run: no files written.");
    return;
  }

  await writeFile(SEED_PATH, `${JSON.stringify(normalized, null, 2)}\n`);
  console.log(`Wrote ${SEED_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
