import fs from 'node:fs';
import path from 'node:path';

const seedPath = path.resolve('scripts/seed-data.json');
const raw = fs.readFileSync(seedPath, 'utf8');
const data = JSON.parse(raw);

const GOOGLE_PHOTO_REGEX = /\/v1\/(places\/[^/]+\/photos\/[^/?]+)\/media/i;

const toApiPhotoUrl = (ref) => `/api/photo?ref=${encodeURIComponent(ref)}`;

const extractPhotoRef = (url = '') => {
  const match = url.match(GOOGLE_PHOTO_REGEX);
  if (match?.[1]) return match[1];
  return null;
};

let replacedGoogleImages = 0;
let replacedGoogleGallery = 0;
let replacedGlobes = 0;
let unresolved = 0;

for (const place of data.places ?? []) {
  const image = place.image ?? '';
  const firstPhotoRef = place.photo_references?.[0] || extractPhotoRef(image);

  if (image.includes('/globe.svg')) {
    place.image = '/placeholder.svg';
    replacedGlobes += 1;
  } else if (firstPhotoRef) {
    place.image = toApiPhotoUrl(firstPhotoRef);
    replacedGoogleImages += 1;
  } else {
    unresolved += 1;
  }

  if (Array.isArray(place.gallery) && place.gallery.length > 0) {
    place.gallery = place.gallery.map((item) => {
      const ref = extractPhotoRef(item);
      if (ref) {
        replacedGoogleGallery += 1;
        return toApiPhotoUrl(ref);
      }
      if (typeof item === 'string' && item.includes('/globe.svg')) {
        replacedGlobes += 1;
        return '/placeholder.svg';
      }
      return item;
    });
  }
}

fs.writeFileSync(seedPath, `${JSON.stringify(data, null, 2)}\n`);

console.log('Updated seed-data.json');
console.log({ replacedGoogleImages, replacedGoogleGallery, replacedGlobes, unresolved });
