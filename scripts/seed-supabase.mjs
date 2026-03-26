#!/usr/bin/env node
/**
 * seed-supabase.mjs
 *
 * Seeds GeauxFind's Supabase tables from the existing JSON data files.
 * Uses the service-role key to bypass RLS.
 *
 * Usage:
 *   node scripts/seed-supabase.mjs
 *   node scripts/seed-supabase.mjs --only places
 *   node scripts/seed-supabase.mjs --only events
 *   node scripts/seed-supabase.mjs --only crawfish
 *   node scripts/seed-supabase.mjs --only music
 *   node scripts/seed-supabase.mjs --only best_of
 *
 * Tables seeded:
 *   places           ← cajun-connection.json + cajun-connection-expansion.json
 *   events           ← events.json
 *   crawfish_prices  ← crawfish-prices.json
 *   live_music_venues← live-music.json
 *   best_of_lists    ← community-recs.json + whos-got-it.json
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// ─── Setup ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')

function loadJson(relPath) {
  const full = path.join(ROOT, relPath)
  try {
    return JSON.parse(readFileSync(full, 'utf8'))
  } catch (err) {
    console.warn(`  ⚠  Could not load ${relPath}: ${err.message}`)
    return null
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error(`
❌  Missing environment variables.
    Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.

    Example:
      NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \\
      SUPABASE_SERVICE_ROLE_KEY=eyJ... \\
      node scripts/seed-supabase.mjs
`)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Slugify a name (fallback if the source data doesn't provide a slug). */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Upsert rows in batches.  Returns { inserted, updated, errors }.
 */
async function upsertBatch(table, rows, conflictColumn = 'slug') {
  if (!rows.length) return { inserted: 0, updated: 0, errors: [] }

  const BATCH = 100
  let inserted = 0
  const errors = []

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH)
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: conflictColumn, ignoreDuplicates: false })

    if (error) {
      errors.push({ chunk: i / BATCH, message: error.message })
      console.error(`  ✗ batch ${i / BATCH} error:`, error.message)
    } else {
      inserted += chunk.length
    }
  }

  return { inserted, errors }
}

// ─── Seeders ─────────────────────────────────────────────────────────────────

async function seedPlaces() {
  console.log('\n📍 Seeding places …')

  const cajunConn      = loadJson('data/cajun-connection.json')
  const cajunConnExp   = loadJson('data/cajun-connection-expansion.json')

  const rows = []

  // cajun-connection.json → { businesses: [...] }
  if (cajunConn?.businesses) {
    for (const b of cajunConn.businesses) {
      rows.push(businessToPlace(b, 'cajun_connection'))
    }
  }

  // cajun-connection-expansion.json → { newBusinesses: [...] }
  if (cajunConnExp?.newBusinesses) {
    for (const b of cajunConnExp.newBusinesses) {
      rows.push(businessToPlace(b, 'cajun_connection'))
    }
  }

  // Deduplicate by slug (last write wins — expansion data is newer)
  const bySlug = new Map()
  for (const r of rows) bySlug.set(r.slug, r)

  const { inserted, errors } = await upsertBatch('places', [...bySlug.values()])
  console.log(`  ✓ ${inserted} places upserted  (${errors.length} errors)`)
}

/** Convert a cajun-connection business object to a places row. */
function businessToPlace(b, source) {
  const slug = b.slug || slugify(b.name)

  // Derive city from location string (e.g. "Scott, LA (multiple locations)")
  let city = 'Lafayette'
  if (b.location) {
    const match = b.location.match(/^([^,]+)/)
    if (match) city = match[1].trim()
    // Normalize common abbreviations
    if (city.toLowerCase().includes('acadiana') || city.toLowerCase().includes('cajun coast')) {
      city = 'Lafayette'
    }
  }

  return {
    slug,
    name: b.name,
    type: deriveType(b.category || b.categories?.[0]),
    description: b.description || null,
    short_description: b.shortDescription || null,
    city,
    website: b.website || null,
    cover_photo: b.coverPhoto || b.logo || null,
    categories: b.categories || (b.category ? [b.category] : null),
    offerings: b.offerings || null,
    tags: b.tags || null,
    socials: b.socials || null,
    is_featured: b.featured ?? false,
    source,
    created_at: b.createdAt || undefined,
  }
}

function deriveType(category) {
  if (!category) return 'restaurant'
  const c = category.toLowerCase()
  if (c.includes('season') || c.includes('spice') || c.includes('ingredient')) return 'specialty'
  if (c.includes('market') || c.includes('grocery') || c.includes('supermarket')) return 'market'
  if (c.includes('bar') || c.includes('nightlife')) return 'bar'
  if (c.includes('venue') || c.includes('music')) return 'venue'
  if (c.includes('truck') || c.includes('food truck')) return 'food_truck'
  if (c.includes('boudin') || c.includes('cracklin') || c.includes('meat')) return 'market'
  return 'restaurant'
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedEvents() {
  console.log('\n🎪 Seeding events …')

  const data = loadJson('data/events.json')
  if (!data || !Array.isArray(data)) {
    console.log('  ⚠  No events data found.')
    return
  }

  const rows = data.map((e) => ({
    slug: e.slug || slugify(e.title),
    name: e.title,
    type: e.category || 'community',
    description: e.description || null,
    start_date: e.date,
    end_date: e.endDate || null,
    time: e.time || null,
    venue: e.venue || null,
    address: e.address || null,
    city: e.city || 'Lafayette',
    price: e.price || null,
    free: e.free ?? null,
    ticket_url: e.link || null,
    source_url: e.link || null,
    cover_photo: e.image || null,
    source: e.source || 'community',
    tags: e.category ? [e.category] : null,
  }))

  // Deduplicate slugs
  const bySlug = new Map()
  for (const r of rows) bySlug.set(r.slug, r)

  const { inserted, errors } = await upsertBatch('events', [...bySlug.values()])
  console.log(`  ✓ ${inserted} events upserted  (${errors.length} errors)`)
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedCrawfishPrices() {
  console.log('\n🦞 Seeding crawfish prices …')

  const data = loadJson('data/crawfish-prices.json')
  if (!data?.vendors) {
    console.log('  ⚠  No crawfish-prices data found.')
    return
  }

  const fetchedAt = data.lastUpdated || new Date().toISOString()

  const rows = data.vendors.map((v) => ({
    name: v.name,
    slug: slugify(v.name),
    address: v.address || null,
    city: v.city,
    boiled_price_per_lb: v.boiledPricePerLb ?? null,
    boiled_price_text: v.boiledPriceText || null,
    live_price_per_lb: v.livePricePerLb ?? null,
    live_price_text: v.livePriceText || null,
    boiled_size: v.boiledSize || null,
    live_size: v.liveSize || null,
    rating: v.rating ?? null,
    phone: v.phone || null,
    hours: v.hours || null,
    source: 'crawfish_app',
    source_updated_at: v.updatedAt || null,
    fetched_at: fetchedAt,
  }))

  // crawfish_prices uses id as PK — no unique slug constraint — so we delete+insert
  // to avoid stale price rows accumulating. Each seed run is a full refresh.
  const { error: delErr } = await supabase.from('crawfish_prices').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) console.warn('  ⚠  Could not clear old prices:', delErr.message)

  const { inserted, errors } = await upsertBatch('crawfish_prices', rows, 'id')
  console.log(`  ✓ ${rows.length} crawfish vendors seeded  (${errors.length} errors)`)
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedLiveMusic() {
  console.log('\n🎵 Seeding live music venues …')

  const data = loadJson('data/live-music.json')
  if (!data?.venues) {
    console.log('  ⚠  No live-music data found.')
    return
  }

  const rows = data.venues.map((v) => ({
    slug: v.slug || slugify(v.name),
    name: v.name,
    city: v.locations?.[0] || 'Lafayette',
    website: v.website || null,
    facebook: v.facebook || null,
    instagram: v.instagram || null,
    music_nights: v.musicNights || [],
    genres: v.genres || null,
    description: v.vibe || v.notes || null,
  }))

  // Deduplicate by slug
  const bySlug = new Map()
  for (const r of rows) bySlug.set(r.slug, r)

  const { inserted, errors } = await upsertBatch('live_music_venues', [...bySlug.values()])
  console.log(`  ✓ ${inserted} live music venues upserted  (${errors.length} errors)`)
}

// ─────────────────────────────────────────────────────────────────────────────

async function seedBestOfLists() {
  console.log('\n🏆 Seeding best-of lists …')

  const communityRecs = loadJson('data/community-recs.json')
  const whosGotIt     = loadJson('data/whos-got-it.json')

  const rows = []

  // community-recs.json → { topics: [{ slug, name, category, businessCount, totalMentions, topBusinesses }] }
  if (communityRecs?.topics) {
    for (const topic of communityRecs.topics) {
      rows.push({
        slug: topic.slug,
        title: topic.name,
        category: 'food',
        description: `Community-voted rankings for ${topic.name} in Acadiana based on ${topic.totalMentions} mentions across local Facebook groups.`,
        entries: (topic.topBusinesses || []).map((b, i) => ({
          rank: i + 1,
          slug: b.slug,
          name: b.name,
          mention_count: b.mentionCount,
        })),
        business_count: topic.businessCount || null,
        total_mentions: topic.totalMentions || null,
        methodology: 'facebook_dump',
        source: 'community_recs',
      })
    }
  }

  // whos-got-it.json → { items: [{ item, type, description, contenders }] }
  if (whosGotIt?.items) {
    for (const item of whosGotIt.items) {
      const slug = `whos-got-it-${slugify(item.item)}`
      rows.push({
        slug,
        title: `Who's Got the Best ${item.item}?`,
        category: categoryFromType(item.type),
        description: item.description || null,
        entries: (item.contenders || []).map((c, i) => ({
          rank: i + 1,
          slug: c.slug,
          name: c.placeName,
          badge: c.badge,
          case_for: c.caseFor,
          rating: c.rating,
        })),
        methodology: 'ai_curated',
        source: 'whos_got_it',
      })
    }
  }

  // Deduplicate by slug
  const bySlug = new Map()
  for (const r of rows) bySlug.set(r.slug, r)

  const { inserted, errors } = await upsertBatch('best_of_lists', [...bySlug.values()])
  console.log(`  ✓ ${inserted} best-of lists upserted  (${errors.length} errors)`)
}

function categoryFromType(type) {
  if (!type) return 'food'
  const t = type.toLowerCase()
  if (t === 'dessert') return 'food'
  if (t === 'seafood') return 'food'
  if (t === 'sausage') return 'food'
  if (t === 'snack')   return 'food'
  return 'food'
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const SEEDERS = {
  places:   seedPlaces,
  events:   seedEvents,
  crawfish: seedCrawfishPrices,
  music:    seedLiveMusic,
  best_of:  seedBestOfLists,
}

async function main() {
  const onlyArg = process.argv.indexOf('--only')
  const only    = onlyArg !== -1 ? process.argv[onlyArg + 1] : null

  console.log('🌶  GeauxFind Supabase Seeder')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(only ? `   Mode: --only ${only}` : '   Mode: full seed')

  if (only) {
    if (!SEEDERS[only]) {
      console.error(`\n❌  Unknown seeder "${only}". Available: ${Object.keys(SEEDERS).join(', ')}`)
      process.exit(1)
    }
    await SEEDERS[only]()
  } else {
    for (const seeder of Object.values(SEEDERS)) {
      await seeder()
    }
  }

  console.log('\n✅  Done!\n')
}

main().catch((err) => {
  console.error('\n❌  Seed failed:', err)
  process.exit(1)
})
