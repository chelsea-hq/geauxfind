#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { topicFromDumpFilename, upsertTopicFromContent } from "../src/lib/dump-parser.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DUMPS_DIR = path.join(ROOT, "data", "fb-dumps");
const COMMUNITY_RECS_FILE = path.join(ROOT, "data", "community-recs.json");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, file: null, verbose: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dry-run") opts.dryRun = true;
    if (args[i] === "--verbose" || args[i] === "-v") opts.verbose = true;
    if (args[i] === "--file" && args[i + 1]) opts.file = args[++i];
  }
  return opts;
}

async function readExisting() {
  try {
    const raw = await fs.readFile(COMMUNITY_RECS_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      topics: Array.isArray(parsed?.topics) ? parsed.topics : [],
      businesses: Array.isArray(parsed?.businesses) ? parsed.businesses : [],
      ...parsed,
    };
  } catch {
    console.log("No existing community-recs.json found, starting fresh.");
    return { topics: [], businesses: [] };
  }
}

async function main() {
  const opts = parseArgs();
  let existing = await readExisting();

  let dumpFiles = (await fs.readdir(DUMPS_DIR)).filter((f) => f.endsWith(".txt")).sort();

  if (opts.file) {
    dumpFiles = dumpFiles.filter((f) => f === opts.file || f === path.basename(opts.file));
    if (!dumpFiles.length) {
      console.error(`No dump file matching --file ${opts.file}`);
      process.exitCode = 1;
      return;
    }
  }

  if (!dumpFiles.length) {
    console.log("No .txt files found in data/fb-dumps/");
    return;
  }

  console.log(`Processing ${dumpFiles.length} dump file(s)...\n`);

  for (const filename of dumpFiles) {
    const topicMeta = topicFromDumpFilename(filename);
    const filepath = path.join(DUMPS_DIR, filename);
    const content = await fs.readFile(filepath, "utf8");

    console.log(`${filename} → "${topicMeta.name}"`);

    const { output, topic, placesFound, absoluteMentions } = upsertTopicFromContent({
      existing,
      topicMeta,
      content,
      source: "facebook-group",
    });

    existing = output;

    console.log(`  → ${placesFound} businesses, ${absoluteMentions} total mentions`);
    if (opts.verbose) {
      topic.topBusinesses.slice(0, 10).forEach((b, i) =>
        console.log(`     ${String(i + 1).padStart(2)}. ${b.name.padEnd(35)} ${b.mentionCount}`)
      );
    }
    console.log();
  }

  if (opts.dryRun) {
    console.log("\n-- DRY RUN: not writing. Updated topics:");
    for (const t of existing.topics) {
      console.log(`  ${t.name} (${t.businessCount} businesses, ${t.totalMentions} mentions)`);
    }
    return;
  }

  await fs.writeFile(COMMUNITY_RECS_FILE, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  console.log(`✓ Wrote ${COMMUNITY_RECS_FILE.replace(`${ROOT}/`, "")}`);
  console.log(`  ${existing.topics.length} topics, ${existing.businesses.length} businesses total`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});
