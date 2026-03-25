#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const SOURCE = "The Crawfish App";
const SOURCE_LINK = "https://www.thecrawfishapp.com/VendorSearchUi";
const API_URL = "https://www.thecrawfishapp.com/api/VendorSearch";

const CITIES = [
  "Lafayette",
  "Broussard",
  "Youngsville",
  "Scott",
  "Breaux Bridge",
  "Rayne",
  "Abbeville",
  "Crowley",
  "Church Point",
  "Opelousas",
  "Carencro",
  "Henderson",
  "New Iberia"
];

const COLUMNS = [
  "name",
  "boiledPricePerPound",
  "livePricePerPound",
  "lowerRatingBound",
  "rating",
  "boiledCrawfishSize",
  "liveCrawfishSize",
  "phoneNumber",
  "address",
  "city",
  "state",
  "zipCode"
];

const normalize = (value) =>
  String(value ?? "")
    .toLowerCase()
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9]/g, "");

function parsePrice(priceText) {
  const match = String(priceText ?? "").match(/\$\s*([\d.]+)/);
  return match ? Number.parseFloat(match[1]) : null;
}

function decodeHtml(text) {
  return String(text ?? "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

function sizeLabel(sizeCode) {
  switch (String(sizeCode ?? "")) {
    case "1":
      return "Small";
    case "2":
      return "Medium";
    case "3":
      return "Large";
    default:
      return null;
  }
}

function makeDtPayload(city, start = 0, length = 200) {
  const params = new URLSearchParams();
  params.set("draw", "1");
  params.set("start", String(start));
  params.set("length", String(length));
  params.set("search[value]", `_-_${city}_-_`);
  params.set("search[regex]", "false");
  params.set("order[0][column]", "0");
  params.set("order[0][dir]", "asc");

  COLUMNS.forEach((col, i) => {
    params.set(`columns[${i}][data]`, col);
    params.set(`columns[${i}][name]`, "");
    params.set(`columns[${i}][searchable]`, "true");
    params.set(`columns[${i}][orderable]`, "true");
    params.set(`columns[${i}][search][value]`, "");
    params.set(`columns[${i}][search][regex]`, "false");
  });

  return params;
}

async function fetchCityVendors(city) {
  const vendors = [];
  const pageLength = 200;
  let start = 0;
  let recordsFiltered = 0;

  while (start === 0 || start < recordsFiltered) {
    const body = makeDtPayload(city, start, pageLength);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8"
      },
      body
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    recordsFiltered = Number(payload.recordsFiltered ?? 0);
    const rows = Array.isArray(payload.data) ? payload.data : [];

    for (const row of rows) {
      const rowCity = decodeHtml(row.city);
      if (normalize(rowCity) !== normalize(city)) continue;

      vendors.push({
        name: decodeHtml(row.name),
        address: decodeHtml(row.address),
        city: rowCity,
        boiledPricePerLb: parsePrice(row.boiledPricePerPound),
        boiledPriceText: decodeHtml(row.boiledPricePerPound),
        livePricePerLb: parsePrice(row.livePricePerPound),
        livePriceText: decodeHtml(row.livePricePerPound),
        boiledSize: sizeLabel(row.boiledCrawfishSize),
        liveSize: sizeLabel(row.liveCrawfishSize),
        rating: row.rating ? Number(row.rating) : null,
        phone: decodeHtml(row.phoneNumber),
        hours: null,
        updatedAt: decodeHtml(row.updatedAt)
      });
    }

    if (!rows.length) break;
    start += pageLength;
  }

  return vendors;
}

function dedupeVendors(vendors) {
  const byKey = new Map();
  for (const vendor of vendors) {
    const key = `${normalize(vendor.name)}|${normalize(vendor.address)}|${normalize(vendor.city)}`;
    if (!byKey.has(key)) {
      byKey.set(key, vendor);
      continue;
    }

    const existing = byKey.get(key);
    const pick = {
      ...existing,
      ...vendor,
      boiledPricePerLb: vendor.boiledPricePerLb ?? existing.boiledPricePerLb,
      livePricePerLb: vendor.livePricePerLb ?? existing.livePricePerLb,
      rating: vendor.rating ?? existing.rating,
      phone: vendor.phone || existing.phone,
      updatedAt: vendor.updatedAt || existing.updatedAt
    };
    byKey.set(key, pick);
  }

  return [...byKey.values()];
}

function buildPriceSummary(vendor) {
  const parts = [];
  if (vendor.boiledPricePerLb != null) parts.push(`Boiled $${vendor.boiledPricePerLb.toFixed(2)}/lb`);
  if (vendor.livePricePerLb != null) parts.push(`Live $${vendor.livePricePerLb.toFixed(2)}/lb`);
  if (vendor.boiledSize) parts.push(`Boiled size: ${vendor.boiledSize}`);
  if (vendor.liveSize) parts.push(`Live size: ${vendor.liveSize}`);
  if (vendor.rating != null) parts.push(`Rating: ${vendor.rating}/5`);
  return parts.length ? parts.join(" • ") : "Call for daily market price";
}

function mergeWithEditorial(seasonData, scrapedPayload) {
  const spots = Array.isArray(seasonData.spots) ? seasonData.spots : [];
  const scrapedVendors = Array.isArray(scrapedPayload.vendors) ? scrapedPayload.vendors : [];

  const byNameCity = new Map(
    scrapedVendors.map((v) => [`${normalize(v.name)}|${normalize(v.city)}`, v])
  );

  const matchedKeys = new Set();
  const mergedSpots = spots.map((spot) => {
    const directKey = `${normalize(spot.name)}|${normalize(spot.city)}`;
    let match = byNameCity.get(directKey);

    if (!match) {
      const n = normalize(spot.name);
      const c = normalize(spot.city);
      match = scrapedVendors.find(
        (v) => normalize(v.city) === c && (normalize(v.name).includes(n) || n.includes(normalize(v.name)))
      );
    }

    if (!match) return spot;

    matchedKeys.add(`${normalize(match.name)}|${normalize(match.city)}|${normalize(match.address)}`);

    return {
      ...spot,
      city: match.city || spot.city,
      address: match.address || spot.address,
      hours: match.hours || spot.hours,
      pricePerLbEstimate: match.boiledPricePerLb ?? spot.pricePerLbEstimate,
      priceSummary: buildPriceSummary(match),
      phone: match.phone || spot.phone,
      rating: match.rating ?? spot.rating
    };
  });

  const extraSpots = scrapedVendors
    .filter((v) => !matchedKeys.has(`${normalize(v.name)}|${normalize(v.city)}|${normalize(v.address)}`))
    .map((v) => ({
      name: v.name,
      address: v.address,
      city: v.city,
      hours: v.hours || "Call for seasonal hours",
      priceSummary: buildPriceSummary(v),
      pricePerLbEstimate: v.boiledPricePerLb,
      description: "Listed via The Crawfish App.",
      tags: ["Price Tracker"],
      website: null,
      phone: v.phone || null,
      rating: v.rating ?? null
    }))
    .sort((a, b) => {
      const aPrice = a.pricePerLbEstimate ?? Number.POSITIVE_INFINITY;
      const bPrice = b.pricePerLbEstimate ?? Number.POSITIVE_INFINITY;
      return aPrice - bPrice || a.name.localeCompare(b.name);
    });

  const allBoiled = scrapedVendors.map((v) => v.boiledPricePerLb).filter((v) => v != null);
  const min = allBoiled.length ? Math.min(...allBoiled) : null;
  const max = allBoiled.length ? Math.max(...allBoiled) : null;

  const priceRange =
    min != null && max != null
      ? `$${min.toFixed(2)} - $${max.toFixed(2)}/lb boiled`
      : seasonData.priceTracker?.currentRange ?? "Call for current prices";

  return {
    ...seasonData,
    priceTracker: {
      ...seasonData.priceTracker,
      currentRange: priceRange,
      source: "Prices via The Crawfish App",
      sourceLink: SOURCE_LINK,
      lastUpdated: scrapedPayload.lastUpdated
    },
    spots: mergedSpots,
    extraSpots
  };
}

async function main() {
  const lastUpdated = new Date().toISOString();
  const cityResults = [];
  const allVendors = [];
  const errors = [];

  for (const city of CITIES) {
    try {
      const vendors = await fetchCityVendors(city);
      cityResults.push({ city, count: vendors.length });
      allVendors.push(...vendors);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ city, error: message });
      cityResults.push({ city, count: 0, error: message });
    }
  }

  const vendors = dedupeVendors(allVendors).sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

  const pricePayload = {
    source: SOURCE,
    sourceLink: SOURCE_LINK,
    lastUpdated,
    cities: cityResults,
    totalVendors: vendors.length,
    errors,
    vendors
  };

  const dataDir = path.join(projectRoot, "data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, "crawfish-prices.json"), `${JSON.stringify(pricePayload, null, 2)}\n`, "utf8");

  const seasonPath = path.join(dataDir, "crawfish-season.json");
  const seasonData = JSON.parse(await readFile(seasonPath, "utf8"));
  const merged = mergeWithEditorial(seasonData, pricePayload);
  await writeFile(seasonPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  console.log(`Saved ${vendors.length} vendors to data/crawfish-prices.json`);
  if (errors.length) {
    console.warn(`Completed with ${errors.length} city errors.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
