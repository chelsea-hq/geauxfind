import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";
import type { BusinessClaimSubmission } from "@/lib/claim-types";

const FILE = "claims.json";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const slug = String(body?.slug || "").trim();
    const businessName = String(body?.businessName || "").trim();
    const claimantName = String(body?.verification?.claimantName || "").trim();
    const email = String(body?.verification?.email || "").trim().toLowerCase();

    if (!slug || !businessName || !claimantName || !email) {
      return NextResponse.json({ error: "Missing required claim fields." }, { status: 400 });
    }

    const claims = await readJsonFile<BusinessClaimSubmission[]>(FILE, []);
    const duplicate = claims.some((claim) => claim.slug === slug && claim.status === "pending");
    if (duplicate) {
      return NextResponse.json({ error: "This business already has a pending claim." }, { status: 409 });
    }

    const submission: BusinessClaimSubmission = {
      id: crypto.randomUUID(),
      slug,
      businessName,
      verification: {
        claimantName,
        role: String(body?.verification?.role || "").trim(),
        email,
        phone: String(body?.verification?.phone || "").trim(),
      },
      listingUpdates: {
        logoFileName: body?.listingUpdates?.logoFileName ? String(body.listingUpdates.logoFileName) : undefined,
        coverFileName: body?.listingUpdates?.coverFileName ? String(body.listingUpdates.coverFileName) : undefined,
        description: String(body?.listingUpdates?.description || "").trim(),
        hours: String(body?.listingUpdates?.hours || "").trim(),
        website: String(body?.listingUpdates?.website || "").trim(),
        socialLinks: {
          instagram: body?.listingUpdates?.socialLinks?.instagram ? String(body.listingUpdates.socialLinks.instagram) : undefined,
          facebook: body?.listingUpdates?.socialLinks?.facebook ? String(body.listingUpdates.socialLinks.facebook) : undefined,
          tiktok: body?.listingUpdates?.socialLinks?.tiktok ? String(body.listingUpdates.socialLinks.tiktok) : undefined,
          x: body?.listingUpdates?.socialLinks?.x ? String(body.listingUpdates.socialLinks.x) : undefined,
        },
      },
      firstDeal: body?.firstDeal?.title || body?.firstDeal?.details ? {
        title: String(body?.firstDeal?.title || "").trim(),
        details: String(body?.firstDeal?.details || "").trim(),
        expiresOn: body?.firstDeal?.expiresOn ? String(body.firstDeal.expiresOn) : undefined,
      } : undefined,
      plan: "free",
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    claims.unshift(submission);
    await writeJsonFile(FILE, claims);

    return NextResponse.json({ success: true, id: submission.id });
  } catch {
    return NextResponse.json({ error: "Unable to submit claim." }, { status: 500 });
  }
}
