import { Place } from "@/types";
import { places } from "@/data/mock-data";

export const allPlaces = places;

export function placeBySlugMap() {
  return new Map(allPlaces.map((place) => [place.slug, place]));
}

export function timeOfDayLabel(input?: string) {
  const value = (input || "").toLowerCase();
  if (["morning", "afternoon", "evening", "latenight"].includes(value)) return value;

  const hour = new Date().getHours();
  if (hour < 11) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 22) return "evening";
  return "latenight";
}

export function fallbackPicks(limit = 6): Place[] {
  return [...allPlaces]
    .filter((p) => p.featured)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}

export function compactPlace(place: Place) {
  return {
    slug: place.slug,
    name: place.name,
    category: place.category,
    cuisine: place.cuisine,
    city: place.city,
    rating: place.rating,
    price: place.price,
    address: place.address,
    description: place.description,
    image: place.image,
    tags: place.tags,
  };
}
