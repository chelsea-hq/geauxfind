import { NextRequest, NextResponse } from "next/server";
import { readJsonFile } from "@/lib/community-data";
import type { BusinessClaimSubmission } from "@/lib/claim-types";

const FILE = "claims.json";

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug")?.trim();

  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const claims = await readJsonFile<BusinessClaimSubmission[]>(FILE, []);
  const exists = claims.some((claim) => claim.slug === slug && claim.status === "pending");

  return NextResponse.json({ slug, claimed: exists });
}
