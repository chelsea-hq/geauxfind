import { NextResponse } from "next/server";
import { BusinessClaim } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";

const FILE = "business-claims.json";

export async function GET() {
  const claims = await readJsonFile<BusinessClaim[]>(FILE, []);
  return NextResponse.json(claims);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const claim: BusinessClaim = {
      id: crypto.randomUUID(),
      placeSlug: String(body?.placeSlug || "").trim(),
      businessName: String(body?.businessName || "").trim(),
      claimantName: String(body?.claimantName || "").trim(),
      email: String(body?.email || "").trim().toLowerCase(),
      phone: String(body?.phone || "").trim(),
      role: (body?.role || "owner") as BusinessClaim["role"],
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    if (!claim.placeSlug || !claim.businessName || !claim.claimantName || !claim.email || !claim.phone) {
      return NextResponse.json({ error: "Missing required claim fields." }, { status: 400 });
    }

    const claims = await readJsonFile<BusinessClaim[]>(FILE, []);
    claims.unshift(claim);
    await writeJsonFile(FILE, claims);

    return NextResponse.json({ success: true, claim, message: "Claim pending review" });
  } catch {
    return NextResponse.json({ error: "Unable to submit claim." }, { status: 500 });
  }
}
