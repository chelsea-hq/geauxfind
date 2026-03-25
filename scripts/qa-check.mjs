#!/usr/bin/env node
/**
 * GeauxFind Automated QA Check
 * Checks every page for: broken images, console errors, missing content,
 * layout issues, dead links, and overall health.
 * 
 * Usage: node scripts/qa-check.mjs [--url https://geauxfind.com]
 */

const urlFlag = process.argv.find(a => a.startsWith('--url='));
const urlIdx = process.argv.indexOf('--url');
const BASE = urlFlag ? urlFlag.split('=')[1] 
  : (urlIdx !== -1 && process.argv[urlIdx + 1]) ? process.argv[urlIdx + 1]
  : 'https://geauxfind.com';

const PAGES = [
  '/',
  '/explore',
  '/crawfish',
  '/vibe',
  '/weekend',
  '/ask',
  '/search?q=cajun',
  '/food',
  '/music',
  '/events',
  '/finds',
  '/recipes',
  '/whats-new',
];

const issues = [];
let totalChecks = 0;
let passed = 0;

function log(emoji, msg) {
  console.log(`${emoji} ${msg}`);
}

function fail(page, category, detail) {
  issues.push({ page, category, detail });
  log('❌', `[${page}] ${category}: ${detail}`);
}

function pass(page, check) {
  passed++;
  // silent pass
}

async function checkPage(path) {
  const url = `${BASE}${path}`;
  log('🔍', `Checking ${path}...`);
  
  try {
    const res = await fetch(url, { 
      redirect: 'follow',
      headers: { 'User-Agent': 'GeauxFind-QA/1.0' }
    });
    totalChecks++;
    
    // Check HTTP status
    if (!res.ok) {
      fail(path, 'HTTP', `Status ${res.status}`);
      return;
    }
    pass(path, 'HTTP status');
    
    const html = await res.text();
    
    // Check for empty page
    totalChecks++;
    if (html.length < 500) {
      fail(path, 'CONTENT', 'Page appears empty (< 500 chars)');
    } else {
      pass(path, 'Content length');
    }
    
    // Check for Next.js error page
    totalChecks++;
    if (html.includes('Application error') || html.includes('Internal Server Error') || html.includes('__next_error__')) {
      fail(path, 'ERROR_PAGE', 'Next.js error page rendered');
    } else {
      pass(path, 'No error page');
    }
    
    // Check for placeholder/broken image indicators
    totalChecks++;
    const placeholderCount = (html.match(/placeholder\.svg/g) || []).length;
    if (placeholderCount > 3) {
      fail(path, 'IMAGES', `${placeholderCount} default placeholder images (should use category-specific)`);
    } else {
      pass(path, 'Placeholder images');
    }
    
    // Check for "mock" or "lorem" text that shouldn't be in production
    totalChecks++;
    const hasLorem = /lorem ipsum/i.test(html);
    const hasTodo = /TODO:|FIXME:|HACK:/i.test(html);
    if (hasLorem) fail(path, 'CONTENT', 'Contains "Lorem Ipsum" placeholder text');
    else if (hasTodo) fail(path, 'CONTENT', 'Contains TODO/FIXME/HACK comment in rendered HTML');
    else pass(path, 'No placeholder text');
    
    // Check for common React hydration errors in HTML
    totalChecks++;
    if (html.includes('Hydration failed') || html.includes('Text content does not match')) {
      fail(path, 'HYDRATION', 'React hydration mismatch detected');
    } else {
      pass(path, 'No hydration errors');
    }

    // Check that key meta tags exist
    totalChecks++;
    const hasTitle = /<title[^>]*>.+<\/title>/i.test(html);
    if (!hasTitle) {
      fail(path, 'SEO', 'Missing <title> tag');
    } else {
      pass(path, 'Title tag');
    }
    
    // Check all images for broken src (basic check)
    totalChecks++;
    const imgSrcs = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map(m => m[1]);
    const brokenImgs = [];
    for (const src of imgSrcs.slice(0, 10)) { // Check first 10 images
      try {
        const imgUrl = src.startsWith('http') ? src : `${BASE}${src}`;
        const imgRes = await fetch(imgUrl, { method: 'HEAD', redirect: 'follow' });
        if (!imgRes.ok) brokenImgs.push(src);
      } catch {
        brokenImgs.push(src);
      }
    }
    if (brokenImgs.length > 0) {
      fail(path, 'BROKEN_IMAGES', `${brokenImgs.length} broken images: ${brokenImgs.slice(0, 3).join(', ')}`);
    } else {
      pass(path, 'Image loading');
    }

    // Check for duplicate content (same block appearing multiple times)
    totalChecks++;
    const h2s = [...html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g)].map(m => m[1].trim());
    const dupeH2s = h2s.filter((h, i) => h2s.indexOf(h) !== i);
    if (dupeH2s.length > 0) {
      fail(path, 'DUPLICATES', `Duplicate headings: ${[...new Set(dupeH2s)].join(', ')}`);
    } else {
      pass(path, 'No duplicate headings');
    }

  } catch (err) {
    totalChecks++;
    fail(path, 'FETCH', `Failed to load: ${err.message}`);
  }
}

async function checkLinks() {
  log('🔗', 'Checking internal links from homepage...');
  try {
    const res = await fetch(BASE);
    const html = await res.text();
    const links = [...html.matchAll(/href="(\/[^"#]*?)"/g)]
      .map(m => m[1])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 30);
    
    for (const link of links) {
      totalChecks++;
      try {
        const r = await fetch(`${BASE}${link}`, { method: 'HEAD', redirect: 'follow' });
        if (!r.ok) {
          fail('/', 'DEAD_LINK', `${link} → ${r.status}`);
        } else {
          pass('/', `Link ${link}`);
        }
      } catch {
        fail('/', 'DEAD_LINK', `${link} → fetch error`);
      }
    }
  } catch (err) {
    fail('/', 'LINK_CHECK', `Could not crawl homepage: ${err.message}`);
  }
}

async function checkAPI() {
  const apis = [
    '/api/whats-new',
    '/api/ask',
  ];
  
  for (const api of apis) {
    totalChecks++;
    log('⚡', `Checking API ${api}...`);
    try {
      const res = await fetch(`${BASE}${api}`);
      if (!res.ok) {
        fail(api, 'API', `Status ${res.status}`);
        continue;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length === 0) {
        fail(api, 'API', 'Returns empty array');
      } else {
        pass(api, 'API response');
      }
    } catch (err) {
      fail(api, 'API', `Error: ${err.message}`);
    }
  }
}

// --- Run ---
console.log(`\n🐊 GeauxFind QA Check — ${BASE}\n${'═'.repeat(50)}\n`);

const start = Date.now();

for (const page of PAGES) {
  await checkPage(page);
}
await checkLinks();
await checkAPI();

const elapsed = ((Date.now() - start) / 1000).toFixed(1);

console.log(`\n${'═'.repeat(50)}`);
console.log(`\n📊 Results: ${passed}/${totalChecks} checks passed | ${issues.length} issues found | ${elapsed}s`);

if (issues.length > 0) {
  console.log(`\n🚨 Issues Summary:\n`);
  const byCategory = {};
  for (const i of issues) {
    byCategory[i.category] = byCategory[i.category] || [];
    byCategory[i.category].push(i);
  }
  for (const [cat, items] of Object.entries(byCategory)) {
    console.log(`  ${cat} (${items.length}):`);
    for (const item of items) {
      console.log(`    • [${item.page}] ${item.detail}`);
    }
  }
  
  // Output JSON for automation
  const report = {
    timestamp: new Date().toISOString(),
    url: BASE,
    totalChecks,
    passed,
    failed: issues.length,
    issues,
  };
  const fs = await import('fs');
  fs.writeFileSync('data/qa-report.json', JSON.stringify(report, null, 2));
  console.log(`\n💾 Full report saved to data/qa-report.json`);
  process.exit(1);
} else {
  console.log('\n✅ All checks passed! Site is looking clean. 🐊');
  process.exit(0);
}
