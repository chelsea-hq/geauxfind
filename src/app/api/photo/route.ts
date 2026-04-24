import { NextRequest, NextResponse } from "next/server";

// Proxies Google Places photo references through our server so the API key
// never leaks to the client. Falls back to a placeholder SVG on any failure
// (missing key, upstream 4xx/5xx, network error) so place cards never show
// a broken image.

const PLACEHOLDER_FALLBACK = "/placeholders/default.svg";

function redirectToPlaceholder(request: NextRequest) {
  const url = new URL(PLACEHOLDER_FALLBACK, request.nextUrl.origin);
  return NextResponse.redirect(url, 302);
}

export async function GET(request: NextRequest) {
  const photoRef = request.nextUrl.searchParams.get("ref");
  if (!photoRef) return redirectToPlaceholder(request);

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return redirectToPlaceholder(request);

  const upstream = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${apiKey}`;

  try {
    const response = await fetch(upstream, { next: { revalidate: 86_400 } });
    if (!response.ok) return redirectToPlaceholder(request);

    const buffer = await response.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800",
      },
    });
  } catch {
    return redirectToPlaceholder(request);
  }
}
