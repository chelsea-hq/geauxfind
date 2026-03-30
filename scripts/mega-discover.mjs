#!/usr/bin/env node
/**
 * GeauxFind Mega Discovery — Grid-search entire Acadiana region
 * 
 * Strategy:
 * 1. Break Acadiana into a grid of overlapping search zones
 * 2. Search each zone for many specific business types + cuisine keywords
 * 3. Also use Text Search for things Google Nearby misses
 * 4. Deduplicate against existing seed data
 * 5. Output net-new discoveries for review
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'mega-discoveries.json');
const PROGRESS_PATH = path.join(ROOT, 'data', 'mega-progress.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Search Grid ──────────────────────────────────────────────
// Acadiana region — Lafayette + surrounding cities
// Each point gets a 5km radius search (overlapping for coverage)
const SEARCH_ZONES = [
  // Lafayette core (dense grid)
  { name: 'Lafayette Downtown', lat: 30.2241, lng: -92.0198, radius: 5000 },
  { name: 'Lafayette North', lat: 30.2550, lng: -92.0198, radius: 5000 },
  { name: 'Lafayette South', lat: 30.1950, lng: -92.0198, radius: 5000 },
  { name: 'Lafayette East', lat: 30.2241, lng: -91.9800, radius: 5000 },
  { name: 'Lafayette West', lat: 30.2241, lng: -92.0600, radius: 5000 },
  { name: 'Lafayette NE', lat: 30.2550, lng: -91.9800, radius: 5000 },
  { name: 'Lafayette NW', lat: 30.2550, lng: -92.0600, radius: 5000 },
  { name: 'Lafayette SE', lat: 30.1950, lng: -91.9800, radius: 5000 },
  { name: 'Lafayette SW', lat: 30.1950, lng: -92.0600, radius: 5000 },
  
  // Oil Center / Freetown / River Ranch
  { name: 'Oil Center', lat: 30.2100, lng: -92.0300, radius: 3000 },
  { name: 'River Ranch', lat: 30.1900, lng: -92.0400, radius: 3000 },
  
  // Surrounding cities
  { name: 'Broussard', lat: 30.1490, lng: -91.9620, radius: 6000 },
  { name: 'Youngsville', lat: 30.0990, lng: -91.9920, radius: 6000 },
  { name: 'Scott', lat: 30.2360, lng: -92.0940, radius: 5000 },
  { name: 'Carencro', lat: 30.3170, lng: -92.0490, radius: 5000 },
  { name: 'Breaux Bridge', lat: 30.2730, lng: -91.8990, radius: 6000 },
  { name: 'Henderson', lat: 30.3140, lng: -91.7910, radius: 5000 },
  { name: 'Cecilia', lat: 30.3370, lng: -91.8530, radius: 4000 },
  { name: 'Rayne', lat: 30.2350, lng: -92.2680, radius: 5000 },
  { name: 'Crowley', lat: 30.2140, lng: -92.4440, radius: 6000 },
  { name: 'Opelousas', lat: 30.5330, lng: -92.0810, radius: 6000 },
  { name: 'Eunice', lat: 30.4940, lng: -92.4180, radius: 5000 },
  { name: 'New Iberia', lat: 30.0030, lng: -91.8190, radius: 7000 },
  { name: 'Abbeville', lat: 29.9750, lng: -92.1340, radius: 5000 },
  { name: 'Jeanerette', lat: 29.9110, lng: -91.6640, radius: 4000 },
  { name: 'St. Martinville', lat: 30.1250, lng: -91.8340, radius: 5000 },
  { name: 'Sunset', lat: 30.4090, lng: -92.0680, radius: 4000 },
  { name: 'Grand Coteau', lat: 30.4190, lng: -92.0490, radius: 3000 },
  { name: 'Church Point', lat: 30.4030, lng: -92.2190, radius: 4000 },
  { name: 'Arnaudville', lat: 30.3980, lng: -91.9310, radius: 3000 },
  { name: 'Maurice', lat: 30.1080, lng: -92.1240, radius: 4000 },
  { name: 'Duson', lat: 30.2360, lng: -92.1810, radius: 4000 },
  { name: 'Kaplan', lat: 30.0060, lng: -92.2840, radius: 4000 },
  { name: 'Delcambre', lat: 29.9470, lng: -91.9880, radius: 4000 },
  { name: 'Loreauville', lat: 30.0590, lng: -91.7370, radius: 3000 },
  { name: 'Cankton', lat: 30.3720, lng: -92.1010, radius: 3000 },
  { name: 'Milton', lat: 30.1030, lng: -92.0770, radius: 3000 },
  { name: 'Erath', lat: 29.9580, lng: -92.0360, radius: 3000 },
];

// ── Business Types ───────────────────────────────────────────
// Nearby Search types (Google taxonomy)
const NEARBY_TYPES = [
  'restaurant', 'cafe', 'bar', 'bakery', 'night_club', 'meal_delivery',
  'meal_takeaway', 'food', 'liquor_store', 'ice_cream_shop',
  'tourist_attraction', 'park', 'museum', 'art_gallery', 'amusement_park',
  'aquarium', 'bowling_alley', 'campground', 'zoo', 'stadium',
  'spa', 'beauty_salon', 'gym', 'shopping_mall', 'clothing_store',
  'book_store', 'florist', 'jewelry_store', 'shoe_store', 'pet_store',
  'movie_theater', 'library', 'church', 'lodging', 'rv_park',
];

// Text Search queries for things Nearby won't catch
const TEXT_QUERIES = [
  // Cuisine-specific
  'cajun restaurant', 'creole restaurant', 'boudin', 'crawfish boil',
  'po boy shop', 'seafood market', 'Vietnamese restaurant', 'pho restaurant',
  'Mexican restaurant', 'Chinese restaurant', 'sushi', 'Thai restaurant',
  'Indian restaurant', 'Italian restaurant', 'pizza', 'BBQ',
  'soul food', 'breakfast cafe', 'brunch', 'donut shop',
  'snowball stand', 'daiquiri shop', 'frozen custard',
  
  // Entertainment & culture
  'live music venue', 'dance hall', 'fais do do', 'zydeco',
  'casino', 'escape room', 'trampoline park', 'arcade',
  'mini golf', 'go kart', 'paintball', 'laser tag',
  'drive in theater', 'comedy club',
  
  // Outdoors
  'kayak rental', 'fishing charter', 'swamp tour', 'airboat tour',
  'hiking trail', 'boat launch', 'nature preserve', 'botanical garden',
  'disc golf', 'skate park', 'dog park',
  
  // Local finds
  'antique shop', 'thrift store', 'flea market', 'farmers market',
  'craft brewery', 'winery', 'distillery', 'cigar lounge',
  'tattoo shop', 'record shop', 'art studio',
  'Cajun music', 'Cajun culture', 'plantation tour',
  
  // Markets & food shops
  'specialty food store', 'meat market', 'grocery store local',
  'spice shop', 'hot sauce shop', 'praline shop',
];

// ── Helpers ──────────────────────────────────────────────────

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
  return String(str || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function buildExistingIndices(seedData) {
  const byPlaceId = new Set();
  const byName = new Set();
  for (const item of seedData) {
    if (item.google_place_id) byPlaceId.add(item.google_place_id);
    byName.add(normalizeText(item.name));
  }
  return { byPlaceId, byName };
}

// ── API Calls ────────────────────────────────────────────────

let apiCallCount = 0;

async function fetchNearby(apiKey, lat, lng, radius, type) {
  let nextPageToken = null;
  const all = [];
  
  do {
    const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(radius));
    url.searchParams.set('type', type);
    url.searchParams.set('key', apiKey);
    if (nextPageToken) url.searchParams.set('pagetoken', nextPageToken);
    
    const res = await fetch(url);
    apiCallCount++;
    if (!res.ok) { console.error(`  API error ${res.status}`); break; }
    
    const data = await res.json();
    if (data.status === 'REQUEST_DENIED') { console.error(`  REQUEST_DENIED: ${data.error_message}`); break; }
    
    const results = data.results || [];
    all.push(...results);
    nextPageToken = data.next_page_token || null;
    
    if (nextPageToken) await sleep(2100); // Google needs ~2s before pagetoken works
  } while (nextPageToken);
  
  return all;
}

async function fetchTextSearch(apiKey, query, lat, lng, radius) {
  let nextPageToken = null;
  const all = [];
  
  do {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', `${query} near ${lat},${lng}`);
    url.searchParams.set('location', `${lat},${lng}`);
    url.searchParams.set('radius', String(radius));
    url.searchParams.set('key', apiKey);
    if (nextPageToken) url.searchParams.set('pagetoken', nextPageToken);
    
    const res = await fetch(url);
    apiCallCount++;
    if (!res.ok) break;
    
    const data = await res.json();
    if (data.status === 'REQUEST_DENIED') break;
    
    const results = data.results || [];
    all.push(...results);
    nextPageToken = data.next_page_token || null;
    
    if (nextPageToken) await sleep(2100);
  } while (nextPageToken);
  
  return all;
}

// ── Discovery Categories ─────────────────────────────────────

function categorize(place) {
  const types = (place.types || []).map(t => t.toLowerCase());
  const name = (place.name || '').toLowerCase();
  
  // Food & drink
  if (types.some(t => ['restaurant', 'cafe', 'bakery', 'meal_delivery', 'meal_takeaway', 'food'].includes(t)) ||
      name.match(/restaurant|cafe|diner|grill|bistro|kitchen|eatery|bakery|donut|po.?boy|boudin|crawfish/)) {
    return 'food';
  }
  if (types.includes('bar') || types.includes('night_club') || types.includes('liquor_store') ||
      name.match(/bar|pub|lounge|tavern|brewery|daiquiri|taproom|saloon/)) {
    return 'music'; // bars/nightlife go in music category
  }
  
  // Outdoors
  if (types.some(t => ['park', 'campground', 'rv_park'].includes(t)) ||
      name.match(/park|trail|kayak|canoe|swamp|bayou|lake|boat launch|nature|preserve/)) {
    return 'outdoors';
  }
  
  // Music & entertainment
  if (types.some(t => ['movie_theater', 'bowling_alley', 'amusement_park', 'stadium'].includes(t)) ||
      name.match(/music|theater|theatre|cinema|arcade|escape room|entertainment|dance hall|zydeco/)) {
    return 'music';
  }
  
  // Shopping
  if (types.some(t => ['shopping_mall', 'clothing_store', 'book_store', 'jewelry_store', 'shoe_store', 'pet_store', 'florist'].includes(t)) ||
      name.match(/market|shop|store|boutique|gallery|antique|thrift|flea/)) {
    return 'shopping';
  }
  
  // Cultural / finds
  if (types.some(t => ['museum', 'art_gallery', 'church', 'tourist_attraction', 'library'].includes(t)) ||
      name.match(/museum|gallery|church|cathedral|historic|monument|statue|plantation|cultural/)) {
    return 'finds';
  }
  
  // Default
  return 'finds';
}

function isDiscoveryRelevant(place) {
  const types = (place.types || []).map(t => t.toLowerCase());
  const name = (place.name || '').toLowerCase();
  
  // Exclude service businesses
  const excludeTypes = [
    'dentist', 'doctor', 'hospital', 'pharmacy', 'veterinary_care',
    'insurance_agency', 'lawyer', 'accounting', 'real_estate_agency',
    'car_repair', 'car_dealer', 'car_wash', 'gas_station',
    'bank', 'atm', 'post_office', 'local_government_office',
    'funeral_home', 'storage', 'locksmith', 'plumber', 'electrician',
    'roofing_contractor', 'moving_company', 'laundry',
    'school', 'university', 'primary_school', 'secondary_school',
  ];
  
  if (types.some(t => excludeTypes.includes(t))) return false;
  
  const excludeNames = [
    'insurance', 'dental', 'clinic', 'hospital', 'urgent care',
    'auto repair', 'tire', 'oil change', 'transmission',
    'storage', 'funeral', 'tax', 'staffing', 'bail bond',
    'check cashing', 'title loan', 'pawn',
  ];
  
  if (excludeNames.some(kw => name.includes(kw))) return false;
  
  // Must be operational
  if (place.business_status === 'CLOSED_PERMANENTLY') return false;
  
  return true;
}

// ── City Detection ───────────────────────────────────────────

function detectCity(place, zone) {
  const addr = (place.vicinity || place.formatted_address || '').toLowerCase();
  
  const cities = [
    'broussard', 'youngsville', 'scott', 'carencro', 'breaux bridge',
    'henderson', 'cecilia', 'rayne', 'crowley', 'opelousas', 'eunice',
    'new iberia', 'abbeville', 'jeanerette', 'st. martinville',
    'saint martinville', 'sunset', 'grand coteau', 'church point',
    'arnaudville', 'maurice', 'duson', 'kaplan', 'delcambre',
    'loreauville', 'cankton', 'milton', 'erath', 'lafayette',
  ];
  
  for (const city of cities) {
    if (addr.includes(city)) return city.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  }
  
  // Fall back to zone name
  return zone.name;
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now();
  const apiKey = await loadApiKey();
  const seedData = await readJson(SEED_PATH, []);
  const { byPlaceId, byName } = buildExistingIndices(seedData);
  const progress = await readJson(PROGRESS_PATH, { completedZones: [], completedTextQueries: [] });
  
  console.log(`Loaded ${seedData.length} existing businesses.`);
  console.log(`Starting mega-discovery across ${SEARCH_ZONES.length} zones...`);
  console.log(`Types: ${NEARBY_TYPES.length} | Text queries: ${TEXT_QUERIES.length}`);
  console.log('');
  
  const discoveriesById = new Map();
  
  function addDiscovery(place, source, zone) {
    const placeId = place.place_id;
    if (!placeId) return;
    if (byPlaceId.has(placeId)) return;
    if (discoveriesById.has(placeId)) return;
    
    // Fuzzy name match
    const normName = normalizeText(place.name);
    if (byName.has(normName)) return;
    
    if (!isDiscoveryRelevant(place)) return;
    
    discoveriesById.set(placeId, {
      name: place.name,
      address: place.vicinity || place.formatted_address || null,
      city: detectCity(place, zone),
      place_id: placeId,
      types: place.types || [],
      category: categorize(place),
      rating: place.rating ?? null,
      review_count: place.user_ratings_total ?? null,
      price_level: place.price_level ?? null,
      business_status: place.business_status ?? 'OPERATIONAL',
      photo_ref: place.photos?.[0]?.photo_reference || null,
      source,
      zone: zone.name,
    });
  }
  
  // ── Phase 1A: Nearby Search (grid × types) ────────────────
  // Optimized: only search food/entertainment types in each zone
  // Use a subset of high-value types per zone (not all 35 × all 37 zones)
  
  const HIGH_VALUE_TYPES = [
    'restaurant', 'cafe', 'bar', 'bakery', 'night_club',
    'tourist_attraction', 'park', 'museum', 'art_gallery',
    'shopping_mall', 'book_store', 'movie_theater',
    'bowling_alley', 'spa', 'campground', 'lodging',
  ];
  
  // Core Lafayette zones get ALL types, outer zones get HIGH_VALUE only
  const coreZones = SEARCH_ZONES.filter(z => z.name.startsWith('Lafayette') || z.name === 'Oil Center' || z.name === 'River Ranch');
  const outerZones = SEARCH_ZONES.filter(z => !z.name.startsWith('Lafayette') && z.name !== 'Oil Center' && z.name !== 'River Ranch');
  
  console.log(`=== PHASE 1A: Nearby Search ===`);
  console.log(`Core zones (${coreZones.length}) × ${NEARBY_TYPES.length} types = ${coreZones.length * NEARBY_TYPES.length} searches`);
  console.log(`Outer zones (${outerZones.length}) × ${HIGH_VALUE_TYPES.length} types = ${outerZones.length * HIGH_VALUE_TYPES.length} searches`);
  console.log('');
  
  // Core zones — full type list
  for (const zone of coreZones) {
    if (progress.completedZones.includes(`nearby:${zone.name}:full`)) {
      console.log(`  [skip] ${zone.name} (already completed)`);
      continue;
    }
    
    console.log(`📍 ${zone.name} (${zone.lat}, ${zone.lng}) — full types`);
    let zoneFound = 0;
    
    for (const type of NEARBY_TYPES) {
      const results = await fetchNearby(apiKey, zone.lat, zone.lng, zone.radius, type);
      for (const place of results) addDiscovery(place, `nearby:${type}`, zone);
      zoneFound += results.length;
      await sleep(100);
    }
    
    console.log(`  → ${zoneFound} candidates, ${discoveriesById.size} unique new so far`);
    progress.completedZones.push(`nearby:${zone.name}:full`);
    await writeJson(PROGRESS_PATH, progress);
  }
  
  // Outer zones — high-value types only  
  for (const zone of outerZones) {
    if (progress.completedZones.includes(`nearby:${zone.name}:hv`)) {
      console.log(`  [skip] ${zone.name} (already completed)`);
      continue;
    }
    
    console.log(`📍 ${zone.name} (${zone.lat}, ${zone.lng}) — high-value types`);
    let zoneFound = 0;
    
    for (const type of HIGH_VALUE_TYPES) {
      const results = await fetchNearby(apiKey, zone.lat, zone.lng, zone.radius, type);
      for (const place of results) addDiscovery(place, `nearby:${type}`, zone);
      zoneFound += results.length;
      await sleep(100);
    }
    
    console.log(`  → ${zoneFound} candidates, ${discoveriesById.size} unique new so far`);
    progress.completedZones.push(`nearby:${zone.name}:hv`);
    await writeJson(PROGRESS_PATH, progress);
  }
  
  // ── Phase 1B: Text Search (cuisine + activity queries) ────
  console.log('');
  console.log(`=== PHASE 1B: Text Search ===`);
  console.log(`${TEXT_QUERIES.length} queries × Lafayette center`);
  console.log('');
  
  // Text search from Lafayette center with large radius
  const TEXT_CENTER = { lat: 30.2241, lng: -92.0198 };
  const TEXT_RADIUS = 40000; // 40km covers entire Acadiana
  
  for (const query of TEXT_QUERIES) {
    if (progress.completedTextQueries.includes(query)) {
      continue;
    }
    
    const results = await fetchTextSearch(apiKey, query, TEXT_CENTER.lat, TEXT_CENTER.lng, TEXT_RADIUS);
    for (const place of results) addDiscovery(place, `text:${query}`, { name: 'Text Search' });
    
    if (results.length > 0) {
      console.log(`  "${query}" → ${results.length} results`);
    }
    
    progress.completedTextQueries.push(query);
    
    // Save progress every 10 queries
    if (progress.completedTextQueries.length % 10 === 0) {
      await writeJson(PROGRESS_PATH, progress);
    }
    
    await sleep(200);
  }
  
  // ── Results ────────────────────────────────────────────────
  const discoveries = Array.from(discoveriesById.values()).sort((a, b) => a.name.localeCompare(b.name));
  
  // Stats
  const byCat = {};
  const byCity = {};
  for (const d of discoveries) {
    byCat[d.category] = (byCat[d.category] || 0) + 1;
    byCity[d.city] = (byCity[d.city] || 0) + 1;
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════');
  console.log(`MEGA-DISCOVERY COMPLETE`);
  console.log(`═══════════════════════════════════════════`);
  console.log(`Total API calls: ${apiCallCount}`);
  console.log(`Time: ${Math.round((Date.now() - startTime) / 1000)}s`);
  console.log(`Existing businesses: ${seedData.length}`);
  console.log(`New discoveries: ${discoveries.length}`);
  console.log('');
  console.log('By category:');
  for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }
  console.log('');
  console.log('By city (top 15):');
  for (const [city, count] of Object.entries(byCity).sort((a, b) => b[1] - a[1]).slice(0, 15)) {
    console.log(`  ${city}: ${count}`);
  }
  
  await writeJson(OUTPUT_PATH, {
    generatedAt: new Date().toISOString(),
    searchZones: SEARCH_ZONES.length,
    nearbyTypes: NEARBY_TYPES.length,
    textQueries: TEXT_QUERIES.length,
    totalApiCalls: apiCallCount,
    existingCount: seedData.length,
    newDiscoveries: discoveries.length,
    byCategory: byCat,
    byCity,
    discoveries,
  });
  
  console.log('');
  console.log(`Results saved: ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('mega-discover failed:', err.message);
  process.exit(1);
});
