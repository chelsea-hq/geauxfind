import fs from "node:fs/promises";
import path from "node:path";

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

function hasLateNightHours(hours = []) {
  return hours.some((line) => {
    const normalized = String(line).toLowerCase();
    if (normalized.includes("24 hours")) return true;
    const matches = [...normalized.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/g)];
    return matches.some((m) => {
      let hour = Number(m[1]) % 12;
      const minutes = Number(m[2] || 0);
      if (m[3] === "pm") hour += 12;
      return hour > 22 || (hour === 22 && minutes > 0);
    });
  });
}

function buildSmartTags(place) {
  const tags = (place.tags || []).map((t) => String(t).toLowerCase());
  const description = String(place.description || "").toLowerCase();
  const category = String(place.category || "").toLowerCase();
  const cuisine = String(place.cuisine || "").toLowerCase();
  const haystack = [description, category, cuisine, ...tags].join(" ");

  const smart = new Set();

  const ratingsTotal = Number(place.user_ratings_total || 0) || estimatedRatingsTotal(Number(place.rating || 0));
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

  data.places = data.places.map((place) => ({
    ...place,
    smartTags: buildSmartTags(place)
  }));

  await fs.writeFile(seedPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Updated ${data.places.length} places with smartTags.`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
