import { NextRequest, NextResponse } from "next/server";
import guides from "../../../../data/guides.json";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const group = searchParams.get("group");

  const filtered = (guides as Array<Record<string, unknown>>).filter((guide) => {
    const categoryMatch = category ? guide.category === category : true;
    const groupMatch = group ? guide.group === group : true;
    return categoryMatch && groupMatch;
  });

  return NextResponse.json({
    count: filtered.length,
    results: filtered,
  });
}
