import fs from "node:fs/promises";
import path from "node:path";
import { normalizeHours } from "./lib/places.mjs";

const seedPath = path.resolve(process.cwd(), "scripts/seed-data.json");

const CAJUN_TERMS = ["cajun", "creole", "boudin", "crawfish", "gumbo", "etouffee", "étouffée", "po-boy", "po boy"];
const MUSIC_TERMS = ["music", "live", "band", "venue", "jazz", "zydeco"];
const LATE_NIGHT_TERMS = ["bar", "lounge", "nightclub"];
const FAMILY_TERMS = ["family", "park", "playground", "ice_cream", "bakery"];
const DATE_NIGHT_TERMS = ["fine_dining", "wine_bar", "upscale", "romantic", "cocktail"];

const hasAny = (text, terms) => terms.some((term) => text.includes(term));

function estimatedRatingsTotal(rating) {
  if (rating >= 4.8) return 22;
  if (rating >= 4.6) return 35;
  if (rating >= 4.4) return 55;
  if (rating >= 4.2) return 90;
  return 130;
}

/**
 * Extract every time mentioned on an hours line as minutes-since-midnight.
 * Handles "11 PM", "11:30 p.m.", "midnight", "noon", and unambiguous
 * 24-hour times like "23:30".
 */
function parseTimeTokens(line) {
  const text = String(line).toLowerCase().replace(/[\u202f\u00a0]/g, " ");
  const tokens = [];

  for (const m of text.matchAll(/(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m\.?/g)) {
    let hour = Number(m[1]) % 12;
    if (m[3] === "p") hour += 12;
    tokens.push({ index: m.index, minutes: hour * 60 + Number(m[2] || 0) });
  }
  for (const m of text.matchAll(/\bmidnight\b/g)) tokens.push({ index: m.index, minutes: 0 });
  for (const m of text.matchAll(/\bnoon\b/g)) tokens.push({ index: m.index, minutes: 12 * 60 });
  // 24-hour times are only unambiguous when hour >= 13 and no meridiem follows.
  for (const m of text.matchAll(/\b(1[3-9]|2[0-3]):([0-5]\d)\b(?!\s*[ap])/g)) {
    tokens.push({ index: m.index, minutes: Number(m[1]) * 60 + Number(m[2]) });
  }

  return tokens.sort((a, b) => a.index - b.index).map((t) => t.minutes);
}

const LATE_CLOSE_MINUTES = 22 * 60; // open past 10:00 PM counts as late night

function hasLateNightHours(hours) {
  return normalizeHours(hours).some((line) => {
    const normalized = String(line).toLowerCase();
    if (normalized.includes("24 hours") || normalized.includes("open 24")) return true;
    const times = parseTimeTokens(normalized);
    if (!times.length) return false;
    // The last time on a line is the closing time when the line is a range.
    const close = times[times.length - 1];
    if (close > LATE_CLOSE_MINUTES) return true;
    // An early-morning "closing" time (midnight to 5 AM) means an overnight
    // range like "10 PM - 2 AM", but only when the line actually has a range;
    // a lone early time is an opening time, not a close.
    return times.length >= 2 && close <= 5 * 60;
  });
}

function buildSmartTags(place) {
  const tags = (place.tags || []).map((t) => String(t).toLowerCase());
  const description = String(place.description || "").toLowerCase();
  const category = String(place.category || "").toLowerCase();
  const cuisine = String(place.cuisine || "").toLowerCase();
  const haystack = [description, category, cuisine, ...tags].join(" ");

  const smart = new Set();

  const ratingsTotal =
    Number(place.user_ratings_total || 0) ||
    Number(place.google_review_count || 0) ||
    estimatedRatingsTotal(Number(place.rating || 0));
  if (Number(place.rating || 0) >= 4.3 && ratingsTotal <= 60) smart.add("Hidden Gem");

  if (hasLateNightHours(place.hours) || hasAny(haystack, LATE_NIGHT_TERMS)) smart.add("Late Night");

  if (
    hasAny(haystack, FAMILY_TERMS) ||
    hasAny(haystack, ["family restaurant", "family-friendly", "kid", "kids"]) ||
    tags.some((t) => t.includes("family"))
  ) {
    smart.add("Kid-Friendly");
  }

  if ((hasAny(haystack, DATE_NIGHT_TERMS) && Number(place.rating || 0) >= 4.2) || hasAny(haystack, ["romantic", "cocktail"])) {
    smart.add("Date Night");
  }

  if (String(place.price_level || "") === "1" || String(place.price || "") === "$") smart.add("Budget Friendly");

  if (hasAny(haystack, CAJUN_TERMS)) smart.add("Cajun Classic");

  if (hasAny(haystack, MUSIC_TERMS)) smart.add("Live Music");

  if (!Array.isArray(place.smartTags)) smart.add("New Drop");

  return [...smart];
}

async function run() {
  const raw = await fs.readFile(seedPath, "utf8");
  const data = JSON.parse(raw);
  const places = (Array.isArray(data) ? data : (data.places ?? [])).map((place) => ({
    ...place,
    smartTags: buildSmartTags(place)
  }));

  await fs.writeFile(seedPath, `${JSON.stringify(places, null, 2)}\n`, "utf8");
  console.log(`Updated ${places.length} places with smartTags.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
