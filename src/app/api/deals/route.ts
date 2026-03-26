import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";

interface CommunityDeal {
  id: string;
  restaurant: string;
  deal: string;
  category: string;
  submittedBy: string;
  expiresAt?: string;
  upvotes: number;
  createdAt: string;
  status: "approved" | "queued";
}

const FILE = "deals.json";

interface DealsFile {
  dealOfTheDay: unknown;
  featuredPartners: unknown[];
  categories: string[];
  communityDeals: CommunityDeal[];
}

export async function GET() {
  const data = await readJsonFile<DealsFile>(FILE, {
    dealOfTheDay: null,
    featuredPartners: [],
    categories: [],
    communityDeals: [],
  });
  return NextResponse.json(data.communityDeals.filter((d) => d.status === "approved"));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const restaurant = String(body?.restaurant || "").trim();
    const deal = String(body?.deal || "").trim();
    const category = String(body?.category || "Daily Special").trim();
    const submittedBy = String(body?.submittedBy || "Anonymous").trim() || "Anonymous";
    const expiresAt = body?.expiresAt ? String(body.expiresAt) : undefined;

    if (!restaurant || !deal) {
      return NextResponse.json({ error: "Restaurant and deal description are required." }, { status: 400 });
    }

    const newDeal: CommunityDeal = {
      id: crypto.randomUUID(),
      restaurant,
      deal,
      category,
      submittedBy,
      ...(expiresAt ? { expiresAt } : {}),
      upvotes: 0,
      createdAt: new Date().toISOString(),
      status: "queued",
    };

    const data = await readJsonFile<DealsFile>(FILE, {
      dealOfTheDay: null,
      featuredPartners: [],
      categories: [],
      communityDeals: [],
    });
    data.communityDeals.unshift(newDeal);
    await writeJsonFile(FILE, data);

    return NextResponse.json({ success: true, status: "queued", deal: newDeal });
  } catch {
    return NextResponse.json({ error: "Unable to submit deal right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ error: "Missing deal id." }, { status: 400 });

    const data = await readJsonFile<DealsFile>(FILE, {
      dealOfTheDay: null,
      featuredPartners: [],
      categories: [],
      communityDeals: [],
    });
    const deal = data.communityDeals.find((d) => d.id === id);
    if (!deal) return NextResponse.json({ error: "Deal not found." }, { status: 404 });

    deal.upvotes = (deal.upvotes || 0) + 1;
    await writeJsonFile(FILE, data);
    return NextResponse.json({ success: true, upvotes: deal.upvotes });
  } catch {
    return NextResponse.json({ error: "Unable to upvote." }, { status: 500 });
  }
}
