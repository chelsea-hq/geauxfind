import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/supabase-data";

// Serve a slim, client-safe search index (slug, name, city, category, cuisine,
// tags, image, rating, short excerpt). Built server-side so the full place
// dataset never ships in any client JS bundle.
export const runtime = "nodejs";
// The Supabase server client reads cookies, so this route can never be
// statically rendered; declare it dynamic instead of letting the build
// attempt static rendering and log an error. CDN caching still applies
// via the Cache-Control header below.
export const dynamic = "force-dynamic";

export async function GET() {
  const items = await getSearchIndex();
  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}
