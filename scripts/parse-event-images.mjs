#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const FEED_FILE = path.join(DATA_DIR, 'facebook-feed.json');
const OUTPUT_DIR = path.join(DATA_DIR, 'facebook-images');

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

function extFromUrl(url) {
  const clean = url.split('?')[0];
  const ext = path.extname(clean).toLowerCase();
  if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext;
  return '.jpg';
}

async function downloadImage(url, outPath) {
  const res = await fetch(url, {
    headers: {
      'user-agent': USER_AGENT,
      accept: 'image/*,*/*;q=0.8'
    }
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const bytes = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(outPath, bytes);
}

async function main() {
  const raw = await fs.readFile(FEED_FILE, 'utf8');
  const feed = JSON.parse(raw);

  const targets = (feed.items || []).filter(
    (item) => item.needsVisionParsing && Array.isArray(item.imageUrls) && item.imageUrls.length > 0
  );

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const report = [];

  for (const item of targets) {
    const url = item.imageUrls[0];
    if (!url) continue;

    const filename = `${item.id}${extFromUrl(url)}`.replace(/[^a-zA-Z0-9._-]/g, '_');
    const outPath = path.join(OUTPUT_DIR, filename);

    try {
      await downloadImage(url, outPath);
      report.push({ id: item.id, imageUrl: url, localPath: path.relative(ROOT, outPath), status: 'downloaded' });
      console.log(`[needs-vision] ${item.id} -> ${path.relative(ROOT, outPath)}`);
    } catch (err) {
      report.push({ id: item.id, imageUrl: url, localPath: null, status: 'failed', error: err.message });
      console.warn(`[failed] ${item.id} -> ${err.message}`);
    }
  }

  const out = {
    checkedAt: new Date().toISOString(),
    totalCandidates: targets.length,
    downloads: report
  };

  const reportFile = path.join(DATA_DIR, 'event-image-parse-report.json');
  await fs.writeFile(reportFile, `${JSON.stringify(out, null, 2)}\n`, 'utf8');

  console.log(`Saved placeholder vision parse report to ${path.relative(ROOT, reportFile)}`);
}

main().catch((err) => {
  console.error('parse-event-images failed:', err.message);
  process.exitCode = 1;
});
