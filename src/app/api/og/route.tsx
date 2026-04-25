import { ImageResponse } from "next/og";

export const runtime = "edge";

// GET /api/og?title=…&subtitle=…&kicker=…
// Returns a 1200×630 PNG share card with the GeauxFind brand pin logo.
// Cached aggressively by social scrapers; use ?v=N to bust.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const title = (searchParams.get("title") || "GeauxFind").slice(0, 120);
    const subtitle = (searchParams.get("subtitle") || "Discover the Heart of Acadiana").slice(0, 200);
    const kicker = (searchParams.get("kicker") || "LAFAYETTE · LOUISIANA").slice(0, 60);

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "64px 80px",
            background: "linear-gradient(135deg, #7a1326 0%, #bf1f34 45%, #d46a2a 75%, #e59d39 100%)",
            color: "white",
            fontFamily: "Georgia, serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 26, letterSpacing: 6, color: "rgba(255,255,255,0.85)" }}>
              {kicker}
            </span>
            {/* GeauxFind brand pin — inline SVG so the edge runtime renders it without external fetch */}
            <svg width="96" height="96" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
              <path d="M64 14c-20.4 0-37 16.5-37 36.9 0 24.9 28.3 53.4 34.6 59.4a3.6 3.6 0 0 0 4.8 0C72.7 104.3 101 75.8 101 50.9 101 30.5 84.4 14 64 14Z" fill="#FAF8F5" stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
              <circle cx="64" cy="50" r="21" fill="#8B1A1A" />
              <path d="M64 34c-2.7 3.3-2.5 7.8.6 10.6-4.3 1.4-7.7 4.7-9.3 9.1-2.8-.7-5.8.2-7.9 2.2 2 2.2 5.1 3.1 7.9 2.6.2 1.6.6 3.2 1.4 4.6-2.6 1.1-4.6 3.5-5.2 6.3 2.7 1.1 5.9.4 8-1.3 2.2 2.6 5.1 4.4 8.4 5.1V80h3.9v-6.7a15.3 15.3 0 0 0 8.4-5.1c2.1 1.7 5.3 2.4 8 1.3-.6-2.8-2.6-5.2-5.2-6.3.8-1.4 1.2-3 1.4-4.6 2.8.5 5.9-.4 7.9-2.6-2.1-2-5.1-2.9-7.9-2.2a15.8 15.8 0 0 0-9.3-9.1c3.1-2.8 3.3-7.3.6-10.6H64Z" fill="#D4A843" />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <h1
              style={{
                fontSize: 80,
                lineHeight: 1.05,
                margin: 0,
                maxWidth: 1000,
                fontWeight: 400,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: 32,
                lineHeight: 1.35,
                margin: 0,
                color: "rgba(255,255,255,0.92)",
                maxWidth: 960,
                fontFamily: "Helvetica, Arial, sans-serif",
              }}
            >
              {subtitle}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 700, letterSpacing: 1 }}>GeauxFind</span>
            <span style={{ fontSize: 24, color: "rgba(255,255,255,0.85)" }}>geauxfind.com</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "cache-control": "public, immutable, no-transform, max-age=31536000",
        },
      },
    );
  } catch {
    // On any error, 302 to the static fallback so social scrapers always
    // get a valid image. Never return a 500 to a scraper.
    return Response.redirect(new URL("/og-image.png", req.url), 302);
  }
}
