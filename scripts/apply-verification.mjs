#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const VERIFICATION_PATH = path.join(ROOT, 'data', 'verification-results.json');
const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');
const GUIDES_PATH = path.join(ROOT, 'data', 'guides.json');
const DEALS_PATH = path.join(ROOT, 'data', 'deals.json');
const COMMUNITY_PATH = path.join(ROOT, 'data', 'community-recs.json');
const REMOVAL_LOG_PATH = path.join(ROOT, 'data', 'removal-log.json');

async function readJson(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inSet(set, value) {
  return value ? set.has(normalize(value)) : false;
}

function isClosedMatch(entity, sets) {
  return (
    inSet(sets.slug, entity.slug) ||
    inSet(sets.name, entity.name) ||
    inSet(sets.placeId, entity.google_place_id) ||
    inSet(sets.placeId, entity.place_id)
  );
}

async function main() {
  const verification = await readJson(VERIFICATION_PATH, []);
  const seedData = await readJson(SEED_PATH, []);
  const guides = await readJson(GUIDES_PATH, []);
  const deals = await readJson(DEALS_PATH, null);
  const community = await readJson(COMMUNITY_PATH, null);

  if (!Array.isArray(verification)) throw new Error('data/verification-results.json must be an array');
  if (!Array.isArray(seedData)) throw new Error('scripts/seed-data.json must be an array');

  const permanentlyClosed = verification.filter((x) => x.business_status === 'CLOSED_PERMANENTLY');
  const temporarilyClosed = verification.filter((x) => x.business_status === 'CLOSED_TEMPORARILY');

  const sets = {
    slug: new Set(permanentlyClosed.map((x) => normalize(x.slug))),
    name: new Set(permanentlyClosed.map((x) => normalize(x.name))),
    placeId: new Set(permanentlyClosed.map((x) => normalize(x.place_id))),
    tempSlug: new Set(temporarilyClosed.map((x) => normalize(x.slug))),
    tempName: new Set(temporarilyClosed.map((x) => normalize(x.name))),
    tempPlaceId: new Set(temporarilyClosed.map((x) => normalize(x.place_id))),
  };

  const removalLog = {
    generatedAt: new Date().toISOString(),
    permanentlyClosedCount: permanentlyClosed.length,
    temporarilyClosedCount: temporarilyClosed.length,
    removed: {
      seed: [],
      guides: [],
      deals: [],
      communityBusinesses: [],
      communityTopicTopBusinesses: [],
    },
    updatedTemporaryStatus: {
      seed: [],
    },
  };

  const nextSeed = [];
  for (const place of seedData) {
    if (isClosedMatch(place, sets)) {
      removalLog.removed.seed.push({ slug: place.slug, name: place.name });
      continue;
    }

    const tempMatch =
      inSet(sets.tempSlug, place.slug) ||
      inSet(sets.tempName, place.name) ||
      inSet(sets.tempPlaceId, place.google_place_id);
    if (tempMatch) {
      place.status = 'temporarily_closed';
      removalLog.updatedTemporaryStatus.seed.push({ slug: place.slug, name: place.name });
    }

    nextSeed.push(place);
  }

  let nextGuides = guides;
  if (Array.isArray(guides)) {
    nextGuides = guides.filter((g) => {
      const remove = isClosedMatch(g, sets);
      if (remove) removalLog.removed.guides.push({ slug: g.slug, name: g.name });
      return !remove;
    });
  }

  let nextDeals = deals;
  if (deals && typeof deals === 'object' && Array.isArray(deals.communityDeals)) {
    nextDeals = { ...deals };
    nextDeals.communityDeals = deals.communityDeals.filter((d) => {
      const remove = inSet(sets.name, d.restaurant) || inSet(sets.slug, d.slug);
      if (remove) {
        removalLog.removed.deals.push({ id: d.id, restaurant: d.restaurant });
      }
      return !remove;
    });
  }

  let nextCommunity = community;
  if (community && typeof community === 'object') {
    nextCommunity = { ...community };

    if (Array.isArray(community.businesses)) {
      nextCommunity.businesses = community.businesses.filter((b) => {
        const remove = isClosedMatch(b, sets);
        if (remove) removalLog.removed.communityBusinesses.push({ slug: b.slug, name: b.name });
        return !remove;
      });
    }

    if (Array.isArray(community.topics)) {
      nextCommunity.topics = community.topics.map((topic) => {
        if (!Array.isArray(topic.topBusinesses)) return topic;

        const filtered = topic.topBusinesses.filter((tb) => {
          const remove = inSet(sets.slug, tb.slug) || inSet(sets.name, tb.name);
          if (remove) {
            removalLog.removed.communityTopicTopBusinesses.push({
              topic: topic.slug || topic.name,
              slug: tb.slug,
              name: tb.name,
            });
          }
          return !remove;
        });

        return {
          ...topic,
          topBusinesses: filtered,
          businessCount: filtered.length,
        };
      });
    }

    if (Array.isArray(nextCommunity.businesses)) {
      nextCommunity.totalBusinesses = nextCommunity.businesses.length;
    }
  }

  await writeJson(SEED_PATH, nextSeed);
  if (Array.isArray(nextGuides)) await writeJson(GUIDES_PATH, nextGuides);
  if (nextDeals) await writeJson(DEALS_PATH, nextDeals);
  if (nextCommunity) await writeJson(COMMUNITY_PATH, nextCommunity);
  await writeJson(REMOVAL_LOG_PATH, removalLog);

  console.log('Verification application complete.');
  console.log(`Removed from seed-data: ${removalLog.removed.seed.length}`);
  console.log(`Removed from guides: ${removalLog.removed.guides.length}`);
  console.log(`Removed from deals: ${removalLog.removed.deals.length}`);
  console.log(`Removed from community businesses: ${removalLog.removed.communityBusinesses.length}`);
  console.log(
    `Removed from community topic topBusinesses: ${removalLog.removed.communityTopicTopBusinesses.length}`
  );
  console.log(`Temporarily closed statuses applied in seed-data: ${removalLog.updatedTemporaryStatus.seed.length}`);
  console.log(`Log saved to ${REMOVAL_LOG_PATH}`);
}

main().catch((err) => {
  console.error('apply-verification failed:', err.message);
  process.exit(1);
});
