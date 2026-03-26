import { NextRequest, NextResponse } from "next/server";
import { getPlaces, searchPlaces } from "@/lib/supabase-data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q")?.trim();
  const category = searchParams.get("category") || undefined;
  const city = searchParams.get("city") || undefined;
  const featured = searchParams.get("featured") === "true";
  const limitRaw = Number(searchParams.get("limit") || "0");
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;

  const places = q
    ? await searchPlaces(q, limit || 20)
    : await getPlaces({ category, city, featured, limit });

  return NextResponse.json({ places });
}
