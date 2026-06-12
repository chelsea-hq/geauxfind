/**
 * Shared helpers for seed-data place records.
 *
 * Canonical place schema invariants enforced here:
 * - hours: always an array of strings (one line per day/range)
 * - reviews: always an array of review objects; numeric counts live in google_review_count
 * - every place has a non-empty slug and a description of at least 40 chars
 * - no two records share a google_place_id or a normalized name|city key
 */

export function normToken(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function nameCityKey(place) {
  return `${normToken(place?.name)}|${normToken(place?.city || "lafayette")}`;
}

/** Strongest available identity for a place. */
export function identityKey(place) {
  return place?.google_place_id || nameCityKey(place);
}

/** Coerce hours into the canonical array-of-strings shape. */
export function normalizeHours(hours) {
  if (Array.isArray(hours)) {
    return hours.map((h) => String(h).trim()).filter(Boolean);
  }
  if (typeof hours === "string") {
    return hours
      .split(/\r?\n/)
      .map((h) => h.trim())
      .filter(Boolean);
  }
  return [];
}

const CATEGORY_LABELS = {
  food: "restaurant",
  music: "live music venue",
  events: "event venue",
  outdoors: "outdoor spot",
  shopping: "shop",
  stay: "place to stay",
  finds: "local spot",
};

function titleCase(value = "") {
  return String(value)
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

/**
 * Deterministic, fact-only description built from structured fields.
 * No invented praise, ratings, or reviews; only states what the record contains.
 */
export function composeDescription(place) {
  const name = String(place?.name || "").trim();
  const city = titleCase(String(place?.city || "Lafayette").trim());
  const cuisine = String(place?.cuisine || "").trim();
  const label =
    cuisine && !/^local spot$/i.test(cuisine)
      ? cuisine.toLowerCase()
      : CATEGORY_LABELS[place?.category] || "local spot";

  const parts = [`${name} is a ${label} in ${city}, Louisiana.`];

  const tags = (Array.isArray(place?.tags) ? place.tags : [])
    .map((t) => String(t).replace(/_/g, " ").trim().toLowerCase())
    .filter((t) => t && t.length <= 30)
    .slice(0, 3);
  if (tags.length) {
    parts.push(`Listed under ${tags.join(", ")}.`);
  }

  const street = String(place?.address || "").trim().split(",")[0].trim();
  // Only mention the address when it looks like a real street line.
  if (street && /\d/.test(street) && !/^united states$/i.test(street) && street.length <= 60) {
    parts.push(`Located at ${street}.`);
  }

  let description = parts.join(" ");
  if (description.length < 40) {
    description = `${parts[0]} Part of the GeauxFind Acadiana directory.`;
  }
  return description;
}

/** Normalize one place record into the canonical schema. Returns a new object. */
export function normalizePlace(place) {
  const out = { ...place };

  out.name = String(out.name || "").trim();
  out.city = String(out.city || "Lafayette").trim();
  out.slug = String(out.slug || "").trim();

  out.hours = normalizeHours(out.hours);

  if (!Array.isArray(out.reviews)) {
    // Legacy records stored a numeric review count in `reviews`.
    if (typeof out.reviews === "number" && !out.google_review_count) {
      out.google_review_count = out.reviews;
    }
    out.reviews = [];
  }

  if (String(out.description || "").trim().length < 40) {
    out.description = composeDescription(out);
  }

  return out;
}

/** A record is junk if it has no usable identity (no slug or no real name). */
export function isJunkPlace(place) {
  return !String(place?.slug || "").trim() || normToken(place?.name).length < 2;
}

function richness(place) {
  let score = 0;
  if (place.google_place_id) score += 100;
  score += Math.min(String(place.description || "").length, 200) / 10;
  score += (Array.isArray(place.reviews) ? place.reviews.length : 0) * 5;
  score += (Array.isArray(place.gallery) ? place.gallery.length : 0);
  score += (Array.isArray(place.photo_references) ? place.photo_references.length : 0);
  for (const f of ["phone", "website", "address"]) if (place[f]) score += 3;
  if (Array.isArray(place.hours) && place.hours.length) score += 5;
  return score;
}

const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/** Fill empty fields on `base` from `extra` without overwriting real data. */
function absorb(base, extra) {
  for (const [field, value] of Object.entries(extra)) {
    if (field === "slug") continue; // keeper's slug is canonical
    if (UNSAFE_KEYS.has(field)) continue; // scraped JSON: block prototype pollution
    const current = base[field];
    const isEmpty =
      current === undefined ||
      current === null ||
      current === "" ||
      (Array.isArray(current) && current.length === 0);
    const hasValue =
      value !== undefined &&
      value !== null &&
      value !== "" &&
      !(Array.isArray(value) && value.length === 0);
    if (isEmpty && hasValue) base[field] = value;
  }
  // Keep the highest review count seen across duplicates.
  if (
    typeof extra.google_review_count === "number" &&
    extra.google_review_count > (base.google_review_count || 0)
  ) {
    base.google_review_count = extra.google_review_count;
  }
  return base;
}

/**
 * Deduplicate by google_place_id first, then by normalized name|city.
 * The first-seen record keeps its slug (existing links stay valid); richer
 * duplicates donate their data via absorb(). Junk records are dropped.
 *
 * Returns { places, removed, junk, slugRemap } where slugRemap maps each
 * dropped slug to the kept slug.
 */
export function dedupePlaces(places) {
  const byKey = new Map();
  const order = [];
  const slugRemap = new Map();
  let junk = 0;

  for (const raw of places) {
    if (isJunkPlace(raw)) {
      junk += 1;
      continue;
    }
    const place = raw;
    // A record can match an existing group by place_id OR by name|city.
    const pidKey = place.google_place_id ? `pid:${place.google_place_id}` : null;
    const ncKey = `nc:${nameCityKey(place)}`;
    const existingKey = (pidKey && byKey.has(pidKey)) ? pidKey : (byKey.has(ncKey) ? ncKey : null);

    if (!existingKey) {
      const entry = { place, keys: [ncKey] };
      byKey.set(ncKey, entry);
      if (pidKey) {
        byKey.set(pidKey, entry);
        entry.keys.push(pidKey);
      }
      order.push(entry);
      continue;
    }

    const entry = byKey.get(existingKey);
    const keeper = entry.place;
    if (richness(place) > richness(keeper)) {
      // New record is richer: absorb keeper into it, but keep keeper's slug.
      const merged = absorb({ ...place, slug: keeper.slug }, keeper);
      entry.place = merged;
    } else {
      entry.place = absorb({ ...keeper }, place);
    }
    if (place.slug && place.slug !== entry.place.slug) {
      slugRemap.set(place.slug, entry.place.slug);
    }
    // Register any new alias keys for this group.
    if (pidKey && !byKey.has(pidKey)) {
      byKey.set(pidKey, entry);
      entry.keys.push(pidKey);
    }
    // A richer record may have renamed the group (merge takes its name):
    // register the merged record's name|city too, so a later pid-less record
    // under the new name joins this group instead of starting a duplicate.
    const mergedNcKey = `nc:${nameCityKey(entry.place)}`;
    if (!byKey.has(mergedNcKey)) {
      byKey.set(mergedNcKey, entry);
      entry.keys.push(mergedNcKey);
    }
  }

  const result = order.map((e) => e.place);
  return {
    places: result,
    removed: places.length - junk - result.length,
    junk,
    slugRemap,
  };
}
