#!/usr/bin/env node
/**
 * Scrape Chamber of Commerce member directories
 * Lafayette, Broussard, Youngsville, Opelousas, New Iberia, etc.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const OUTPUT_PATH = path.join(ROOT, 'data', 'chamber-discoveries.json');
const SEED_PATH = path.join(ROOT, 'scripts', 'seed-data.json');

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function normalizeText(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Discovery-relevant categories only
const RELEVANT_CATS = new Set([
  'restaurants', 'dining', 'food', 'bars', 'nightlife', 'entertainment',
  'arts', 'culture', 'museums', 'galleries', 'music', 'tourism',
  'attractions', 'recreation', 'parks', 'outdoor', 'shopping', 'retail',
  'boutiques', 'bakeries', 'cafes', 'breweries', 'wineries', 'hotels',
  'lodging', 'bed and breakfast', 'events', 'venues', 'fitness',
  'spas', 'beauty', 'salons', 'markets', 'antiques',
]);

function isRelevantCategory(catName) {
  const norm = catName.toLowerCase();
  return Array.from(RELEVANT_CATS).some(rc => norm.includes(rc));
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'GeauxFind/1.0 (local community platform)',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.text();
}

function extractBusinesses(html, chamberName) {
  const businesses = [];
  
  // ChamberMaster/GrowthZone pattern (most common chamber CMS)
  // They use class="mn-search-result" or "gz-member-card"
  const patterns = [
    // ChamberMaster
    /<a[^>]*class="[^"]*mn-name[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
    // GrowthZone  
    /<a[^>]*href="(\/list\/member[^"]*)"[^>]*>(.*?)<\/a>/gi,
    // Generic business directory
    /<h\d[^>]*>\s*<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>\s*<\/h\d>/gi,
    // Structured data
    /<div[^>]*class="[^"]*business-name[^"]*"[^>]*>(.*?)<\/div>/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const name = (match[2] || match[1]).replace(/<[^>]*>/g, '').trim();
      if (name && name.length > 2 && name.length < 100) {
        businesses.push({
          name,
          source: `chamber:${chamberName}`,
        });
      }
    }
  }
  
  // JSON-LD  
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis;
  let match;
  while ((match = jsonLdPattern.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : data?.itemListElement || [data];
      for (const item of items) {
        const obj = item.item || item;
        if (obj?.name && (obj['@type'] === 'LocalBusiness' || obj['@type'] === 'Organization')) {
          businesses.push({
            name: obj.name,
            address: typeof obj.address === 'string' ? obj.address : obj.address?.streetAddress || null,
            city: obj.address?.addressLocality || null,
            source: `chamber:${chamberName}`,
          });
        }
      }
    } catch { /* skip */ }
  }
  
  return businesses;
}

const CHAMBERS = [
  {
    name: 'Lafayette',
    urls: [
      'https://business.lafayettechamber.org/list/ql/restaurants-food-and-beverage-42',
      'https://business.lafayettechamber.org/list/ql/arts-entertainment-18',
      'https://business.lafayettechamber.org/list/ql/recreation-fitness-41',
      'https://business.lafayettechamber.org/list/ql/retail-shopping-43',
      'https://business.lafayettechamber.org/list/ql/tourism-hospitality-12',
    ],
  },
  {
    name: 'Broussard',
    urls: [
      'https://www.broussardchamber.net/business-directory',
    ],
  },
  {
    name: 'Youngsville',
    urls: [
      'https://www.youngsvillechamber.com/business-directory',
    ],
  },
  {
    name: 'New Iberia',
    urls: [
      'https://www.iberiachamber.org/business-directory',
    ],
  },
  {
    name: 'Opelousas',
    urls: [
      'https://www.opelousaschamber.org/business-directory',
    ],
  },
];

async function main() {
  const seedData = JSON.parse(await fs.readFile(SEED_PATH, 'utf8'));
  const existingNames = new Set(seedData.map(p => normalizeText(p.name)));
  
  const allDiscoveries = new Map();
  
  for (const chamber of CHAMBERS) {
    console.log(`\n=== ${chamber.name} Chamber ===`);
    
    for (const url of chamber.urls) {
      try {
        console.log(`  Fetching: ${url}`);
        const html = await fetchPage(url);
        const businesses = extractBusinesses(html, chamber.name);
        
        for (const biz of businesses) {
          const norm = normalizeText(biz.name);
          if (existingNames.has(norm)) continue;
          if (allDiscoveries.has(norm)) continue;
          allDiscoveries.set(norm, { ...biz, city: biz.city || chamber.name });
        }
        
        console.log(`    → ${businesses.length} found, ${allDiscoveries.size} unique new`);
        await sleep(2000);
      } catch (err) {
        console.log(`    → Error: ${err.message}`);
      }
    }
  }
  
  const results = Array.from(allDiscoveries.values());
  
  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    source: 'chambers-of-commerce',
    count: results.length,
    discoveries: results,
  }, null, 2) + '\n');
  
  console.log(`\nChamber scrape complete: ${results.length} new businesses found.`);
  console.log(`Saved: ${OUTPUT_PATH}`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
