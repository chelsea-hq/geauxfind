#!/usr/bin/env node
/**
 * Merge mega-discoveries into seed-data.json
 * 
 * Takes the mega-discoveries.json output and:
 * 1. Filters to OPERATIONAL only
 * 2. Enriches with Google Place Details (phone, website, hours)
 * 3. Generates slugs
 * 4. Assigns neighborhoods
 * 5. Merges into seed-data.json
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');
const MEGA_PATH = path.join(ROOT, 'data', 'mega-discoveries.json');
const BACKUP_PATH = path.join(ROOT, 'data', `seed-backup-${new Date().toISOString().slice(0, 10)}.json`);

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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
  throw new Error('Missing API key');
}

function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function detectNeighborhood(city, address) {
  const addr = (address || '').toLowerCase();
  const c = (city || '').toLowerCase();
  
  const neighborhoods = {
    'downtown lafayette': ['jefferson', 'main st', 'vermilion', 'downtown'],
    'oil center': ['oil center', 'coolidge', 'heymann'],
    'river ranch': ['river ranch', 'camellia'],
    'freetown': ['freetown', 'gordon'],
    'north lafayette': ['north university', 'evangeline', 'carencro'],
    'south lafayette': ['ambassador', 'kaliste saloom', 'johnston'],
    'broussard': ['broussard'],
    'youngsville': ['youngsville'],
    'scott': ['scott'],
    'breaux bridge': ['breaux bridge'],
    'opelousas': ['opelousas'],
    'new iberia': ['new iberia'],
    'eunice': ['eunice'],
    'crowley': ['crowley'],
    'abbeville': ['abbeville'],
    'rayne': ['rayne'],
    'henderson': ['henderson'],
    'st. martinville': ['st. martinville', 'saint martinville'],
    'carencro': ['carencro'],
  };
  
  for (const [hood, keywords] of Object.entries(neighborhoods)) {
    for (const kw of keywords) {
      if (addr.includes(kw) || c.includes(kw)) return hood;
    }
  }
  
  return city || 'Lafayette';
}

async function getPlaceDetails(apiKey, placeId) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'name,formatted_phone_number,website,opening_hours,editorial_summary,photos,url');
  url.searchParams.set('key', apiKey);
  
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.result || null;
}

async function main() {
  const limit = parseInt(process.argv[2] || '0', 10); // 0 = all
  const skipDetails = process.argv.includes('--skip-details');
  
  const apiKey = await loadApiKey();
  const seedData = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'));
  const megaData = JSON.parse(await fs.readFile(MEGA_PATH, 'utf8'));
  
  console.log(`Existing: ${seedData.length} businesses`);
  console.log(`Discoveries: ${megaData.discoveries.length} new`);
  
  // Backup current seed
  await fs.writeFile(BACKUP_PATH, JSON.stringify(seedData, null, 2));
  console.log(`Backed up to ${BACKUP_PATH}`);
  
  // Filter operational only
  let discoveries = megaData.discoveries.filter(d => 
    d.business_status === 'OPERATIONAL' || !d.business_status
  );
  
  if (limit > 0) {
    discoveries = discoveries.slice(0, limit);
    console.log(`Limited to ${limit} businesses for this run`);
  }
  
  // Existing slugs to avoid collisions
  const existingSlugs = new Set(seedData.map(p => p.slug));
  
  const newEntries = [];
  let detailCalls = 0;
  
  for (let i = 0; i < discoveries.length; i++) {
    const d = discoveries[i];
    
    let slug = makeSlug(d.name);
    let suffix = 2;
    while (existingSlugs.has(slug)) {
      slug = `${makeSlug(d.name)}-${suffix}`;
      suffix++;
    }
    existingSlugs.add(slug);
    
    const entry = {
      name: d.name,
      slug,
      category: d.category || 'finds',
      city: d.city || 'Lafayette',
      address: d.address || '',
      neighborhood: detectNeighborhood(d.city, d.address),
      description: '',
      rating: d.rating,
      reviews: d.review_count || 0,
      google_rating: d.rating,
      google_review_count: d.review_count || 0,
      google_place_id: d.place_id,
      google_maps_url: d.place_id ? `https://www.google.com/maps/place/?q=place_id:${d.place_id}` : null,
      price_level: d.price_level,
      price: d.price_level ? '$'.repeat(d.price_level) : null,
      tags: (d.types || []).filter(t => !t.includes('point_of_interest') && !t.includes('establishment')).slice(0, 5),
      smartTags: [],
      phone: null,
      website: null,
      hours: null,
      image: '/images/placeholder-cajun.jpg',
      photo_references: d.photo_ref ? [d.photo_ref] : [],
      featured: false,
      status: 'active',
      last_verified: new Date().toISOString().slice(0, 10),
    };
    
    // Get details from Google (phone, website, hours, description)
    if (!skipDetails && d.place_id) {
      try {
        const details = await getPlaceDetails(apiKey, d.place_id);
        if (details) {
          entry.phone = details.formatted_phone_number || null;
          entry.website = details.website || null;
          entry.description = details.editorial_summary?.overview || '';
          entry.google_maps_url = details.url || entry.google_maps_url;
          
          if (details.opening_hours?.weekday_text) {
            entry.hours = details.opening_hours.weekday_text.join('\n');
          }
          
          // Get first photo reference
          if (details.photos?.length > 0 && !entry.photo_references.length) {
            entry.photo_references = details.photos.slice(0, 3).map(p => p.photo_reference);
          }
        }
        detailCalls++;
        
        // Progress
        if ((i + 1) % 25 === 0) {
          console.log(`  [${i + 1}/${discoveries.length}] ${entry.name} — ${detailCalls} detail calls`);
        }
        
        await sleep(100); // Rate limit
      } catch (err) {
        console.log(`  Details error for ${d.name}: ${err.message}`);
      }
    }
    
    newEntries.push(entry);
  }
  
  // Merge
  const merged = [...seedData, ...newEntries];
  await fs.writeFile(SEED_PATH, JSON.stringify(merged, null, 2) + '\n');
  
  console.log(`\n═══════════════════════════════════════`);
  console.log(`MERGE COMPLETE`);
  console.log(`═══════════════════════════════════════`);
  console.log(`Previous: ${seedData.length}`);
  console.log(`Added: ${newEntries.length}`);
  console.log(`New total: ${merged.length}`);
  console.log(`Detail API calls: ${detailCalls}`);
  console.log(`Saved: ${SEED_PATH}`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
