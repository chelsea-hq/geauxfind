import { createServerSupabaseClient } from "@/lib/supabase";
import { events as fallbackEvents, places as fallbackPlaces } from "@/data/mock-data";
import type { Event, Place } from "@/types";
import type { Database } from "@/types/supabase";

type PlaceRow = Database["public"]["Tables"]["places"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];

const priceMap: Record<number, "$" | "$$" | "$$$"> = {
  1: "$",
  2: "$$",
  3: "$$$",
  4: "$$$",
};

function isPlaceholder(url: string | null | undefined): boolean {
  if (!url) return true;
  return url.includes("placeholder") || url.endsWith(".svg");
}

function getPlaceImage(coverPhoto: string | null, photos: string[] | null): string {
  // Use cover_photo if it's a real image (not a placeholder)
  if (coverPhoto && !isPlaceholder(coverPhoto)) return coverPhoto;
  // Fall back to first photo from Google Places gallery
  if (photos && photos.length > 0) return photos[0];
  // Last resort placeholder
  return "/images/placeholders/place.svg";
}

function normalizeHours(hours: unknown): string[] {
  if (Array.isArray(hours)) return hours.map(String);
  if (hours && typeof hours === "object") {
    return Object.entries(hours as Record<string, unknown>).map(([k, v]) => `${k}: ${String(v)}`);
  }
  return [];
}

export function mapPlaceRow(row: PlaceRow): Place {
  return {
    slug: row.slug,
    name: row.name,
    category: (row.type as Place["category"]) || "food",
    cuisine: row.cuisine?.join(", ") || undefined,
    city: row.city,
    rating: Number(row.google_rating ?? row.community_rating ?? 0),
    price: priceMap[row.price_range ?? 2] || "$$",
    address: row.address || "",
    phone: row.phone || "",
    website: row.website || "",
    hours: normalizeHours(row.hours),
    description: row.description || row.short_description || "",
    image: getPlaceImage(row.cover_photo, row.photos),
    gallery: row.photos || [],
    tags: row.tags || [],
    reviews: [],
    google_place_id: row.google_place_id || undefined,
    price_level: row.price_range ? String(row.price_range) : undefined,
    smartTags: row.tags || [],
    featured: row.is_featured,
  };
}

export function mapEventRow(row: EventRow): Event {
  return {
    slug: row.slug,
    title: row.name,
    date: row.start_date,
    endDate: row.end_date || row.start_date,
    time: row.time || "TBD",
    venue: row.venue || "TBD",
    address: row.address,
    city: row.city || "Acadiana",
    description: row.description || "",
    category: (row.type as Event["category"]) || "community",
    image: row.cover_photo,
    link: row.source_url || row.ticket_url || row.website,
    source: (row.source as Event["source"]) || "facebook",
    free: Boolean(row.free),
    price: row.price,
  };
}

export async function getPlaces(options?: { limit?: number; category?: string; featured?: boolean; city?: string }): Promise<Place[]> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("places").select("*");
    if (options?.category) query = query.eq("type", options.category);
    if (options?.featured) query = query.eq("is_featured", true);
    if (options?.city) query = query.eq("city", options.city);
    query = query.order("google_rating", { ascending: false, nullsFirst: false });
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapPlaceRow);
  } catch (error) {
    console.error("getPlaces error:", error);
    let list = [...fallbackPlaces];
    if (options?.category) list = list.filter((p) => p.category === options.category);
    if (options?.featured) list = list.filter((p) => p.featured);
    if (options?.city) list = list.filter((p) => p.city === options.city);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }
}

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from("places").select("*").eq("slug", slug).maybeSingle();
    if (error) throw error;
    return data ? mapPlaceRow(data) : null;
  } catch (error) {
    console.error("getPlaceBySlug error:", error);
    return fallbackPlaces.find((p) => p.slug === slug) || null;
  }
}

export async function searchPlaces(queryText: string, limit = 20): Promise<Place[]> {
  const query = queryText.trim();
  if (!query) return [];

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from("places")
      .select("*")
      .textSearch("fts", query, { type: "websearch", config: "english" })
      .limit(limit);
    if (error) throw error;
    return (data || []).map(mapPlaceRow);
  } catch (error) {
    console.error("searchPlaces error:", error);
    const q = query.toLowerCase();
    return fallbackPlaces
      .filter((p) => `${p.name} ${p.description} ${p.city} ${(p.tags || []).join(" ")}`.toLowerCase().includes(q))
      .slice(0, limit);
  }
}

export async function getEvents(options?: { startDate?: string; endDate?: string; category?: string; limit?: number }): Promise<Event[]> {
  try {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from("events").select("*");
    if (options?.startDate) query = query.gte("start_date", options.startDate);
    if (options?.endDate) query = query.lte("start_date", options.endDate);
    if (options?.category) query = query.eq("type", options.category);
    query = query.order("start_date", { ascending: true });
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map(mapEventRow);
  } catch (error) {
    console.error("getEvents error:", error);
    let list = [...fallbackEvents];
    if (options?.startDate) list = list.filter((e) => e.date >= options.startDate!);
    if (options?.endDate) list = list.filter((e) => e.date <= options.endDate!);
    if (options?.category) list = list.filter((e) => e.category === options.category);
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }
}

export async function getUpcomingEvents(limit = 10): Promise<Event[]> {
  const today = new Date().toISOString().slice(0, 10);
  return getEvents({ startDate: today, limit });
}
