import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const photoRef = request.nextUrl.searchParams.get("ref");

  if (!photoRef) {
    return NextResponse.json({ error: "Missing ref parameter" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const url = `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${apiKey}`;

  try {
    const response = await fetch(url, { next: { revalidate: 86_400 } });

    if (!response.ok) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}
