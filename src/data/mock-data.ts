import seedData from "../../scripts/seed-data.json";
import eventsData from "../../data/events.json";
import { Event, Place } from "@/types";
import { filterOperational } from "@/lib/place-status";

// Recipes and editorial copy live in a dataset-free module so client
// components can import them without pulling seed-data.json into the bundle.
export { recipes, weekendHighlights } from "@/data/static-content";

type SeedData = Place[] | { places?: Place[] };
const normalizedSeed = seedData as SeedData;
const rawPlaces: Place[] = Array.isArray(normalizedSeed) ? normalizedSeed : (normalizedSeed.places ?? []);

// Filter closed businesses (see data/closed-businesses.json) out of every
// page view. Import `allPlaces` only for admin/debug contexts.
export const places: Place[] = filterOperational(rawPlaces);
export const allPlaces: Place[] = rawPlaces;

export const events: Event[] = eventsData as Event[];
