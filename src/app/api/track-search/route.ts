import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { normalizeQuery } from "@/lib/trends";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { query?: string };
    const query = normalizeQuery(body.query || "");

    if (!query || query.length < 2) {
      return NextResponse.json({ ok: false, error: "Query required" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "data", "search-trends.json");
    const raw = await fs.readFile(filePath, "utf-8").catch(() => "{\"queries\":[]}");
    const parsed = JSON.parse(raw) as { queries?: Array<{ query: string; timestamp: string }> };

    const next = [
      ...(parsed.queries || []),
      { query, timestamp: new Date().toISOString() },
    ].slice(-3000);

    await fs.writeFile(filePath, JSON.stringify({ queries: next }, null, 2), "utf-8");
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Unable to track" }, { status: 500 });
  }
}
