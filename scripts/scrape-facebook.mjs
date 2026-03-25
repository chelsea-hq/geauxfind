#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cheerio from 'cheerio';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const OUTPUT_FILE = path.join(DATA_DIR, 'facebook-feed.json');
const SEED_FILE = path.join(__dirname, 'seed-data.json');

const REQUEST_DELAY_MS = 2200;
const MAX_POSTS_PER_GROUP = 50;
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

const GROUPS = [
  { name: 'Foodies of Lafayette', id: '437445600497753', url: 'https://www.facebook.com/groups/437445600497753/' },
  { name: 'Whatz Goin On in Acadiana', id: '607423613041078', url: 'https://www.facebook.com/groups/607423613041078/' },
  { name: 'Lafayette Memories', id: 'LafayetteMemories', url: 'https://www.facebook.com/groups/LafayetteMemories/' },
  { name: 'Louisiana Soul Food', id: '1103265880462154', url: 'https://www.facebook.com/groups/1103265880462154/' },
  { name: 'Lafayette EDM Scene', id: '360751904363123', url: 'https://www.facebook.com/groups/360751904363123/' }
];

const FOOD_ITEMS = [
  'boudin', 'crawfish', 'cracklins', 'king cake', 'gumbo', 'jambalaya', 'po boy', 'po-boy', 'beignet', 'étouffée', 'etouffee'
];

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { group: null };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--group' && args[i + 1]) {
      out.group = args[i + 1].trim().toLowerCase();
      i += 1;
    }
  }
  return out;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function normalizeWhitespace(value = '') {
  return String(value).replace(/\s+/g, ' ').trim();
}

function categorizePost(text = '') {
  const lower = text.toLowerCase();
  if (/(best|who has|recommend|favorite)/i.test(lower)) return 'recommendation';
  if (/(event|tonight|this weekend|happening|festival)/i.test(lower)) return 'event';
  if (/(new|just opened|grand opening)/i.test(lower)) return 'new_business';
  if (/(crawfish|boudin|cracklins)/i.test(lower)) return 'food_specific';
  return 'general';
}

function extractIdsAndLinks(text = '') {
  const links = [...text.matchAll(/https?:\/\/[^\s"'<>]+/g)].map((m) => m[0]);
  const postId = text.match(/"post_id"\s*:\s*"(\d+)"/)?.[1]
    || text.match(/\/groups\/[^/]+\/posts\/(\d+)/)?.[1]
    || text.match(/"story_fbid"\s*:\s*"?(\d+)"?/)?.[1]
    || null;
  return { links, postId };
}

async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      'accept-language': 'en-US,en;q=0.9',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      referer: 'https://www.facebook.com/'
    }
  });
  const html = await res.text();
  return { res, html };
}

function textLooksLikePrivateOrBlocked(html = '') {
  const lower = html.toLowerCase();
  return (
    lower.includes('this content isn\'t available')
    || lower.includes('private group')
    || lower.includes('log into facebook')
    || lower.includes('you must log in')
  );
}

function gatherJsonCandidates(html) {
  const $ = cheerio.load(html);
  const candidates = [];

  $('script').each((_, el) => {
    const txt = $(el).html() || '';
    if (!txt) return;

    if (txt.includes('require("ServerJS")') || txt.includes('__bbox') || txt.includes('__comet_req')) {
      candidates.push(txt);
    }

    if (txt.trim().startsWith('{') && txt.includes('"require"')) {
      candidates.push(txt);
    }
  });

  return candidates;
}

function parsePostsFromTextBlob(blob, group) {
  const posts = [];
  const seen = new Set();

  const articleChunks = blob.split(/"__typename":"(GroupFeedUnit|Story)"/g);
  for (const chunk of articleChunks) {
    if (!chunk || chunk.length < 100) continue;

    const id = chunk.match(/"post_id":"(\d+)"/)?.[1]
      || chunk.match(/"story_fbid":"(\d+)"/)?.[1]
      || null;

    const author = chunk.match(/"name":"([^"\\]{2,120})"/)?.[1] ?? null;

    const textPieces = [...chunk.matchAll(/"text":"((?:\\.|[^"\\]){10,5000})"/g)]
      .map((m) => m[1])
      .map((t) => t.replace(/\\n/g, ' ').replace(/\\"/g, '"'))
      .map(normalizeWhitespace)
      .filter((t) => !t.startsWith('http') && !/^\d+$/.test(t));

    const bestText = textPieces.sort((a, b) => b.length - a.length)[0] || '';

    const timestampUnix = chunk.match(/"creation_time":(\d{10})/)?.[1];
    const date = timestampUnix ? new Date(Number(timestampUnix) * 1000).toISOString().slice(0, 10) : null;

    const imageUrls = [...chunk.matchAll(/https:\/\/[^"\\]*scontent[^"\\]*\.(?:jpg|jpeg|png|webp)/gi)]
      .map((m) => m[0].replace(/\\\//g, '/'));

    const linkUrl = chunk.match(/"url":"(https?:\\\/\\\/[^"\\]+)"/)?.[1]?.replace(/\\\//g, '/') || null;

    const reactions = Number(chunk.match(/"reaction_count"\s*:\s*\{"count"\s*:\s*(\d+)/)?.[1] || chunk.match(/"reaction_count":(\d+)/)?.[1] || 0) || 0;
    const comments = Number(chunk.match(/"comment_count"\s*:\s*(\d+)/)?.[1] || 0) || 0;

    const fallbackId = id || linkUrl || `${group.id}-${Buffer.from(bestText).toString('base64').slice(0, 12)}`;
    if (!fallbackId || seen.has(fallbackId)) continue;
    seen.add(fallbackId);

    const cleanedText = normalizeWhitespace(bestText);
    const needsVisionParsing = imageUrls.length > 0 && cleanedText.length < 30;

    posts.push({
      id: String(fallbackId),
      groupName: group.name,
      groupId: String(group.id),
      author,
      text: cleanedText,
      date,
      imageUrls: [...new Set(imageUrls)],
      linkUrl,
      reactions,
      comments,
      category: categorizePost(cleanedText),
      needsVisionParsing,
      extractedPlaces: [],
      extractedItems: []
    });
  }

  return posts;
}

function parsePostsFromHtml(html, group) {
  const posts = [];
  const blobs = gatherJsonCandidates(html);

  for (const blob of blobs) {
    const chunkPosts = parsePostsFromTextBlob(blob, group);
    posts.push(...chunkPosts);
    if (posts.length >= MAX_POSTS_PER_GROUP) break;
  }

  const dedup = new Map();
  for (const post of posts) {
    if (!post.id) continue;
    if (!dedup.has(post.id)) dedup.set(post.id, post);
  }

  return [...dedup.values()].slice(0, MAX_POSTS_PER_GROUP);
}

async function isPathAllowedByRobots(pathname) {
  const override = process.env.FB_IGNORE_ROBOTS === '1';
  if (override) return { allowed: true, reason: 'FB_IGNORE_ROBOTS=1 override set' };

  try {
    const res = await fetch('https://www.facebook.com/robots.txt', {
      headers: { 'user-agent': USER_AGENT }
    });

    if (!res.ok) {
      return { allowed: false, reason: `robots.txt unavailable (${res.status})` };
    }

    const txt = await res.text();
    const lines = txt.split('\n').map((l) => l.trim());
    let inGlobal = false;
    const disallow = [];

    for (const line of lines) {
      if (/^user-agent:\s*\*/i.test(line)) {
        inGlobal = true;
        continue;
      }
      if (/^user-agent:/i.test(line)) {
        inGlobal = false;
      }
      if (inGlobal && /^disallow:/i.test(line)) {
        const value = line.split(':')[1]?.trim() ?? '';
        if (value) disallow.push(value);
      }
    }

    const blocked = disallow.some((prefix) => pathname.startsWith(prefix));
    return blocked
      ? { allowed: false, reason: `Path disallowed by robots.txt (${pathname})` }
      : { allowed: true, reason: 'Allowed by robots.txt' };
  } catch (err) {
    return { allowed: false, reason: `robots.txt check failed: ${err.message}` };
  }
}

function extractPlacesAndItems(posts, seedPlaces = []) {
  const placeNames = seedPlaces
    .map((p) => p?.name)
    .filter(Boolean)
    .map((name) => name.trim())
    .filter((name) => name.length >= 3);

  for (const post of posts) {
    if (post.category !== 'recommendation') continue;
    const lower = post.text.toLowerCase();

    const foundPlaces = placeNames.filter((name) => lower.includes(name.toLowerCase()));
    const foundItems = FOOD_ITEMS.filter((item) => lower.includes(item.toLowerCase()));

    post.extractedPlaces = [...new Set(foundPlaces)].slice(0, 12);
    post.extractedItems = [...new Set(foundItems)];
  }

  return posts;
}

function resolveGroupSelection(filter) {
  if (!filter) return GROUPS;
  return GROUPS.filter((group) => {
    const id = String(group.id).toLowerCase();
    const name = group.name.toLowerCase();
    const url = group.url.toLowerCase();
    return id.includes(filter) || name.includes(filter) || url.includes(filter);
  });
}

async function scrapeGroup(group) {
  const desktopPath = new URL(group.url).pathname;
  const robots = await isPathAllowedByRobots(desktopPath);

  if (!robots.allowed) {
    console.warn(`[skip] ${group.name}: ${robots.reason}`);
    return { group, items: [], status: 'robots_blocked' };
  }

  const targets = [
    group.url,
    `https://m.facebook.com/groups/${group.id}/`
  ];

  for (const url of targets) {
    try {
      const { res, html } = await fetchPage(url);

      if (res.status === 403 || res.status === 429) {
        console.warn(`[skip] ${group.name}: blocked (${res.status}) at ${url}`);
        return { group, items: [], status: `blocked_${res.status}` };
      }

      if (!res.ok) {
        console.warn(`[warn] ${group.name}: HTTP ${res.status} at ${url}`);
        continue;
      }

      if (textLooksLikePrivateOrBlocked(html)) {
        console.warn(`[skip] ${group.name}: appears private or login-gated (${url})`);
        return { group, items: [], status: 'private_or_login' };
      }

      const items = parsePostsFromHtml(html, group);
      if (items.length > 0) {
        console.log(`[ok] ${group.name}: parsed ${items.length} posts from ${url}`);
        return { group, items, status: 'ok' };
      }

      console.warn(`[warn] ${group.name}: no posts parsed from ${url}`);
    } catch (err) {
      console.warn(`[warn] ${group.name}: fetch/parse failed at ${url}: ${err.message}`);
    }

    await delay(REQUEST_DELAY_MS);
  }

  return { group, items: [], status: 'no_data' };
}

async function main() {
  const args = parseArgs();
  const selectedGroups = resolveGroupSelection(args.group);

  if (!selectedGroups.length) {
    console.error(`No groups matched --group ${args.group}`);
    process.exitCode = 1;
    return;
  }

  await fs.mkdir(DATA_DIR, { recursive: true });

  const seedRaw = await fs.readFile(SEED_FILE, 'utf8').catch(() => '{}');
  const seedData = safeJsonParse(seedRaw) || {};
  const seedPlaces = Array.isArray(seedData.places) ? seedData.places : [];

  const scrapedGroups = [];
  const allItems = [];

  for (const group of selectedGroups) {
    const result = await scrapeGroup(group);
    scrapedGroups.push({
      name: group.name,
      id: String(group.id),
      url: group.url,
      postCount: result.items.length,
      status: result.status
    });

    allItems.push(...result.items);
    await delay(REQUEST_DELAY_MS);
  }

  const dedupMap = new Map();
  for (const item of allItems) {
    const key = item.linkUrl || item.id;
    if (!key || dedupMap.has(key)) continue;
    dedupMap.set(key, item);
  }

  const deduped = extractPlacesAndItems([...dedupMap.values()], seedPlaces);

  const payload = {
    lastScraped: new Date().toISOString(),
    groups: scrapedGroups,
    items: deduped
  };

  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  console.log(`Saved ${deduped.length} items to ${path.relative(ROOT, OUTPUT_FILE)}`);
}

main().catch((err) => {
  console.error('Fatal scrape failure:', err);
  process.exitCode = 1;
});
