import { ImageResponse } from "next/og";

export const runtime = "edge";

// GET /api/og?title=…&subtitle=…&kicker=…
// Returns a 1200×630 PNG share card. Cached aggressively by social
// scrapers (Facebook/Twitter/iMessage), so use ?v=N to bust.
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
            padding: "72px 80px",
            background: "linear-gradient(135deg, #7a1326 0%, #bf1f34 45%, #d46a2a 75%, #e59d39 100%)",
            color: "white",
            fontFamily: "Georgia, serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 26, letterSpacing: 6, color: "rgba(255,255,255,0.8)" }}>
              {kicker}
            </span>
            <span style={{ fontSize: 44, color: "#f4c869" }}>⚜</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <h1
              style={{
                fontSize: 84,
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
              paddingTop: 24,
              borderTop: "1px solid rgba(255,255,255,0.25)",
            }}
          >
            <span style={{ fontSize: 30, fontWeight: 700, letterSpacing: 1 }}>GeauxFind</span>
            <span style={{ fontSize: 24, color: "rgba(255,255,255,0.75)" }}>geauxfind.vercel.app</span>
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
    // get a valid image. Never return a 500 to a scraper — that kills the
    // preview card permanently in some caches.
    return Response.redirect(new URL("/og-image.png", req.url), 302);
  }
}
