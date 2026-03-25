import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import toIco from 'to-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..', 'public');

const cream = '#FAF7F2';
const red = '#8B1A1A';
const dark = '#5C1010';

const ogSvg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7C1818"/>
      <stop offset="100%" stop-color="#A42A24"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="70" y="70" width="1060" height="490" rx="24" fill="rgba(250,247,242,0.06)" stroke="rgba(250,247,242,0.2)" />
  <text x="110" y="270" fill="#FAF7F2" font-family="Georgia, 'Times New Roman', serif" font-size="110" font-weight="700" letter-spacing="1">GeauxFind ⚜</text>
  <text x="110" y="350" fill="#FDE8CE" font-family="Inter, Arial, sans-serif" font-size="46" font-weight="600">Discover the Best of Acadiana</text>
  <text x="110" y="430" fill="#FFEBD4" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="400">Food • Festivals • Music • Hidden Gems</text>
</svg>`;

await sharp(Buffer.from(ogSvg)).png({ quality: 96, compressionLevel: 9 }).toFile(path.join(publicDir, 'og-image.png'));

function iconSvg(size) {
  const pad = Math.round(size * 0.12);
  const fontSize = Math.round(size * 0.62);
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" rx="${Math.round(size*0.2)}" fill="${cream}" />
    <rect x="${Math.round(size*0.02)}" y="${Math.round(size*0.02)}" width="${Math.round(size*0.96)}" height="${Math.round(size*0.96)}" rx="${Math.round(size*0.18)}" fill="none" stroke="#E7DED2" stroke-width="${Math.max(1, Math.round(size*0.02))}"/>
    <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="${red}" font-family="Georgia, 'Times New Roman', serif" font-size="${fontSize}">⚜</text>
  </svg>`;
}

const icon192 = await sharp(Buffer.from(iconSvg(192))).png().toBuffer();
await writeFile(path.join(publicDir, 'icon.png'), icon192);

const apple180 = await sharp(Buffer.from(iconSvg(180))).png().toBuffer();
await writeFile(path.join(publicDir, 'apple-touch-icon.png'), apple180);

const favicon32 = await sharp(Buffer.from(iconSvg(32))).png().toBuffer();
const ico = await toIco([favicon32]);
await writeFile(path.join(publicDir, 'favicon.ico'), ico);

console.log('Branding assets generated.');
