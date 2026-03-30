#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');

async function main() {
  const raw = await fs.readFile(SEED_PATH, 'utf8');
  const seedData = JSON.parse(raw);
  const now = Date.now();

  const buckets = {
    gt7: 0,
    gt14: 0,
    gt30: 0,
    gt60: 0,
    neverVerified: 0,
  };

  const stale = [];

  for (const place of seedData) {
    if (!place.last_verified) {
      buckets.neverVerified += 1;
      buckets.gt7 += 1;
      buckets.gt14 += 1;
      buckets.gt30 += 1;
      buckets.gt60 += 1;
      stale.push({ slug: place.slug, name: place.name, reason: 'never_verified' });
      continue;
    }

    const ts = Date.parse(place.last_verified);
    if (Number.isNaN(ts)) {
      buckets.neverVerified += 1;
      stale.push({ slug: place.slug, name: place.name, reason: 'invalid_last_verified' });
      continue;
    }

    const ageDays = (now - ts) / (1000 * 60 * 60 * 24);

    if (ageDays > 7) buckets.gt7 += 1;
    if (ageDays > 14) buckets.gt14 += 1;
    if (ageDays > 30) {
      buckets.gt30 += 1;
      stale.push({
        slug: place.slug,
        name: place.name,
        last_verified: place.last_verified,
        age_days: Number(ageDays.toFixed(1)),
      });
    }
    if (ageDays > 60) buckets.gt60 += 1;
  }

  stale.sort((a, b) => (b.age_days || 99999) - (a.age_days || 99999));

  console.log('Data Freshness Report');
  console.log('=====================');
  console.log(`Total businesses: ${seedData.length}`);
  console.log(`Not verified in >7 days:  ${buckets.gt7}`);
  console.log(`Not verified in >14 days: ${buckets.gt14}`);
  console.log(`Not verified in >30 days: ${buckets.gt30}`);
  console.log(`Not verified in >60 days: ${buckets.gt60}`);
  console.log(`Never/invalid verified timestamp: ${buckets.neverVerified}`);
  console.log('');
  console.log(`Stale businesses (>30 days): ${stale.length}`);

  if (stale.length) {
    console.log('\nTop stale entries:');
    for (const item of stale.slice(0, 30)) {
      const age = item.age_days != null ? `${item.age_days}d` : item.reason;
      console.log(`- ${item.name} (${item.slug}) :: ${age}`);
    }
  }
}

main().catch((err) => {
  console.error('freshness-check failed:', err.message);
  process.exit(1);
});
