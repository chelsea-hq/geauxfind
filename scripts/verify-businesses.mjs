#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');
const VERIFICATION_PATH = path.join(ROOT, 'data', 'verification-results.json');
const CLOSED_PATH = path.join(ROOT, 'data', 'closed-businesses.json');
const PROGRESS_PATH = path.join(ROOT, 'data', 'verification-progress.json');

const BATCH_SIZE = 50;
const PER_REQUEST_DELAY_MS = 100;
const BETWEEN_BATCH_DELAY_MS = 5000;
const DEFAULT_CITY = 'Lafayette';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function parseArgs(argv) {
  const args = { limit: null, start: 0, force: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--limit') args.limit = Number(argv[++i]);
    else if (arg.startsWith('--limit=')) args.limit = Number(arg.split('=')[1]);
    else if (arg === '--start') args.start = Number(argv[++i]);
    else if (arg.startsWith('--start=')) args.start = Number(arg.split('=')[1]);
    else if (arg === '--force') args.force = true;
  }
  if (!Number.isFinite(args.start) || args.start < 0) args.start = 0;
  if (!Number.isFinite(args.limit) || args.limit <= 0) args.limit = null;
  return args;
}

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

async function loadApiKey() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  const secretsPath = path.resolve(ROOT, '..', '.secrets.env');
  try {
    const raw = await fs.readFile(secretsPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
      if (key === 'GOOGLE_PLACES_API_KEY' || key === 'GOOGLE_API_KEY') return value;
    }
  } catch {
    // ignore
  }

  throw new Error('Missing Google API key. Set GOOGLE_PLACES_API_KEY or GOOGLE_API_KEY (env or ../.secrets.env).');
}

function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreCandidate(seedPlace, candidate) {
  const seedName = normalizeText(seedPlace.name);
  const candidateName = normalizeText(candidate.name || candidate.displayName?.text);
  const seedAddress = normalizeText(seedPlace.address);
  const candidateAddress = normalizeText(candidate.formattedAddress || candidate.address);

  let score = 0;
  if (seedName && candidateName) {
    if (seedName === candidateName) score += 50;
    else if (candidateName.includes(seedName) || seedName.includes(candidateName)) score += 35;

    const seedTokens = new Set(seedName.split(' '));
    const candTokens = candidateName.split(' ');
    const overlap = candTokens.filter((t) => seedTokens.has(t)).length;
    score += overlap * 3;
  }

  if (seedAddress && candidateAddress) {
    if (seedAddress === candidateAddress) score += 30;
    else if (candidateAddress.includes(seedAddress) || seedAddress.includes(candidateAddress)) score += 20;
  }

  return score;
}

async function searchPlaceNewApi({ apiKey, query, seedPlace }) {
  const endpoint = 'https://places.googleapis.com/v1/places:searchText';
  const body = {
    textQuery: query,
    maxResultCount: 5,
    languageCode: 'en',
    regionCode: 'US',
    locationBias: {
      circle: {
        center: { latitude: 30.2241, longitude: -92.0198 },
        radius: 30000,
      },
    },
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.businessStatus',
        'places.rating',
        'places.userRatingCount',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`new-api-${res.status}`);
  }

  const data = await res.json();
  const places = Array.isArray(data.places) ? data.places : [];
  if (!places.length) return null;

  const best = places
    .map((p) => ({
      score: scoreCandidate(seedPlace, p),
      place_id: p.id,
      name: p.displayName?.text,
      formatted_address: p.formattedAddress,
      business_status: p.businessStatus || 'UNKNOWN',
      rating: p.rating ?? null,
      user_ratings_total: p.userRatingCount ?? null,
      source: 'new-api',
    }))
    .sort((a, b) => b.score - a.score)[0];

  return best;
}

async function searchPlaceLegacy({ apiKey, query, seedPlace }) {
  const endpoint = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
  endpoint.searchParams.set('input', query);
  endpoint.searchParams.set('inputtype', 'textquery');
  endpoint.searchParams.set(
    'fields',
    'business_status,name,place_id,formatted_address,rating,user_ratings_total'
  );
  endpoint.searchParams.set('key', apiKey);

  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`legacy-${res.status}`);

  const data = await res.json();
  const candidates = Array.isArray(data.candidates) ? data.candidates : [];
  if (!candidates.length) return null;

  const best = candidates
    .map((c) => ({
      ...c,
      score: scoreCandidate(seedPlace, c),
      source: 'legacy-api',
    }))
    .sort((a, b) => b.score - a.score)[0];

  return best;
}

function normalizeBusinessStatus(status) {
  const s = String(status || '').toUpperCase();
  if (s.includes('PERMANENT')) return 'CLOSED_PERMANENTLY';
  if (s.includes('TEMPORARILY')) return 'CLOSED_TEMPORARILY';
  if (s === 'CLOSED_TEMPORARILY') return s;
  if (s === 'CLOSED_PERMANENTLY') return s;
  if (s === 'OPERATIONAL') return s;
  if (!s || s === 'UNKNOWN') return 'OPERATIONAL';
  return s;
}

async function verifyOne(seedPlace, apiKey) {
  const city = seedPlace.city || DEFAULT_CITY;
  const query = `${seedPlace.name} ${city} LA`;

  let match = null;
  let error = null;

  try {
    match = await searchPlaceNewApi({ apiKey, query, seedPlace });
  } catch (err) {
    error = err.message;
  }

  if (!match) {
    try {
      match = await searchPlaceLegacy({ apiKey, query, seedPlace });
      error = null;
    } catch (err) {
      error = `${error || 'new-api-failed'}; ${err.message}`;
    }
  }

  const now = new Date().toISOString();

  if (!match) {
    return {
      slug: seedPlace.slug,
      name: seedPlace.name,
      query,
      verification_status: 'NOT_FOUND',
      business_status: null,
      google_rating: null,
      google_review_count: null,
      place_id: seedPlace.google_place_id || null,
      matched_name: null,
      matched_address: null,
      source: null,
      error,
      last_verified: now,
    };
  }

  return {
    slug: seedPlace.slug,
    name: seedPlace.name,
    query,
    verification_status: 'FOUND',
    business_status: normalizeBusinessStatus(match.business_status),
    google_rating: match.rating,
    google_review_count: match.user_ratings_total,
    place_id: match.place_id || seedPlace.google_place_id || null,
    matched_name: match.name || null,
    matched_address: match.formatted_address || null,
    source: match.source,
    error: null,
    last_verified: now,
  };
}

function applyResultToSeed(seedPlace, result) {
  seedPlace.last_verified = result.last_verified;

  if (result.place_id) seedPlace.google_place_id = result.place_id;
  if (result.google_rating != null) seedPlace.google_rating = result.google_rating;
  if (result.google_review_count != null) seedPlace.google_review_count = result.google_review_count;

  if (result.business_status === 'CLOSED_PERMANENTLY') {
    seedPlace.status = 'closed_permanently';
  } else if (result.business_status === 'CLOSED_TEMPORARILY') {
    seedPlace.status = 'temporarily_closed';
  } else if (seedPlace.status && ['closed_permanently', 'temporarily_closed'].includes(seedPlace.status)) {
    delete seedPlace.status;
  }
}

function summarize(results) {
  const summary = {
    total: results.length,
    OPERATIONAL: 0,
    CLOSED_PERMANENTLY: 0,
    CLOSED_TEMPORARILY: 0,
    NOT_FOUND: 0,
  };

  for (const r of results) {
    if (r.verification_status === 'NOT_FOUND') {
      summary.NOT_FOUND += 1;
      continue;
    }
    if (r.business_status === 'CLOSED_PERMANENTLY') summary.CLOSED_PERMANENTLY += 1;
    else if (r.business_status === 'CLOSED_TEMPORARILY') summary.CLOSED_TEMPORARILY += 1;
    else summary.OPERATIONAL += 1;
  }

  return summary;
}

async function persistState({ seedData, results }) {
  await writeJson(SEED_PATH, seedData);
  await writeJson(VERIFICATION_PATH, results);

  const closed = results.filter((r) => r.business_status === 'CLOSED_PERMANENTLY');
  await writeJson(CLOSED_PATH, closed);

  await writeJson(PROGRESS_PATH, {
    updatedAt: new Date().toISOString(),
    totalResults: results.length,
    summary: summarize(results),
  });
}

async function main() {
  const { limit, start, force } = parseArgs(process.argv.slice(2));

  const apiKey = await loadApiKey();
  const seedData = await readJson(SEED_PATH, []);
  if (!Array.isArray(seedData)) throw new Error('scripts/seed-data.json must be an array');

  const existingResults = force ? [] : await readJson(VERIFICATION_PATH, []);
  const resultsMap = new Map((Array.isArray(existingResults) ? existingResults : []).map((r) => [r.slug, r]));

  const end = limit ? Math.min(seedData.length, start + limit) : seedData.length;
  const scope = seedData.slice(start, end);

  const pending = scope.filter((place) => !resultsMap.has(place.slug));
  const totalBatches = Math.ceil(pending.length / BATCH_SIZE);

  console.log(`Loaded ${seedData.length} seed businesses.`);
  console.log(`Scope: index ${start}..${end - 1} (${scope.length} businesses). Pending: ${pending.length}.`);

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
    const batch = pending.slice(batchIndex * BATCH_SIZE, (batchIndex + 1) * BATCH_SIZE);
    console.log(`\nBatch ${batchIndex + 1}/${totalBatches} (${batch.length} businesses)`);

    for (let i = 0; i < batch.length; i += 1) {
      const place = batch[i];
      const result = await verifyOne(place, apiKey);
      resultsMap.set(place.slug, result);

      const seedIdx = seedData.findIndex((x) => x.slug === place.slug);
      if (seedIdx >= 0) applyResultToSeed(seedData[seedIdx], result);

      const statusLabel = result.verification_status === 'NOT_FOUND'
        ? 'NOT_FOUND'
        : result.business_status;
      console.log(`  [${i + 1}/${batch.length}] ${place.name} -> ${statusLabel}`);

      await sleep(PER_REQUEST_DELAY_MS);
    }

    const allResults = Array.from(resultsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    await persistState({ seedData, results: allResults });
    console.log(`Saved progress after batch ${batchIndex + 1}.`);

    if (batchIndex < totalBatches - 1) {
      console.log(`Waiting ${BETWEEN_BATCH_DELAY_MS / 1000}s before next batch...`);
      await sleep(BETWEEN_BATCH_DELAY_MS);
    }
  }

  const allResults = Array.from(resultsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  const summary = summarize(allResults);

  console.log('\nVerification complete.');
  console.log(`OPERATIONAL: ${summary.OPERATIONAL}`);
  console.log(`CLOSED_PERMANENTLY: ${summary.CLOSED_PERMANENTLY}`);
  console.log(`CLOSED_TEMPORARILY: ${summary.CLOSED_TEMPORARILY}`);
  console.log(`NOT_FOUND: ${summary.NOT_FOUND}`);
  console.log(`Results saved: ${VERIFICATION_PATH}`);
  console.log(`Closed list saved: ${CLOSED_PATH}`);
}

main().catch((err) => {
  console.error('verify-businesses failed:', err.message);
  process.exit(1);
});
