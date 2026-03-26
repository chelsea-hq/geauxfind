import { NextRequest, NextResponse } from "next/server";
import { getEvents, getUpcomingEvents } from "@/lib/supabase-data";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const upcoming = searchParams.get("upcoming") === "true";
  const category = searchParams.get("category") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const limitRaw = Number(searchParams.get("limit") || "0");
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;

  const events = upcoming
    ? await getUpcomingEvents(limit || 10)
    : await getEvents({ startDate, endDate, category, limit });

  return NextResponse.json({ events });
}
