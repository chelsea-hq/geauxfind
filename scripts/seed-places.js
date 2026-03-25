#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require("fs/promises");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SECRETS_PATH = path.resolve(ROOT, "..", "..", ".secrets.env");
const OUTPUT_PATH = path.resolve(__dirname, "seed-data.json");

const SEARCH_URL = "https://places.googleapis.com/v1/places:searchNearby";
const DETAILS_BASE_URL = "https://places.googleapis.com/v1";

const CITY_SEARCHES = [
  { city: "Lafayette", latitude: 30.2241, longitude: -92.0198, radius: 8000 },
  { city: "Broussard", latitude: 30.1469, longitude: -91.9611, radius: 5000 },
  { city: "Scott", latitude: 30.236, longitude: -92.0957, radius: 5000 },
  { city: "Youngsville", latitude: 30.0985, longitude: -91.9905, radius: 5000 },
  { city: "Breaux Bridge", latitude: 30.2735, longitude: -91.8993, radius: 5000 },
  { city: "Carencro", latitude: 30.3141, longitude: -92.049, radius: 5000 },
  { city: "New Iberia", latitude: 30.0035, longitude: -91.8188, radius: 6000 },
  { city: "Opelousas", latitude: 30.5335, longitude: -92.0815, radius: 5000 },
  { city: "Abbeville", latitude: 29.9744, longitude: -92.1343, radius: 5000 },
  { city: "Rayne", latitude: 30.2346, longitude: -92.2685, radius: 4000 },
  { city: "Crowley", latitude: 30.2138, longitude: -92.4446, radius: 4000 },
  { city: "Eunice", latitude: 30.4944, longitude: -92.4174, radius: 4000 },
  { city: "Henderson", latitude: 30.3146, longitude: -91.7907, radius: 4000 }
];

const SEARCH_TYPES = [
  "restaurant",
  "cafe",
  "bakery",
  "bar",
  "tourist_attraction",
  "park",
  "museum",
  "night_club",
  "performing_arts_theater",
  "farmers_market",
  "shopping_mall"
];

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.name",
  "places.types",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount"
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "name",
  "types",
  "displayName",
  "formattedAddress",
  "rating",
  "userRatingCount",
  "regularOpeningHours.weekdayDescriptions",
  "nationalPhoneNumber",
  "websiteUri",
  "googleMapsUri",
  "photos.name",
  "editorialSummary.text",
  "reviews.rating",
  "reviews.relativePublishTimeDescription",
  "reviews.text.text",
  "reviews.authorAttribution.displayName",
  "priceLevel"
].join(",");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getApiKey() {
  const envRaw = await fs.readFile(SECRETS_PATH, "utf8");
  const line = envRaw
    .split(/\r?\n/)
    .find((entry) => entry.startsWith("GOOGLE_PLACES_API_KEY="));

  if (!line) {
    throw new Error("GOOGLE_PLACES_API_KEY missing in .secrets.env");
  }

  return line.slice("GOOGLE_PLACES_API_KEY=".length).trim().replace(/^"|"$/g, "");
}

async function fetchJson(url, options, retries = 2) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const text = await response.text();
    if (retries > 0 && response.status >= 500) {
      await delay(350);
      return fetchJson(url, options, retries - 1);
    }
    throw new Error(`${response.status} ${response.statusText} :: ${text}`);
  }

  return response.json();
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function inferCategory(types = []) {
  if (types.some((type) => ["restaurant", "cafe", "bakery", "bar"].includes(type))) return "food";
  if (types.some((type) => ["night_club", "performing_arts_theater"].includes(type))) return "music";
  return "finds";
}

function inferCuisine(types = []) {
  if (types.includes("restaurant")) return "Restaurant";
  if (types.includes("cafe")) return "Cafe";
  if (types.includes("bakery")) return "Bakery";
  if (types.includes("bar")) return "Bar";
  if (types.includes("night_club")) return "Nightlife";
  if (types.includes("performing_arts_theater")) return "Performing Arts";
  if (types.includes("farmers_market")) return "Farmers Market";
  if (types.includes("shopping_mall")) return "Shopping";
  if (types.includes("museum")) return "Museum";
  if (types.includes("park")) return "Park";
  if (types.includes("tourist_attraction")) return "Attraction";
  return "Local Spot";
}

function inferPrice(priceLevel) {
  switch (priceLevel) {
    case "PRICE_LEVEL_FREE":
    case "PRICE_LEVEL_INEXPENSIVE":
      return "$";
    case "PRICE_LEVEL_MODERATE":
      return "$$";
    case "PRICE_LEVEL_EXPENSIVE":
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "$$$";
    default:
      return "$$";
  }
}

function photoUrl(photoName) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=1200&key=GOOGLE_PLACES_API_KEY`;
}

function normalizeReviews(reviews = []) {
  return reviews.slice(0, 3).map((review, idx) => ({
    id: `${slugify(review?.authorAttribution?.displayName || "reviewer")}-${idx + 1}`,
    author: review?.authorAttribution?.displayName || "Google User",
    rating: review?.rating || 0,
    comment: review?.text?.text || "",
    date: review?.relativePublishTimeDescription || "recent"
  }));
}

function mapToPlace(detail, city, slugSet) {
  const name = detail?.displayName?.text || "Unknown Place";
  const baseSlug = slugify(`${name}-${city}`);
  let slug = baseSlug;
  let bump = 2;
  while (slugSet.has(slug)) {
    slug = `${baseSlug}-${bump}`;
    bump += 1;
  }
  slugSet.add(slug);

  const photos = (detail?.photos || []).map((p) => p.name).filter(Boolean);
  const gallery = photos.slice(0, 6).map(photoUrl);

  return {
    slug,
    name,
    category: inferCategory(detail.types),
    cuisine: inferCuisine(detail.types),
    city,
    rating: detail.rating || 0,
    price: inferPrice(detail.priceLevel),
    address: detail.formattedAddress || "",
    phone: detail.nationalPhoneNumber || "",
    website: detail.websiteUri || detail.googleMapsUri || "",
    hours: detail?.regularOpeningHours?.weekdayDescriptions || [],
    description:
      detail?.editorialSummary?.text ||
      `${name} in ${city}.`,
    image: gallery[0] || "/globe.svg",
    gallery,
    tags: (detail.types || []).slice(0, 8),
    reviews: normalizeReviews(detail.reviews),
    google_place_id: detail.id || "",
    google_maps_url: detail.googleMapsUri || "",
    photo_references: photos,
    price_level: detail.priceLevel || ""
  };
}

async function searchNearby(apiKey, cityConfig, type) {
  const payload = {
    includedTypes: [type],
    maxResultCount: 20,
    locationRestriction: {
      circle: {
        center: {
          latitude: cityConfig.latitude,
          longitude: cityConfig.longitude
        },
        radius: cityConfig.radius
      }
    }
  };

  const result = await fetchJson(SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK
    },
    body: JSON.stringify(payload)
  });

  return result.places || [];
}

async function fetchDetails(apiKey, placeNameResource) {
  return fetchJson(`${DETAILS_BASE_URL}/${placeNameResource}`, {
    method: "GET",
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": DETAILS_FIELD_MASK
    }
  });
}

async function main() {
  const apiKey = await getApiKey();
  const discovered = new Map();

  console.log("Searching nearby places across Acadiana...");

  for (const city of CITY_SEARCHES) {
    console.log(`\nCity: ${city.city}`);
    for (const type of SEARCH_TYPES) {
      try {
        const places = await searchNearby(apiKey, city, type);
        for (const place of places) {
          if (!place?.id || !place?.name) continue;
          if (!discovered.has(place.id)) {
            discovered.set(place.id, { name: place.name, city: city.city });
          }
        }
        console.log(`  ${type}: +${places.length}`);
      } catch (error) {
        console.warn(`  ${type}: failed (${error.message.slice(0, 120)})`);
      }
      await delay(120);
    }
  }

  console.log(`\nUnique place candidates: ${discovered.size}`);
  console.log("Fetching place details...");

  const places = [];
  const slugSet = new Set();
  let processed = 0;

  for (const [id, item] of discovered.entries()) {
    try {
      const detail = await fetchDetails(apiKey, item.name);
      places.push(mapToPlace({ ...detail, id }, item.city, slugSet));
    } catch (error) {
      console.warn(`Detail failed for ${item.name}: ${error.message.slice(0, 140)}`);
    }

    processed += 1;
    if (processed % 25 === 0) {
      console.log(`  Progress: ${processed}/${discovered.size}`);
    }
    await delay(200);
  }

  places.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));

  await fs.writeFile(
    OUTPUT_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: places.length,
        places
      },
      null,
      2
    )}\n`,
    "utf8"
  );

  console.log(`\nWrote ${places.length} places to ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
