import { NextResponse } from "next/server";
import { getSeasonalSignals, getTrending } from "@/lib/trends";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") || 10);

  return NextResponse.json({
    items: getTrending(Math.max(1, Math.min(limit, 30))),
    seasonal: getSeasonalSignals(),
  });
}
