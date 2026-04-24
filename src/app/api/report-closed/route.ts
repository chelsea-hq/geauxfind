import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";

type ClosedReport = {
  id: string;
  slug: string;
  placeName: string;
  reason: string;
  reporterEmail?: string;
  sourceUrl?: string;
  createdAt: string;
  status: "pending" | "confirmed" | "dismissed";
};

export const runtime = "nodejs";

function clean(s: unknown, max = 300): string {
  if (typeof s !== "string") return "";
  return s.slice(0, max).trim();
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const slug = clean(body.slug, 120);
  const placeName = clean(body.placeName, 140);
  const reason = clean(body.reason, 500);
  const reporterEmail = clean(body.email, 120);
  const sourceUrl = clean(body.sourceUrl, 300);

  if (!slug || !placeName) {
    return NextResponse.json({ ok: false, error: "slug_and_placeName_required" }, { status: 400 });
  }

  const record: ClosedReport = {
    id: crypto.randomUUID(),
    slug,
    placeName,
    reason: reason || "User reported as closed",
    reporterEmail: reporterEmail || undefined,
    sourceUrl: sourceUrl || undefined,
    createdAt: new Date().toISOString(),
    status: "pending",
  };

  const existing = await readJsonFile<ClosedReport[]>("closed-reports.json", []);
  existing.push(record);
  await writeJsonFile("closed-reports.json", existing);

  const slugCount = existing.filter((r) => r.slug === slug && r.status !== "dismissed").length;
  return NextResponse.json({
    ok: true,
    id: record.id,
    reportsForPlace: slugCount,
    threshold: 3,
    willAutoDemote: slugCount >= 3,
  });
}

export async function GET() {
  return NextResponse.json({ ok: false, error: "POST only" }, { status: 405 });
}
