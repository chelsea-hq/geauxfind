import { NextRequest, NextResponse } from "next/server";
import { getPlaceBySlug } from "@/lib/supabase-data";

export async function GET(_: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ place });
}
