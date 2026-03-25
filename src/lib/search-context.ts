import seedData from "../../scripts/seed-data.json";
import { events, recipes } from "@/data/mock-data";
import { Event, Place, Recipe } from "@/types";

type SeedData = {
  places: Place[];
};

const places = (seedData as SeedData).places;

const tokenize = (input: string): string[] =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 1);

const searchableText = (place: Place): string => {
  return [
    place.name,
    place.category,
    place.cuisine ?? "",
    place.city,
    place.address,
    place.description,
    ...(place.tags ?? []),
  ]
    .join(" ")
    .toLowerCase();
};

export function buildSearchContext(query: string, limit = 50): Place[] {
  const queryTokens = tokenize(query);

  if (!queryTokens.length) {
    return [...places]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  const scored = places
    .map((place) => {
      const text = searchableText(place);
      let score = 0;

      for (const token of queryTokens) {
        if (place.name.toLowerCase().includes(token)) score += 6;
        if ((place.category ?? "").toLowerCase().includes(token)) score += 5;
        if ((place.city ?? "").toLowerCase().includes(token)) score += 4;
        if ((place.tags ?? []).some((tag) => tag.toLowerCase().includes(token))) score += 4;
        if ((place.description ?? "").toLowerCase().includes(token)) score += 3;
        if ((place.cuisine ?? "").toLowerCase().includes(token)) score += 3;

        const tokenRegex = new RegExp(`\\b${token}\\b`, "g");
        const matches = text.match(tokenRegex)?.length ?? 0;
        score += Math.min(matches, 4);
      }

      // Slight boost for high-rated places so recommendations feel quality-first
      score += place.rating * 0.35;

      return { place, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.place.rating - a.place.rating;
    })
    .slice(0, limit)
    .map(({ place }) => place);

  if (scored.length >= Math.min(10, limit)) {
    return scored;
  }

  const topRatedFallback = [...places]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit - scored.length);

  return [...scored, ...topRatedFallback].slice(0, limit);
}

export function buildDatasetSummary() {
  const categories = Array.from(new Set(places.map((p) => p.category))).sort();
  const cities = Array.from(new Set(places.map((p) => p.city))).sort();

  const topRatedByCategory = categories.map((category) => {
    const picks = places
      .filter((place) => place.category === category)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((p) => ({ name: p.name, rating: p.rating, slug: p.slug, city: p.city }));

    return { category, picks };
  });

  return {
    totalPlaces: places.length,
    categories,
    cities,
    topRatedByCategory,
  };
}

export function getCurrentEvents(): Event[] {
  return events;
}

export function getFeaturedRecipes(): Recipe[] {
  return recipes;
}
