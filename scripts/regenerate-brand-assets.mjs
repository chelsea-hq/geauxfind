#!/usr/bin/env node
// Regenerate the GeauxFind brand asset suite from a source PNG:
//   - Removes near-white background → public/logo-icon-transparent.png
//   - Generates favicon-32, icon (192), icon-512, apple-touch-icon (180)
//   - Generates og-image.png (1200×630) — logo on Cajun-red gradient
//
// Run: node scripts/regenerate-brand-assets.mjs <source.png>

import sharp from "sharp";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), "..");
const PUBLIC = path.join(root, "public");

const src = process.argv[2];
if (!src) {
  console.error("usage: regenerate-brand-assets.mjs <source-image>");
  process.exit(1);
}

// Threshold for "near white" → alpha = 0. Higher = more aggressive removal.
const WHITE_THRESHOLD = 245;

async function makeTransparent(srcPath) {
  const img = sharp(srcPath).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const out = Buffer.from(data);
  for (let i = 0; i < out.length; i += 4) {
    const r = out[i];
    const g = out[i + 1];
    const b = out[i + 2];
    if (r >= WHITE_THRESHOLD && g >= WHITE_THRESHOLD && b >= WHITE_THRESHOLD) {
      out[i + 3] = 0;
    } else {
      // Soft edge: fade pixels in transition band so anti-aliased edges
      // don't show a white halo.
      const minC = Math.min(r, g, b);
      if (minC > 220) {
        const fade = Math.round(((255 - minC) / (255 - 220)) * 255);
        out[i + 3] = Math.min(out[i + 3], fade);
      }
    }
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .trim();
}

async function main() {
  console.log(`source: ${src}`);

  // 1. Master transparent logo (square, trimmed)
  const masterBuf = await (await makeTransparent(src)).toBuffer();
  await writeFile(path.join(PUBLIC, "logo-icon-transparent.png"), masterBuf);
  console.log("✓ logo-icon-transparent.png");

  // 2. Favicons / app icons — pad to square with transparent background
  const sizes = [
    { size: 32, file: "favicon-32.png" },
    { size: 192, file: "icon.png" },
    { size: 512, file: "icon-512.png" },
    { size: 180, file: "apple-touch-icon.png" },
  ];
  for (const { size, file } of sizes) {
    await sharp(masterBuf)
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(PUBLIC, file));
    console.log(`✓ ${file} (${size}×${size})`);
  }

  // 3. ICO — sharp doesn't write .ico natively; emit a 32×32 PNG renamed.
  // Most browsers accept PNG inside .ico filename. The previous favicon.ico
  // was generated this way too.
  // NOTE: Next.js App Router gives src/app/favicon.ico priority over
  // public/favicon.ico — write to BOTH so the served favicon updates.
  const icoBuf = await sharp(masterBuf)
    .resize(32, 32, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await writeFile(path.join(PUBLIC, "favicon.ico"), icoBuf);
  await writeFile(path.join(root, "src", "app", "favicon.ico"), icoBuf);
  console.log("✓ favicon.ico (32×32 PNG, written to public/ and src/app/)");

  // 4. OG image — 1200×630, Cajun-red gradient + logo + wordmark
  const W = 1200;
  const H = 630;
  const logoSize = 280;

  // Gradient SVG (sharp can rasterize SVG with embedded gradients)
  const bgSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#7a1326"/>
        <stop offset="45%" stop-color="#bf1f34"/>
        <stop offset="75%" stop-color="#d46a2a"/>
        <stop offset="100%" stop-color="#e59d39"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#g)"/>
  </svg>`);

  // Text overlay SVG
  const textSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <style>
      .kicker { font: 600 26px Georgia, serif; letter-spacing: 6px; fill: rgba(255,255,255,0.85); }
      .title  { font: 400 92px Georgia, serif; fill: white; }
      .sub    { font: 400 32px Helvetica, Arial, sans-serif; fill: rgba(255,255,255,0.92); }
      .brand  { font: 700 32px Georgia, serif; letter-spacing: 1px; fill: white; }
      .url    { font: 400 24px Helvetica, Arial, sans-serif; fill: rgba(255,255,255,0.85); }
    </style>
    <text x="80" y="100" class="kicker">LAFAYETTE · LOUISIANA</text>
    <text x="80" y="380" class="title">GeauxFind</text>
    <text x="80" y="440" class="sub">Discover the Heart of Acadiana</text>
    <line x1="80" y1="540" x2="${W - 80}" y2="540" stroke="rgba(255,255,255,0.25)" stroke-width="1"/>
    <text x="80" y="585" class="brand">GeauxFind</text>
    <text x="${W - 80}" y="585" class="url" text-anchor="end">geauxfind.com</text>
  </svg>`);

  const logoForOg = await sharp(masterBuf)
    .resize(logoSize, logoSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  await sharp(bgSvg)
    .composite([
      { input: logoForOg, top: 50, left: W - logoSize - 80 },
      { input: textSvg, top: 0, left: 0 },
    ])
    .png()
    .toFile(path.join(PUBLIC, "og-image.png"));
  console.log(`✓ og-image.png (${W}×${H})`);

  console.log("\nAll brand assets regenerated.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
