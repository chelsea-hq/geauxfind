#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'new-discoveries.json');

const CENTER = '30.2241,-92.0198';
const RADIUS = 25000;
const TYPES = [
  'restaurant',
  'cafe',
  'bar',
  'bakery',
  'night_club',
  'tourist_attraction',
  'park',
  'museum',
  'art_gallery',
  'gym',
  'spa',
  'shopping_mall',
  'book_store',
  'movie_theater',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  throw new Error('Missing GOOGLE_PLACES_API_KEY / GOOGLE_API_KEY.');
}

function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildExistingIndices(seedData) {
  const byPlaceId = new Set();
  const byNameAddr = new Set();

  for (const item of seedData) {
    if (item.google_place_id) byPlaceId.add(item.google_place_id);
    const fingerprint = `${normalizeText(item.name)}|${normalizeText(item.address)}`;
    byNameAddr.add(fingerprint);
  }

  return { byPlaceId, byNameAddr };
}

function makeFingerprint(place) {
  return `${normalizeText(place.name)}|${normalizeText(place.vicinity || place.formatted_address)}`;
}

async function fetchNearbyByType(apiKey, type) {
  let nextPageToken = null;
  const all = [];

  do {
    const endpoint = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    endpoint.searchParams.set('location', CENTER);
    endpoint.searchParams.set('radius', String(RADIUS));
    endpoint.searchParams.set('type', type);
    endpoint.searchParams.set('key', apiKey);
    if (nextPageToken) endpoint.searchParams.set('pagetoken', nextPageToken);

    const res = await fetch(endpoint);
    if (!res.ok) throw new Error(`nearbysearch ${type} failed (${res.status})`);

    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    all.push(...results);

    nextPageToken = data.next_page_token || null;

    if (nextPageToken) {
      await sleep(2000);
    }
  } while (nextPageToken);

  return all;
}

async function main() {
  const apiKey = await loadApiKey();
  const seedData = await readJson(SEED_PATH, []);
  const { byPlaceId, byNameAddr } = buildExistingIndices(seedData);

  const discoveriesById = new Map();

  for (const type of TYPES) {
    console.log(`Searching type: ${type}`);
    const found = await fetchNearbyByType(apiKey, type);
    console.log(`  -> ${found.length} candidates`);

    for (const place of found) {
      const placeId = place.place_id;
      const fp = makeFingerprint(place);

      if (placeId && byPlaceId.has(placeId)) continue;
      if (byNameAddr.has(fp)) continue;
      if (placeId && discoveriesById.has(placeId)) continue;

      const record = {
        name: place.name,
        address: place.vicinity || place.formatted_address || null,
        place_id: place.place_id || null,
        types: place.types || [],
        rating: place.rating ?? null,
        review_count: place.user_ratings_total ?? null,
        price_level: place.price_level ?? null,
        business_status: place.business_status ?? 'OPERATIONAL',
        photos: place.photos || [],
        geometry: place.geometry || null,
        discovered_from_type: type,
      };

      discoveriesById.set(place.place_id || `${record.name}-${record.address}`, record);
    }

    await sleep(120);
  }

  const discoveries = Array.from(discoveriesById.values()).sort((a, b) => a.name.localeCompare(b.name));

  await writeJson(OUTPUT_PATH, {
    generatedAt: new Date().toISOString(),
    center: CENTER,
    radiusMeters: RADIUS,
    searchedTypes: TYPES,
    count: discoveries.length,
    discoveries,
  });

  console.log(`Found ${discoveries.length} new businesses not in GeauxFind.`);
  console.log(`Saved to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('discover-businesses failed:', err.message);
  process.exit(1);
});
