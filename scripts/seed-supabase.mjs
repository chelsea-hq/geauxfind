#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const args = process.argv.slice(2);
const onlyIdx = args.indexOf('--only');
const only = onlyIdx !== -1 ? String(args[onlyIdx + 1] || '').trim() : null;

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  return value == null ? [] : [value];
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function parseMoney(value) {
  if (typeof value === 'number') return value;
  if (typeof value !== 'string') return null;
  const m = value.match(/\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : null;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function listJsonFiles(dirPath) {
  if (!(await exists(dirPath))) return [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.endsWith('.json'))
    .map((e) => path.join(dirPath, e.name));
}

async function loadPlaces() {
  const placesDir = path.join(dataDir, 'places');
  const placeFiles = await listJsonFiles(placesDir);
  const collected = [];

  if (placeFiles.length > 0) {
    for (const file of placeFiles) {
      const parsed = await readJson(file);
      const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.places) ? parsed.places : [];
      collected.push(...rows);
    }
  }

  if (collected.length === 0) {
    const fallback = path.join(rootDir, 'scripts', 'seed-data.json');
    if (await exists(fallback)) {
      const parsed = await readJson(fallback);
      const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.places) ? parsed.places : [];
      collected.push(...rows);
    }
  }

  return collected.map((p) => ({
    slug: p.slug || slugify(p.name),
    name: p.name,
    type: p.category || p.type || 'food',
    cuisine: p.cuisine ? asArray(p.cuisine).map(String) : null,
    description: p.description ?? null,
    short_description: (p.short_description || p.description || '').slice(0, 280) || null,
    address: p.address ?? null,
    city: p.city || 'Lafayette',
    zip: p.zip || null,
    lat: toNumber(p.lat),
    lng: toNumber(p.lng),
    phone: p.phone || null,
    website: p.website || null,
    hours: Array.isArray(p.hours) ? p.hours : p.hours ?? null,
    price_range: typeof p.price === 'string' ? p.price.length : toNumber(p.price_range),
    google_rating: toNumber(p.google_rating ?? p.rating),
    google_review_count: toNumber(p.google_review_count ?? (Array.isArray(p.reviews) ? p.reviews.length : null)),
    yelp_rating: toNumber(p.yelp_rating),
    yelp_review_count: toNumber(p.yelp_review_count),
    community_rating: toNumber(p.community_rating),
    community_review_count: toNumber(p.community_review_count) ?? 0,
    google_place_id: p.google_place_id || null,
    yelp_id: p.yelp_id || null,
    cover_photo: p.cover_photo || p.image || null,
    photos: Array.isArray(p.photos) ? p.photos : Array.isArray(p.gallery) ? p.gallery : null,
    is_featured: Boolean(p.is_featured ?? p.featured),
    is_verified: Boolean(p.is_verified),
    tags: Array.isArray(p.tags) ? p.tags : null,
    categories: Array.isArray(p.categories) ? p.categories : p.category ? [p.category] : null,
    offerings: Array.isArray(p.offerings) ? p.offerings : null,
    socials: p.socials ?? null,
    source: p.source || null,
    ai_summary: p.ai_summary || null,
  })).filter((p) => p.slug && p.name);
}

async function loadEvents() {
  const files = [];
  const single = path.join(dataDir, 'events.json');
  if (await exists(single)) files.push(single);

  const eventsDir = path.join(dataDir, 'events');
  const eventFiles = await listJsonFiles(eventsDir);
  files.push(...eventFiles);

  const out = [];
  for (const file of files) {
    const parsed = await readJson(file);
    const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.events) ? parsed.events : [];
    out.push(...rows);
  }

  return out.map((e) => ({
    slug: e.slug || slugify(e.title || e.name),
    name: e.name || e.title,
    type: e.type || e.category || 'community',
    description: e.description || null,
    start_date: e.start_date || e.date,
    end_date: e.end_date || e.endDate || e.date || null,
    time: e.time || null,
    is_recurring: Boolean(e.is_recurring || e.isRecurring),
    recurrence_rule: e.recurrence_rule || e.recurrenceRule || null,
    venue: e.venue || null,
    address: e.address || null,
    city: e.city || 'Lafayette',
    lat: toNumber(e.lat),
    lng: toNumber(e.lng),
    price: e.price || null,
    free: typeof e.free === 'boolean' ? e.free : null,
    ticket_url: e.ticket_url || null,
    website: e.website || null,
    lineup: Array.isArray(e.lineup) ? e.lineup : null,
    food_vendors: Array.isArray(e.food_vendors) ? e.food_vendors : null,
    cover_photo: e.cover_photo || e.image || null,
    photos: Array.isArray(e.photos) ? e.photos : null,
    is_featured: Boolean(e.is_featured || e.featured),
    tags: Array.isArray(e.tags) ? e.tags : null,
    source: e.source || null,
    source_url: e.source_url || e.link || null,
  })).filter((e) => e.slug && e.name && e.start_date);
}

async function loadRecipes() {
  const file = path.join(dataDir, 'recipes.json');
  if (!(await exists(file))) return [];
  const parsed = await readJson(file);
  const rows = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.recipes) ? parsed.recipes : [];

  return rows.map((r) => {
    const prep = typeof r.prep_time === 'number' ? r.prep_time : parseMoney(r.prepTime);
    const cook = typeof r.cook_time === 'number' ? r.cook_time : parseMoney(r.cookTime);
    return {
      slug: r.slug || slugify(r.title),
      title: r.title,
      description: r.description || null,
      category: r.category || null,
      ingredients: Array.isArray(r.ingredients) ? r.ingredients : r.ingredients || [],
      instructions: Array.isArray(r.instructions) ? r.instructions : Array.isArray(r.steps) ? r.steps : r.instructions || [],
      prep_time: prep,
      cook_time: cook,
      servings: toNumber(r.servings),
      difficulty: r.difficulty || null,
      cover_photo: r.cover_photo || r.image || null,
      photos: Array.isArray(r.photos) ? r.photos : null,
      video_url: r.video_url || null,
      community_rating: toNumber(r.community_rating ?? r.rating),
      rating_count: toNumber(r.rating_count) ?? 0,
      ai_tips: r.ai_tips || null,
      inspired_by: r.inspired_by || r.inspiredBy || null,
      is_featured: Boolean(r.is_featured || r.featured),
      tags: Array.isArray(r.tags) ? r.tags : null,
      source: r.source || null,
    };
  }).filter((r) => r.slug && r.title);
}

async function loadCrawfishPrices() {
  const file = path.join(dataDir, 'crawfish-prices.json');
  if (!(await exists(file))) return [];
  const parsed = await readJson(file);
  const vendors = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.vendors) ? parsed.vendors : [];

  return vendors.map((c) => ({
    slug: c.slug || slugify(c.name),
    name: c.name,
    address: c.address || null,
    city: c.city || 'Lafayette',
    boiled_price_per_lb: toNumber(c.boiled_price_per_lb ?? c.boiledPricePerLb ?? parseMoney(c.boiled_price_text || c.boiledPriceText)),
    boiled_price_text: c.boiled_price_text || c.boiledPriceText || null,
    live_price_per_lb: toNumber(c.live_price_per_lb ?? c.livePricePerLb ?? parseMoney(c.live_price_text || c.livePriceText)),
    live_price_text: c.live_price_text || c.livePriceText || null,
    boiled_size: c.boiled_size || c.boiledSize || null,
    live_size: c.live_size || c.liveSize || null,
    rating: toNumber(c.rating),
    phone: c.phone || null,
    hours: c.hours || null,
    source: c.source || parsed?.source || 'manual',
    source_updated_at: parsed?.lastUpdated || c.source_updated_at || null,
  })).filter((c) => c.slug && c.name);
}

async function loadBestOfLists() {
  const file = path.join(dataDir, 'community-recs.json');
  if (!(await exists(file))) return [];
  const parsed = await readJson(file);
  const topics = Array.isArray(parsed?.topics) ? parsed.topics : [];

  return topics.map((t) => ({
    slug: t.slug || slugify(t.name),
    title: t.name,
    category: t.category || 'community',
    description: `${t.businessCount || 0} businesses, ${t.totalMentions || 0} mentions`,
    entries: Array.isArray(t.topBusinesses) ? t.topBusinesses : [],
    methodology: 'Community Facebook thread mention counts',
    last_updated: parsed?.lastUpdated || parsed?.generatedAt || new Date().toISOString(),
  })).filter((t) => t.slug && t.title);
}

async function loadLiveMusicVenues() {
  const file = path.join(dataDir, 'live-music.json');
  if (!(await exists(file))) return [];
  const parsed = await readJson(file);
  const venues = Array.isArray(parsed?.venues) ? parsed.venues : [];

  return venues.map((v) => ({
    slug: v.slug || slugify(v.name),
    name: v.name,
    city: Array.isArray(v.locations) ? (v.locations[0] || 'Lafayette') : v.city || 'Lafayette',
    address: v.address || null,
    website: v.website || null,
    facebook: v.facebook || null,
    instagram: v.instagram || null,
    music_nights: Array.isArray(v.musicNights) ? v.musicNights : [],
    genres: Array.isArray(v.genres) ? v.genres : null,
    description: v.vibe || v.description || null,
  })).filter((v) => v.slug && v.name);
}

async function upsertBySlug(table, rows) {
  if (!rows.length) return 0;
  const chunkSize = 500;
  let total = 0;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: 'slug', ignoreDuplicates: false });

    if (error) {
      throw new Error(`${table} upsert failed: ${error.message}`);
    }
    total += chunk.length;
  }

  return total;
}

async function run() {
  const tasks = [
    {
      key: 'places',
      table: 'places',
      loader: loadPlaces,
    },
    {
      key: 'events',
      table: 'events',
      loader: loadEvents,
    },
    {
      key: 'recipes',
      table: 'recipes',
      loader: loadRecipes,
    },
    {
      key: 'crawfish',
      table: 'crawfish_prices',
      loader: loadCrawfishPrices,
    },
    {
      key: 'best_of',
      table: 'best_of_lists',
      loader: loadBestOfLists,
    },
    {
      key: 'music',
      table: 'live_music_venues',
      loader: loadLiveMusicVenues,
    },
  ];

  const selected = only ? tasks.filter((t) => t.key === only) : tasks;
  if (!selected.length) {
    console.error(`Unknown --only target: ${only}`);
    process.exit(1);
  }

  const summary = {};

  for (const task of selected) {
    const rows = await task.loader();
    const count = await upsertBySlug(task.table, rows);
    summary[task.key] = count;
  }

  const parts = [
    `Seeded ${summary.places ?? 0} places`,
    `${summary.events ?? 0} events`,
    `${summary.recipes ?? 0} recipes`,
    `${summary.crawfish ?? 0} crawfish prices`,
    `${summary.best_of ?? 0} best-of lists`,
    `${summary.music ?? 0} live music venues`,
  ];

  console.log(parts.join(', ') + '.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
