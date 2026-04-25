#!/usr/bin/env node
// Regenerate favicon + icon PNGs from public/logo-icon-transparent.svg using
// Playwright's headless renderer. Produces:
//   public/icon.png        (192×192)
//   public/icon-512.png    (512×512)
//   public/apple-touch-icon.png (180×180)
//   public/favicon-32.png  (32×32)
// Note: favicon.ico is left untouched — generate that with `iconutil` or an
// online .ico converter when needed; modern browsers prefer the SVG anyway.

import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const svgPath = path.join(root, "public", "logo-icon-transparent.svg");

const TARGETS = [
  { out: "icon.png", size: 192 },
  { out: "icon-512.png", size: 512 },
  { out: "apple-touch-icon.png", size: 180 },
  { out: "favicon-32.png", size: 32 },
];

async function main() {
  const svg = await readFile(svgPath, "utf8");
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  for (const { out, size } of TARGETS) {
    const html = `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:transparent;width:${size}px;height:${size}px}svg{width:${size}px;height:${size}px;display:block}</style></head><body>${svg}</body></html>`;
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(html);
    const buf = await page.screenshot({ omitBackground: true, fullPage: false, type: "png", clip: { x: 0, y: 0, width: size, height: size } });
    const outPath = path.join(root, "public", out);
    await writeFile(outPath, buf);
    console.log(`wrote ${out} (${size}×${size}, ${buf.length} bytes)`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
