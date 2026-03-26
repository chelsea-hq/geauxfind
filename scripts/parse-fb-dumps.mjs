#!/usr/bin/env node
/**
 * parse-fb-dumps.mjs
 *
 * Processes raw Facebook group dump text files from data/fb-dumps/ and updates
 * data/community-recs.json with fresh mention counts.
 *
 * How to add a new dump:
 *   1. Drop a new .txt file into data/fb-dumps/ (e.g., data/fb-dumps/boudin-raw.txt)
 *   2. Add a matching entry to TOPIC_CONFIG below (optional — will auto-derive if omitted)
 *   3. Run:  node scripts/parse-fb-dumps.mjs
 *
 * Usage:
 *   node scripts/parse-fb-dumps.mjs              # process all dumps
 *   node scripts/parse-fb-dumps.mjs --dry-run     # print results, don't write
 *   node scripts/parse-fb-dumps.mjs --file sushi-raw.txt
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DUMPS_DIR = path.join(ROOT, 'data', 'fb-dumps');
const COMMUNITY_RECS_FILE = path.join(ROOT, 'data', 'community-recs.json');

// ---------------------------------------------------------------------------
// Topic config: maps filename-stem → topic metadata.
// Files not listed here get auto-derived slugs/names.
// ---------------------------------------------------------------------------
const TOPIC_CONFIG = {
  'chicken-salad-raw': {
    slug: 'best-chicken-salad-in-acadiana',
    name: 'Best Chicken Salad in Acadiana',
    category: 'Chicken Salad',
  },
  'sushi-raw': {
    slug: 'best-sushi-in-lafayette',
    name: 'Best Sushi in Lafayette',
    category: 'Sushi',
  },
  'mexican-food-raw': {
    slug: 'best-mexican-food-in-lafayette',
    name: 'Best Mexican Food in Lafayette',
    category: 'Mexican Food',
  },
  'seafood-gumbo-raw': {
    slug: 'best-seafood-gumbo-in-lafayette-area',
    name: 'Best Seafood Gumbo in Lafayette Area',
    category: 'Seafood Gumbo',
  },
};

// ---------------------------------------------------------------------------
// Manual alias overrides.
// Handles spelling variants, shortened names, and location qualifiers.
// Format: canonical-slug → array of extra normalized aliases.
// ---------------------------------------------------------------------------
const MANUAL_ALIASES = {
  // Chicken Salad
  'chops-specialty-meats':     ['chops', "chops specialty"],
  'champagnes-market':         ['champagne', 'champagnes'],
  'little-verons':             ['little verons', 'verons', 'verons on rena'],
  'mamas-fried-chicken':       ['mamas fried chicken', 'mamas fried', 'mama fried'],
  'earls-cajun-market':        ['earls', 'earls on verot'],
  'rods-supermarket':          ['rods', 'rods in church point'],
  'rouses-market':             ['rouses', 'rouses markets'],
  'nunus-fresh-market':        ['nunus', 'nunu', 'nunus in youngsville'],
  'chicken-salad-chick':       ['chicken salad chick'],
  'sweet-envie-llc':           ['sweet envie'],
  'adriens':                   ['adriens', 'adrians', 'adrien', 'adriens on congress', 'adriens congress'],
  'la-marche':                 ['le marche', 'la marche', 'le marche in maurice'],
  'billeauds':                 ['billeauds', 'billeaud'],
  'heberts-specialty-meats':   ['heberts', 'heberts in breaux bridge', 'heberts specialty'],
  'russells':                  ['russells', 'russells in arnaudville'],
  // Sushi
  'fuji-sushi-house':          ['fuji', 'fuji sushi', 'fujisushi'],
  'minami-sushi-bar':          ['minami', 'minami downtown'],
  'ahi-sushi-japanese-cuisine-and-bar': ['ahi', 'ahi sushi'],
  'rock-n-sake':               ['rock n sake', 'rock and sake', 'rock-n-sake'],
  'fishbox-sushi':             ['fishbox', 'fish box', 'fishbox sushi'],
  'nhi-taste-of-asia':         ['nhi', 'nhi taste of asia'],
  'oishi-sushi':               ['oishi'],
  'rawz-bistro':               ['rawz', 'rawz bistro'],
  'sushi-roxx':                ['sushi roxx', 'sushi rocks'],
  'osaka':                     ['osaka lafayette', 'osaka'],
  'saketini':                  ['saketini', 'saketini in broussard'],
  'samurai-ambassador':        ['samurai', 'samarai', 'samauri'],
  'sushi-masa-lafayette':      ['sushi masa', 'sushi masa lafayette'],
  'yoka-japanese-sushi-bar':   ['yoka', 'yoka in youngsville'],
  // Seafood Gumbo
  'rachels-cafe':              ['rachels', 'rachael', 'rachels cafe', 'rachaels cafe', 'racheal', 'racheals', 'racheals cafe'],
  'dons-seafood':              ['dons', 'dons seafood hut', 'dons seafood'],
  'chriss-poboys':             ['chris poboys', 'chriss poboys', 'chris poboy', 'chris poor boy'],
  'prejeans':                  ['prejeans', 'prejeans cajun', 'prejean'],
  'bon-creole':                ['bon creole'],
  'chef-roys-frog-city-cafe':  ['chef roys', 'chef roys frog city', 'chef roy'],
  'rascals-cajun-restaurant':  ['rascals', 'rascals in duson'],
  'la-cuisine-de-maman':       ['la cuisine de maman', 'cuisine de maman'],
  // Mexican Food
  'zarape-tacos-y-gorditas':   ['zarape', 'zarapes', 'zarape tacos'],
  'taqueria-el-mexicano':      ['taqueria el mexicano', 'el mexicano'],
  'mezcal-mexican-restaurant': ['mezcal'],
  'la-fiesta':                 ['la fiesta', 'la fiesta in broussard'],
  'la-hacienda':               ['la hacienda', 'little hacienda'],
  'las-chismosas':             ['las chismosas'],
};

// ---------------------------------------------------------------------------
// Lines to unconditionally skip (Facebook UI chrome)
// ---------------------------------------------------------------------------
const META_LINES = new Set(['Reply', 'Share', 'Edited', 'See translation', 'Like', 'Comment']);

// Regex patterns for lines that are never content
const SKIP_PATTERNS = [
  /^anonymous\s+(member|participant)\s*\d*/i,
  /^no\s+photo\s+description/i,
  /^may\s+be\s+an\s+image/i,
  /^https?:\/\//,                    // bare URLs
  /^\d+[wdyhm]$/,                    // timestamps (30w, 5d, etc.)
  /^\d+[wdyhm]\s*·\s*/,              // "30w ·" variants
  /^home\s*-/i,                      // link titles
  /^google\.com$/i,
  /^renaissance-market\.com$/i,
];

// Strings that clearly are not business recommendations
const NON_BUSINESS_STOPS = new Set([
  'make your own', 'make it yourself', 'following', 'here for the comments',
  "i'm eating", 'i asked', "it's one", 'a place in', 'not being',
  'all cajun', 'all the food', "you're missing", 'go to', 'try it',
  'lol', 'haha', 'yes', 'no', 'same', 'me too', 'agreed', 'this',
  'see comments', 'comments', 'no coffee',
]);

// Cities/places in Acadiana that should not be matched as businesses
const ACADIANA_PLACES = new Set([
  'lafayette', 'broussard', 'youngsville', 'scott', 'carencro', 'opelousas',
  'abbeville', 'new iberia', 'breaux bridge', 'st martinville', 'eunice',
  'rayne', 'crowley', 'kaplan', 'arnaudville', 'duson', 'leonville',
  'church point', 'sunset', 'maurice', 'lydia', 'erath', 'acadiana',
  'baton rouge', 'destin',
]);

// Common English stop words to filter from single-word alias candidates.
// Also include common food/restaurant nouns that would cause false matches
// (e.g. "chicken" auto-aliased from "Chicken Salad Chick" would match any chicken dish).
const ALIAS_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'up', 'is', 'its', 'be', 'as', 'has',
  // Generic restaurant/place nouns
  'bar', 'grill', 'inn', 'place', 'kitchen', 'deli', 'house', 'cafe',
  'market', 'store', 'shop', 'restaurant', 'bistro',
  // Common food words that appear in many business names
  'chicken', 'sushi', 'seafood', 'food', 'fried', 'smoked', 'cajun',
  'pizza', 'burger', 'taco', 'bbq', 'meats', 'meat', 'fresh',
  'salad', 'gumbo', 'crawfish', 'boudin', 'creole', 'specialty',
]);

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------
function normalize(s) {
  return String(s)
    .toLowerCase()
    // Curly/straight apostrophes and possessives
    .replace(/[\u2019\u2018''`]/g, '')
    .replace(/'s\b/g, 's')
    // Strip location qualifiers at end of string
    .replace(/\b(in|on|at|near)\s+\w+(\s+\w+)?\s*$/i, '')
    // Strip parenthetical notes
    .replace(/\([^)]*\)/g, '')
    // Remove non-alphanumeric except spaces
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Build alias set for a business name (auto-generates variants)
// ---------------------------------------------------------------------------
function buildAliases(name, slug) {
  const aliases = new Set();
  const n = normalize(name);
  if (n.length >= 2) aliases.add(n);

  const words = n.split(' ').filter(Boolean);

  // Add first word alias only if it's unique enough (not a generic food/place word)
  if (words.length > 0 && words[0].length >= 4 && !ALIAS_STOP_WORDS.has(words[0])) {
    aliases.add(words[0]);
  }
  // First two words — only add if NEITHER word is a stop word and the combo is specific enough
  if (words.length > 1) {
    const twoWord = words.slice(0, 2).join(' ');
    if (!ALIAS_STOP_WORDS.has(words[0]) && !ALIAS_STOP_WORDS.has(words[1])) {
      aliases.add(twoWord);
    }
  }

  // Add manual aliases if present
  const manual = MANUAL_ALIASES[slug] || [];
  for (const alias of manual) {
    const n2 = normalize(alias);
    if (n2.length >= 2) aliases.add(n2);
  }

  return aliases;
}

// ---------------------------------------------------------------------------
// Parse raw FB dump text into comment segments.
// Each segment = array of lines for one person's comment.
// ---------------------------------------------------------------------------
function parseSegments(text) {
  const lines = text.split('\n').map(l => l.trim());
  const segments = [];
  let current = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line) { i++; continue; }

    // Timestamp line = end of this comment
    if (/^\d+[wdyhm]$/.test(line) || /^\d+[wdyhm]\s*·\s*/.test(line)) {
      if (current.length > 0) {
        segments.push(current);
        current = [];
      }
      i++;
      // Skip trailing metadata lines
      while (i < lines.length && (META_LINES.has(lines[i]) || !lines[i])) {
        i++;
      }
      continue;
    }

    if (META_LINES.has(line)) { i++; continue; }
    if (SKIP_PATTERNS.some(p => p.test(line))) { i++; continue; }

    current.push(line);
    i++;
  }

  if (current.length > 0) segments.push(current);
  return segments;
}

// ---------------------------------------------------------------------------
// Extract candidate strings from a comment segment.
// Skips the first line — it's always the commenter's name, not a recommendation.
// ---------------------------------------------------------------------------
function extractCandidates(segment) {
  const candidates = new Set();

  // segment[0] is the commenter's name — skip it
  const contentLines = segment.slice(1);

  for (const line of contentLines) {
    // The whole line
    const trimmed = line.trim();
    if (trimmed) candidates.add(trimmed);

    // Split by common delimiters to handle multi-business comments:
    // "Fuji\nMinami\nRock n Sake" or "Chops or NuNu's" or "Champagnes, Rod's"
    const parts = trimmed
      .split(/\bor\b|\band\b|[,;&!|]+/gi)
      .map(p => p.trim())
      .filter(p => p.length >= 2);
    for (const part of parts) candidates.add(part);
  }

  // Also check the full content block joined (for multi-line single-business comments)
  const fullText = contentLines.join(' ').trim();
  if (fullText) candidates.add(fullText);

  return [...candidates];
}

// ---------------------------------------------------------------------------
// Determine if a string looks like a business name (heuristic)
// ---------------------------------------------------------------------------
function looksLikeBusinessName(s) {
  const t = s.trim();
  if (t.length < 3 || t.length > 70) return false;
  if (NON_BUSINESS_STOPS.has(t.toLowerCase())) return false;

  // Filter bare city/place names
  if (ACADIANA_PLACES.has(t.toLowerCase())) return false;

  // Must contain letters
  if (!/[a-zA-Z]{2,}/.test(t)) return false;

  // Filter strings starting with legal suffixes (artifacts from "Sweet Envie, LLC on Moss")
  if (/^(llc|inc|ltd|corp|co\.)\b/i.test(t)) return false;

  // Sentence verb patterns = not a business name
  if (/\b(is|are|was|were|have|has|had|do|does|did|will|would|could|should|gets?|got|went|goes|said|says|think|know|makes?|made|tried|try|recommend|suggest|love|like|enjoy|been|going|want|need)\b/i.test(t)) return false;

  // Too many words = probably a sentence
  const words = t.split(/\s+/);
  if (words.length > 7) return false;

  // Two-word title-case patterns that are likely person names (First Last),
  // where both words are ≥ 4 chars and neither looks like a business word
  const BUSINESS_WORDS = /\b(market|cafe|bistro|grill|kitchen|bar|sushi|seafood|poboy|meats|bakery|inn|house|grocery|food|fried|smoked|restaurant|pantry|deli|bbq|mart|store|brewery|winery|pizza|burger|taco|chicken|specialt)\b/i;
  if (words.length === 2 && !BUSINESS_WORDS.test(t)) {
    const [first, second] = words;
    const looksPersonFirst = /^[A-Z][a-z]{2,}$/.test(first) && /^[A-Z][a-z]{2,}$/.test(second);
    if (looksPersonFirst) return false;
  }

  // Starts with capital letter
  return /^[A-Z]/.test(t);
}

function slugify(s) {
  return normalize(s)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function toTitleCase(s) {
  return s.toLowerCase().replace(/\b(\w)/g, c => c.toUpperCase());
}

// ---------------------------------------------------------------------------
// Count business mentions across all segments
// ---------------------------------------------------------------------------
function countMentions(segments, knownBusinesses) {
  // Build alias → slug lookup
  const lookup = new Map(); // normalized alias → slug
  for (const biz of knownBusinesses) {
    for (const alias of buildAliases(biz.name, biz.slug)) {
      if (alias.length >= 2 && !lookup.has(alias)) {
        lookup.set(alias, biz.slug);
      }
    }
  }

  const knownCounts = new Map(); // slug → count
  const newCandidates = new Map(); // normalized → { name, count }

  for (const segment of segments) {
    const mentionedSlugs = new Set();
    const mentionedNewKeys = new Set();
    const candidates = extractCandidates(segment);

    for (const candidate of candidates) {
      const nc = normalize(candidate);
      if (!nc || nc.length < 2) continue;

      let matched = false;

      for (const [alias, slug] of lookup) {
        // Require word-boundary matches to avoid "chicken" matching "mama's fried chicken"
        // via a short alias. Use plain equality for short aliases, word-boundary for longer.
        const aliasRe = alias.length >= 5
          ? new RegExp(`(?:^|\\s)${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\s|$)`)
          : null;
        if (
          nc === alias ||
          nc.startsWith(alias + ' ') ||
          alias.startsWith(nc + ' ') ||
          (aliasRe && aliasRe.test(nc)) ||
          (nc.length >= 5 && alias.length >= 5 && alias.includes(nc))
        ) {
          if (!mentionedSlugs.has(slug)) {
            mentionedSlugs.add(slug);
            knownCounts.set(slug, (knownCounts.get(slug) || 0) + 1);
          }
          matched = true;
          break;
        }
      }

      if (!matched && looksLikeBusinessName(candidate)) {
        const key = nc;
        if (!mentionedNewKeys.has(key)) {
          mentionedNewKeys.add(key);
          const existing = newCandidates.get(key);
          if (existing) {
            existing.count++;
          } else {
            newCandidates.set(key, { name: candidate.trim(), count: 1 });
          }
        }
      }
    }
  }

  return { knownCounts, newCandidates };
}

// ---------------------------------------------------------------------------
// Process a single dump file
// ---------------------------------------------------------------------------
async function processDump(filepath, topicMeta, existingBusinesses, opts = {}) {
  const raw = await fs.readFile(filepath, 'utf8');
  const segments = parseSegments(raw);
  console.log(`  [${path.basename(filepath)}] ${segments.length} comment segments`);

  const { knownCounts, newCandidates } = countMentions(segments, existingBusinesses);

  // Build topBusinesses: merge known counts with existing list
  const allSlugs = new Set([
    ...knownCounts.keys(),
    ...existingBusinesses.filter(b => b.threads?.includes(topicMeta.name)).map(b => b.slug),
  ]);

  const topBusinesses = [...allSlugs]
    .map(slug => {
      const biz = existingBusinesses.find(b => b.slug === slug);
      const name = biz?.name ?? slug;
      const mentionCount = knownCounts.get(slug) ?? 0;
      return { slug, name, mentionCount };
    })
    .filter(b => b.mentionCount > 0)
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .slice(0, 20);

  // New businesses not yet in community-recs
  const newBusinessEntries = [];
  for (const [, info] of newCandidates) {
    if (info.count >= 2) { // require at least 2 mentions to add as new
      const s = slugify(info.name);
      if (!existingBusinesses.some(b => b.slug === s)) {
        newBusinessEntries.push({
          slug: s,
          name: toTitleCase(info.name),
          mentionCount: info.count,
        });
      }
    }
  }

  if (newBusinessEntries.length > 0) {
    console.log(`  [${path.basename(filepath)}] ${newBusinessEntries.length} potential new businesses detected:`);
    for (const b of newBusinessEntries.slice(0, 10)) {
      console.log(`    + ${b.name} (${b.mentionCount} mentions)`);
    }
  }

  const totalMentions = topBusinesses.reduce((sum, b) => sum + b.mentionCount, 0);

  return {
    topic: {
      ...topicMeta,
      businessCount: topBusinesses.length,
      totalMentions,
      topBusinesses,
    },
    newBusinessEntries,
    rawSegmentCount: segments.length,
  };
}

// ---------------------------------------------------------------------------
// Derive topic config from filename when not in TOPIC_CONFIG
// ---------------------------------------------------------------------------
function deriveTopicConfig(stem) {
  // e.g. "boudin-raw" → "Best Boudin in Acadiana"
  const name = stem
    .replace(/-raw$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
  return {
    slug: `best-${stem.replace(/-raw$/, '')}-in-acadiana`,
    name: `Best ${name} in Acadiana`,
    category: name,
  };
}

// ---------------------------------------------------------------------------
// Parse CLI args
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, file: null, verbose: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') opts.dryRun = true;
    if (args[i] === '--verbose' || args[i] === '-v') opts.verbose = true;
    if (args[i] === '--file' && args[i + 1]) { opts.file = args[++i]; }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs();

  // Load existing community-recs.json
  let existing = { topics: [], businesses: [] };
  try {
    const raw = await fs.readFile(COMMUNITY_RECS_FILE, 'utf8');
    existing = JSON.parse(raw);
  } catch {
    console.log('No existing community-recs.json found, starting fresh.');
  }

  // Gather dump files
  let dumpFiles = (await fs.readdir(DUMPS_DIR))
    .filter(f => f.endsWith('.txt'))
    .sort();

  if (opts.file) {
    dumpFiles = dumpFiles.filter(f => f === opts.file || f === path.basename(opts.file));
    if (!dumpFiles.length) {
      console.error(`No dump file matching --file ${opts.file}`);
      process.exitCode = 1;
      return;
    }
  }

  if (!dumpFiles.length) {
    console.log('No .txt files found in data/fb-dumps/');
    return;
  }

  console.log(`Processing ${dumpFiles.length} dump file(s)...\n`);

  const updatedTopics = [...existing.topics];

  // Build the known-businesses list from BOTH sources:
  //   1. existing.businesses (rich entries with addresses, highlights, etc.)
  //   2. topBusinesses inside each topic (may contain entries not yet promoted to businesses[])
  // Using a Map keyed by slug to deduplicate — businesses[] wins if slug appears in both.
  const bizBySlug = new Map();
  for (const topic of existing.topics) {
    for (const tb of topic.topBusinesses ?? []) {
      if (!bizBySlug.has(tb.slug)) bizBySlug.set(tb.slug, { slug: tb.slug, name: tb.name });
    }
  }
  for (const biz of existing.businesses) {
    bizBySlug.set(biz.slug, biz); // businesses[] overrides topic-only entries
  }
  const updatedBusinesses = [...existing.businesses];
  const allKnownBusinesses = [...bizBySlug.values()];

  for (const filename of dumpFiles) {
    const stem = filename.replace(/\.txt$/, '');
    const topicMeta = TOPIC_CONFIG[stem] ?? deriveTopicConfig(stem);
    const filepath = path.join(DUMPS_DIR, filename);

    console.log(`${filename} → "${topicMeta.name}"`);

    const { topic, newBusinessEntries } = await processDump(
      filepath,
      topicMeta,
      allKnownBusinesses,
      opts
    );

    console.log(`  → ${topic.topBusinesses.length} businesses, ${topic.totalMentions} total mentions`);
    if (opts?.verbose) {
      topic.topBusinesses.slice(0, 10).forEach((b, i) =>
        console.log(`     ${String(i + 1).padStart(2)}. ${b.name.padEnd(35)} ${b.mentionCount}`)
      );
    }
    console.log();

    // Upsert topic
    const existingTopicIdx = updatedTopics.findIndex(t => t.slug === topic.slug);
    if (existingTopicIdx >= 0) {
      updatedTopics[existingTopicIdx] = topic;
    } else {
      updatedTopics.push(topic);
    }

    // Add new businesses discovered in this file
    for (const nb of newBusinessEntries) {
      if (!updatedBusinesses.some(b => b.slug === nb.slug)) {
        updatedBusinesses.push({
          slug: nb.slug,
          name: nb.name,
          category: topicMeta.category,
          categories: [topicMeta.category],
          location: 'Lafayette, LA',
          address: null,
          mentionCount: nb.mentionCount,
          highlights: [],
          source: 'facebook-group',
          sourceThread: topicMeta.name,
          threads: [topicMeta.name],
          rank: null,
          tags: [],
          specialNotes: null,
        });
      }
    }

    // Update mentionCount on existing businesses based on fresh counts
    for (const topBiz of topic.topBusinesses) {
      const bizIdx = updatedBusinesses.findIndex(b => b.slug === topBiz.slug);
      if (bizIdx >= 0) {
        updatedBusinesses[bizIdx] = {
          ...updatedBusinesses[bizIdx],
          mentionCount: topBiz.mentionCount,
        };
      }
    }
  }

  const output = {
    ...existing,
    generatedAt: new Date().toISOString(),
    topics: updatedTopics,
    businesses: updatedBusinesses,
  };

  if (opts.dryRun) {
    console.log('\n-- DRY RUN: not writing. Updated topics:');
    for (const t of updatedTopics) {
      console.log(`  ${t.name} (${t.businessCount} businesses, ${t.totalMentions} mentions)`);
    }
    return;
  }

  await fs.writeFile(COMMUNITY_RECS_FILE, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`✓ Wrote ${COMMUNITY_RECS_FILE.replace(ROOT + '/', '')}`);
  console.log(`  ${updatedTopics.length} topics, ${updatedBusinesses.length} businesses total`);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exitCode = 1;
});
