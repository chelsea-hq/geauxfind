import fs from "node:fs";
import path from "node:path";

const filePath = path.resolve(process.cwd(), "scripts/seed-data.json");
const raw = fs.readFileSync(filePath, "utf8");
const data = JSON.parse(raw);

const categoryRules = [
  { category: "food", keywords: ["restaurant", "grill", "seafood", "café", "cafe", "bakery", "diner", "kitchen", "bbq"] },
  { category: "music", keywords: ["bar", "lounge", "club", "saloon", "music", "dance"] },
  { category: "outdoors", keywords: ["park", "trail", "lake", "garden", "nature", "bayou"] },
  { category: "shopping", keywords: ["shop", "store", "boutique", "market", "antique"] },
  { category: "events", keywords: ["museum", "gallery", "theater", "theatre", "arena", "stadium"] },
];

const descriptionTemplates = {
  food: (name, city) => `${name} is a beloved ${city} spot serving up authentic Cajun flavors and local comfort classics. Come hungry and leave happy.` ,
  music: (name, city) => `${name} is where ${city} comes alive with live music, dancing, and great local energy through the week.` ,
  events: (name, city) => `${name} brings people together in ${city} for community events, performances, and memorable local moments.` ,
  outdoors: (name, city) => `${name} is a breath-of-fresh-air escape in ${city}, perfect for scenic walks, relaxing views, and easygoing adventures.` ,
  shopping: (name, city) => `${name} is a go-to ${city} local shopping stop with distinctive finds, neighborhood charm, and browse-worthy surprises.` ,
  finds: (name, city) => `${name} is one of ${city}'s best-kept local treasures, full of character and absolutely worth discovering.` ,
};

function hash(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rand01(seed, salt) {
  const h = hash(`${seed}:${salt}`);
  return (h % 100000) / 100000;
}

function pickCategory(place) {
  const text = [place.name, place.cuisine, ...(place.tags ?? [])].join(" ").toLowerCase();
  for (const rule of categoryRules) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) return rule.category;
  }
  return "finds";
}

function improvedRating(slug) {
  const r = rand01(slug, "rating");
  let value;
  if (r < 0.65) value = 4.0 + rand01(slug, "rating-main") * 0.6; // 4.0-4.6 (majority)
  else if (r < 0.9) value = 3.8 + rand01(slug, "rating-low") * 0.3; // 3.8-4.1
  else value = 4.6 + rand01(slug, "rating-high") * 0.3; // 4.6-4.9
  return Math.max(3.8, Math.min(4.9, Math.round(value * 10) / 10));
}

function reviewCount(slug) {
  const r = rand01(slug, "reviews");
  return Math.max(5, Math.min(180, Math.round(5 + Math.pow(r, 0.7) * 175)));
}

function isGenericDescription(place) {
  const desc = (place.description || "").trim();
  const escapedName = place.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const escapedCity = place.city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const genericPattern = new RegExp(`^${escapedName}\s+in\s+${escapedCity}[.!]?$`, "i");
  return desc.length < 50 || genericPattern.test(desc);
}

function buildReviews(place, count) {
  const original = Array.isArray(place.reviews) ? [...place.reviews] : [];
  if (original.length >= count) return original.slice(0, count);
  const fillers = Array.from({ length: count - original.length }).map((_, idx) => ({
    id: `${place.slug}-review-${idx + 1}`,
    author: "Local Explorer",
    rating: place.rating,
    comment: "",
    date: "recently",
  }));
  return [...original, ...fillers];
}

let recategorized = 0;
let descriptionsUpdated = 0;
let ratingsUpdated = 0;

for (const place of data.places) {
  const nextCategory = pickCategory(place);
  if (place.category !== nextCategory) {
    place.category = nextCategory;
    recategorized += 1;
  }

  if (isGenericDescription(place)) {
    const template = descriptionTemplates[place.category] ?? descriptionTemplates.finds;
    place.description = template(place.name, place.city);
    descriptionsUpdated += 1;
  }

  if (Number(place.rating) === 5) {
    place.rating = improvedRating(place.slug);
    const count = reviewCount(place.slug);
    place.reviews = buildReviews(place, count);
    ratingsUpdated += 1;
  }
}

fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);

console.log(`Updated ${descriptionsUpdated} descriptions`);
console.log(`Updated ${ratingsUpdated} ratings/review counts`);
console.log(`Recategorized ${recategorized} places`);
