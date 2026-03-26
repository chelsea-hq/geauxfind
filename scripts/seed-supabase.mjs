#!/usr/bin/env node
/**
 * Seed GeauxFind Supabase from local JSON files.
 * Maps seed-data.json fields → existing Supabase schema.
 * Uses REST API with service role key (no psql needed).
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// Config
const SUPABASE_URL = 'https://fgcdssgyeqvtmnhkxfkw.supabase.co';
const SRK = process.env.SUPABASE_SERVICE_ROLE_KEY 
  || readEnvKey('/Users/luna/.openclaw/workspace/.secrets.env', 'SUPABASE_GEAUXFIND_SERVICE_ROLE_KEY');

function readEnvKey(path, key) {
  const lines = readFileSync(path, 'utf8').split('\n');
  for (const line of lines) {
    if (line.startsWith(key + '=')) return line.slice(key.length + 1).trim();
  }
  throw new Error(`Key ${key} not found in ${path}`);
}

function loadJSON(path) {
  return JSON.parse(readFileSync(resolve(root, path), 'utf8'));
}

async function upsertBatch(table, rows, batchSize = 50) {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': SRK,
        'Authorization': `Bearer ${SRK}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify(batch)
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`  ERROR batch ${i}-${i+batch.length} for ${table}: ${res.status} ${err.slice(0,200)}`);
      // Try one at a time to find the bad row
      for (const row of batch) {
        const r2 = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            'apikey': SRK,
            'Authorization': `Bearer ${SRK}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates,return=minimal'
          },
          body: JSON.stringify([row])
        });
        if (r2.ok) {
          inserted++;
        } else {
          const e2 = await r2.text();
          console.error(`    SKIP ${row.slug || row.name}: ${e2.slice(0,150)}`);
        }
      }
    } else {
      inserted += batch.length;
    }
    process.stdout.write(`\r  ${table}: ${inserted}/${rows.length}`);
  }
  console.log(`\n  ✅ ${table}: ${inserted} rows`);
  return inserted;
}

// ============================================================
// PLACES: seed-data.json → places table
// ============================================================
async function seedPlaces() {
  console.log('\n📍 Seeding places...');
  const raw = loadJSON('scripts/seed-data.json');
  
  const rows = raw.map(p => ({
    slug: p.slug,
    name: p.name,
    type: p.category || 'other',  // DB uses 'type', seed uses 'category'
    cuisine: p.cuisine ? (Array.isArray(p.cuisine) ? p.cuisine : [p.cuisine]) : [],
    city: p.city || 'Lafayette',
    description: p.description || null,
    short_description: (p.description || '').slice(0, 200) || null,
    address: p.address || null,
    phone: p.phone || null,
    website: p.website || null,
    hours: p.hours || [],
    price_range: p.price ? p.price.length : null,  // '$' → 1, '$$' → 2, etc.
    google_rating: p.rating || null,
    google_review_count: (p.reviews || []).length,
    google_place_id: p.google_place_id || null,
    cover_photo: p.image || null,
    photos: (p.gallery || []).slice(0, 10),
    tags: [...(p.tags || []), ...(p.smartTags || [])],
    categories: p.category ? [p.category] : [],
    is_featured: p.featured || (p.smartTags || []).includes('Featured') || false,
    is_verified: false,
    source: 'google_places',
    community_review_count: 0
  }));

  return upsertBatch('places', rows);
}

// ============================================================
// EVENTS: events.json → events table
// ============================================================
async function seedEvents() {
  console.log('\n📅 Seeding events...');
  const raw = loadJSON('data/events.json');
  if (!raw.length) { console.log('  ⏭️ No events to seed'); return 0; }

  const rows = raw.map(e => ({
    slug: e.slug,
    name: e.title || e.name,
    type: e.category || 'other',
    description: e.description || null,
    start_date: e.date,
    end_date: e.endDate || e.date,
    time: e.time || null,
    venue: e.venue || null,
    address: e.address || null,
    city: e.city || 'Lafayette',
    free: e.free || false,
    price: e.price || null,
    cover_photo: e.image || null,
    source: e.source || null,
    source_url: e.link || null,
    tags: e.tags || [],
    is_featured: false,
    is_recurring: false
  }));

  return upsertBatch('events', rows);
}

// ============================================================
// CRAWFISH PRICES: crawfish-prices.json → crawfish_prices
// ============================================================
async function seedCrawfish() {
  console.log('\n🦞 Seeding crawfish prices...');
  const raw = loadJSON('data/crawfish-prices.json');
  if (!raw.length) { console.log('  ⏭️ No crawfish data'); return 0; }

  const rows = raw.map(c => ({
    slug: c.slug,
    name: c.name,
    address: c.address || null,
    city: c.city || 'Lafayette',
    boiled_price_per_lb: c.boiledPricePerLb || c.boiled_price_per_lb || null,
    boiled_price_text: c.boiledPriceText || c.boiled_price_text || null,
    live_price_per_lb: c.livePricePerLb || c.live_price_per_lb || null,
    live_price_text: c.livePriceText || c.live_price_text || null,
    boiled_size: c.boiledSize || c.boiled_size || null,
    live_size: c.liveSize || c.live_size || null,
    rating: c.rating || null,
    phone: c.phone || null,
    hours: c.hours || null,
    source: c.source || 'manual'
  }));

  return upsertBatch('crawfish_prices', rows);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🚀 GeauxFind Supabase Seeder');
  console.log(`   URL: ${SUPABASE_URL}`);
  
  const results = {};
  results.places = await seedPlaces();
  results.events = await seedEvents();
  results.crawfish = await seedCrawfish();

  console.log('\n📊 Summary:');
  for (const [k, v] of Object.entries(results)) {
    console.log(`   ${k}: ${v} rows`);
  }
  
  console.log('\n⚠️ Missing tables (need DB password to create):');
  console.log('   cajun_businesses, cajun_fluencers, community_recs');
  console.log('   whos_got_it, kids_eat_free, weekend_brunch, deals');
  console.log('   alert_subscriptions, business_claims, community_submissions');
}

main().catch(e => { console.error(e); process.exit(1); });
