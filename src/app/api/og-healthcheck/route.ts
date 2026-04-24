import { NextResponse } from "next/server";
import { SITE_URL } from "@/lib/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Verifies that /api/og returns a valid PNG. Used by /admin/submissions
// and can be hit by uptime monitoring so you know share cards are working.
// Probes the same origin the request came in on — works identically in
// local dev, preview, and production.
export async function GET(request: Request) {
  const started = Date.now();
  const origin = new URL(request.url).origin;
  const target = `${origin}/api/og?title=healthcheck&subtitle=verifying+share+cards&v=${Date.now()}`;
  try {
    const res = await fetch(target, { cache: "no-store" });
    const elapsed = Date.now() - started;
    const contentType = res.headers.get("content-type") || "";
    const size = Number(res.headers.get("content-length") || "0");
    const ok = res.ok && contentType.startsWith("image/");
    return NextResponse.json(
      {
        ok,
        target,
        origin,
        prodOrigin: SITE_URL,
        status: res.status,
        contentType,
        size,
        elapsedMs: elapsed,
        staticFallback: `${origin}/og-image.png`,
        notes: ok
          ? "Dynamic OG generator returned a valid image."
          : "Dynamic OG generator is NOT returning an image — the static /og-image.png will be used as fallback.",
      },
      { status: ok ? 200 : 503 },
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: String((e as Error)?.message || e),
        origin,
        prodOrigin: SITE_URL,
        staticFallback: `${origin}/og-image.png`,
        notes: "Dynamic OG generator unreachable — static fallback in use.",
      },
      { status: 503 },
    );
  }
}
