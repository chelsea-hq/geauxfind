#!/usr/bin/env node
// Writes data/last-updated.json and injects a lastUpdated field into
// scraped data files when they're re-written. Safe to run locally or in CI.

import { readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(__filename), "..");
const dataDir = path.join(projectRoot, "data");

const TRACKED = [
  "events.json",
  "whats-new.json",
  "crawfish-prices.json",
  "crawfish-season.json",
  "live-music.json",
  "kids-eat-free.json",
  "weekend-brunch.json",
  "whos-got-it.json",
  "community-recs.json",
  "cajun-connection.json",
];

async function fileMtimeISO(file) {
  try {
    const s = await stat(path.join(dataDir, file));
    return s.mtime.toISOString();
  } catch {
    return null;
  }
}

async function main() {
  const stamps = {};
  for (const file of TRACKED) {
    stamps[file] = await fileMtimeISO(file);
  }
  const payload = {
    generatedAt: new Date().toISOString(),
    files: stamps,
  };
  await writeFile(
    path.join(dataDir, "last-updated.json"),
    JSON.stringify(payload, null, 2) + "\n",
    "utf8",
  );
  console.log("stamped", path.join(dataDir, "last-updated.json"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
