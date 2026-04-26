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
            {/* GeauxFind brand pin — rounded teardrop with cream interior, gold fleur + swoosh */}
            <svg width="120" height="120" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
              <path d="M64 10c-22 0-39.5 17-39.5 38 0 14 7 26 16 36 4.5 5 9 9 13 12 4 3 7 5 8.5 6.5 1 1 2.5 1 3.5 0 1.5-1.5 4.5-3.5 8.5-6.5 4-3 8.5-7 13-12 9-10 16-22 16-36 0-21-17.5-38-39-38Z" fill="#A32929" stroke="#8B1A1A" strokeWidth="2.5" />
              <path d="M40 44c0-13 11-23 24-23s24 10 24 23-11 22-24 22-24-9-24-22Z" fill="#FAF8F5" />
              <path d="M64 28c-2.4 3-2.2 7 .5 9.5-3.8 1.3-6.9 4.2-8.4 8.2-2.5-.6-5.2.2-7 2 1.8 2 4.5 2.8 7 2.3.2 1.4.6 2.8 1.3 4.1-2.3 1-4.1 3.1-4.6 5.6 2.4 1 5.3.4 7.2-1.2 2 2.3 4.6 4 7.5 4.6V69h3.5v-6c2.9-.6 5.5-2.3 7.5-4.6 1.9 1.6 4.8 2.2 7.2 1.2-.5-2.5-2.3-4.6-4.6-5.6.7-1.3 1.1-2.7 1.3-4.1 2.5.5 5.2-.3 7-2.3-1.8-1.8-4.5-2.6-7-2-1.5-4-4.6-6.9-8.4-8.2 2.7-2.5 2.9-6.5.5-9.5H64Z" fill="#D4A843" />
              <path d="M58 78c2 5 6 9 6 14 0 4-3 7-3 11 1.5-2 4-4 6-6 3-3 6-6 6-10 0-5-4-9-7-14-2 2-6 3-8 5Z" fill="#D4A843" />
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
