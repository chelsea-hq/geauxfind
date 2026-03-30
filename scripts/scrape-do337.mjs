#!/usr/bin/env node
/**
 * Scrape Do337.com — Lafayette's local events & business directory
 * Discovers restaurants, venues, and attractions not on Google
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'data', 'do337-discoveries.json');
const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function normalizeText(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'GeauxFind/1.0 (local discovery platform)',
      'Accept': 'text/html,application/xhtml+xml,application/xml',
    },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

// Extract business listings from Do337 category pages
function extractListings(html) {
  const listings = [];
  
  // Match venue/business cards — Do337 uses various patterns
  // Look for name + address patterns in the HTML
  const namePattern = /<h\d[^>]*class="[^"]*(?:venue|title|name)[^"]*"[^>]*>(.*?)<\/h\d>/gi;
  const linkPattern = /<a[^>]*href="(\/(?:venue|place|business)[^"]*)"[^>]*>(.*?)<\/a>/gi;
  
  let match;
  while ((match = linkPattern.exec(html)) !== null) {
    const name = match[2].replace(/<[^>]*>/g, '').trim();
    if (name && name.length > 2 && name.length < 100) {
      listings.push({
        name,
        url: `https://do337.com${match[1]}`,
        source: 'do337',
      });
    }
  }
  
  // Also try JSON-LD structured data
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item['@type'] === 'LocalBusiness' || item['@type'] === 'Restaurant' || 
            item['@type'] === 'FoodEstablishment' || item['@type'] === 'BarOrPub') {
          listings.push({
            name: item.name,
            address: typeof item.address === 'string' ? item.address : 
                     item.address?.streetAddress || null,
            city: item.address?.addressLocality || null,
            url: item.url || null,
            source: 'do337-jsonld',
          });
        }
      }
    } catch { /* not valid JSON */ }
  }
  
  return listings;
}

async function main() {
  const seedData = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'));
  const existingNames = new Set(seedData.map(p => normalizeText(p.name)));
  
  const categories = [
    'https://do337.com/restaurants',
    'https://do337.com/bars',
    'https://do337.com/music-venues',
    'https://do337.com/things-to-do',
    'https://do337.com/nightlife',
    'https://do337.com/cafes',
    'https://do337.com/food',
    'https://do337.com/venues',
    'https://do337.com/entertainment',
    'https://do337.com/arts-culture',
    'https://do337.com/outdoors',
    'https://do337.com/shopping',
  ];
  
  const allDiscoveries = new Map();
  
  for (const url of categories) {
    try {
      console.log(`Fetching ${url}...`);
      const html = await fetchPage(url);
      const listings = extractListings(html);
      
      for (const listing of listings) {
        const norm = normalizeText(listing.name);
        if (existingNames.has(norm)) continue;
        if (allDiscoveries.has(norm)) continue;
        allDiscoveries.set(norm, listing);
      }
      
      console.log(`  → ${listings.length} found, ${allDiscoveries.size} unique new`);
      await sleep(1500); // Be polite
    } catch (err) {
      console.log(`  → Error: ${err.message}`);
    }
  }
  
  const results = Array.from(allDiscoveries.values());
  
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'do337.com',
    count: results.length,
    discoveries: results,
  }, null, 2) + '\n');
  
  console.log(`\nDo337 scrape complete: ${results.length} new businesses found.`);
  console.log(`Saved: ${OUTPUT_PATH}`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
