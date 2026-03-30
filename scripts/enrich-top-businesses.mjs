#!/usr/bin/env node
/**
 * Enrich top businesses with Google Place Details
 * Gets phone, website, hours, description for businesses with 10+ reviews
 * Rate-limited to stay within API budget
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');
const PROGRESS_PATH = path.join(ROOT, 'data', 'enrich-progress.json');

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

async function getDetails(apiKey, placeId) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', placeId);
  url.searchParams.set('fields', 'formatted_phone_number,website,opening_hours,editorial_summary,url,photos');
  url.searchParams.set('key', apiKey);
  
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.result || null;
}

async function main() {
  const apiKey = await loadApiKey();
  const seedData = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'));
  
  let progress;
  try {
    progress = JSON.parse(await fs.readFile(PROGRESS_PATH, 'utf8'));
  } catch {
    progress = { enriched: [] };
  }
  
  const enrichedSet = new Set(progress.enriched);
  
  // Find businesses needing enrichment (10+ reviews, has place_id, not already enriched)
  const toEnrich = seedData.filter(p => 
    p.google_place_id && 
    (p.google_review_count || p.reviews || 0) >= 10 &&
    !p.phone && !p.website &&
    !enrichedSet.has(p.google_place_id)
  );
  
  console.log(`Total businesses: ${seedData.length}`);
  console.log(`Need enrichment: ${toEnrich.length}`);
  console.log(`Already enriched: ${enrichedSet.size}`);
  
  let enrichCount = 0;
  const batchSize = 50;
  
  for (let i = 0; i < toEnrich.length; i++) {
    const biz = toEnrich[i];
    const idx = seedData.findIndex(p => p.google_place_id === biz.google_place_id);
    
    try {
      const details = await getDetails(apiKey, biz.google_place_id);
      if (details) {
        if (details.formatted_phone_number) seedData[idx].phone = details.formatted_phone_number;
        if (details.website) seedData[idx].website = details.website;
        if (details.editorial_summary?.overview) seedData[idx].description = details.editorial_summary.overview;
        if (details.url) seedData[idx].google_maps_url = details.url;
        if (details.opening_hours?.weekday_text) {
          seedData[idx].hours = details.opening_hours.weekday_text.join('\n');
        }
        if (details.photos?.length && (!seedData[idx].photo_references || seedData[idx].photo_references.length === 0)) {
          seedData[idx].photo_references = details.photos.slice(0, 3).map(p => p.photo_reference);
        }
      }
      
      enrichedSet.add(biz.google_place_id);
      enrichCount++;
      
      if (enrichCount % 25 === 0) {
        console.log(`  [${enrichCount}/${toEnrich.length}] ${biz.name}`);
      }
      
      // Save progress every batch
      if (enrichCount % batchSize === 0) {
        progress.enriched = Array.from(enrichedSet);
        await fs.writeFile(PROGRESS_PATH, JSON.stringify(progress));
        await fs.writeFile(SEED_PATH, JSON.stringify(seedData, null, 2) + '\n');
        console.log(`  Saved progress at ${enrichCount}`);
      }
      
      await sleep(80); // ~12 calls/sec, well within limits
    } catch (err) {
      console.log(`  Error: ${biz.name}: ${err.message}`);
    }
  }
  
  // Final save
  progress.enriched = Array.from(enrichedSet);
  await fs.writeFile(PROGRESS_PATH, JSON.stringify(progress));
  await fs.writeFile(SEED_PATH, JSON.stringify(seedData, null, 2) + '\n');
  
  console.log(`\nEnrichment complete: ${enrichCount} businesses updated.`);
  console.log(`API calls: ${enrichCount} (Place Details)`);
  console.log(`Estimated cost: ~$${(enrichCount * 0.005).toFixed(2)}`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
