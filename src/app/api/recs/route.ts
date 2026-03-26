import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";

export interface RecSubmission {
  id: string;
  placeName: string;
  recommendation: string;
  category: string;
  submittedBy: string;
  upvotes: number;
  createdAt: string;
  status: "approved" | "queued";
}

const FILE = "rec-submissions.json";

// Supabase integration stub — swap readJsonFile/writeJsonFile for Supabase calls
// when NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
// Table: intake_dumps (id, place_name, recommendation, category, submitted_by, upvotes, created_at, status)

function isSpam(text: string, place: string): boolean {
  if (text.length < 5) return true;
  if (/https?:\/\//i.test(text)) return true;
  if (!place.trim()) return true;
  return false;
}

export async function GET() {
  const items = await readJsonFile<RecSubmission[]>(FILE, []);
  const approved = items
    .filter((r) => r.status === "approved")
    .sort((a, b) => b.upvotes - a.upvotes || b.createdAt.localeCompare(a.createdAt));
  return NextResponse.json(approved);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const placeName = String(body?.placeName || "").trim();
    const recommendation = String(body?.recommendation || "").trim();
    const category = String(body?.category || "Restaurant").trim();
    const submittedBy = String(body?.submittedBy || "Anonymous").trim() || "Anonymous";

    if (!placeName || !recommendation) {
      return NextResponse.json({ error: "Place name and recommendation are required." }, { status: 400 });
    }
    if (isSpam(recommendation, placeName)) {
      return NextResponse.json({ success: true, status: "dropped" });
    }

    // Naive auto-approval: local keywords present → approve immediately
    const isLocal =
      /(lafayette|acadiana|breaux|cajun|boudin|crawfish|broussard|youngsville|carencro|scott|abbeville)/i.test(
        `${placeName} ${recommendation}`
      );

    const rec: RecSubmission = {
      id: crypto.randomUUID(),
      placeName,
      recommendation,
      category,
      submittedBy,
      upvotes: 0,
      createdAt: new Date().toISOString(),
      status: isLocal ? "approved" : "queued",
    };

    const items = await readJsonFile<RecSubmission[]>(FILE, []);
    items.unshift(rec);
    await writeJsonFile(FILE, items);

    return NextResponse.json({ success: true, status: rec.status, rec });
  } catch {
    return NextResponse.json({ error: "Unable to submit right now." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const id = String(body?.id || "");
    if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

    const items = await readJsonFile<RecSubmission[]>(FILE, []);
    const rec = items.find((r) => r.id === id);
    if (!rec) return NextResponse.json({ error: "Not found." }, { status: 404 });

    rec.upvotes = (rec.upvotes || 0) + 1;
    await writeJsonFile(FILE, items);
    return NextResponse.json({ success: true, upvotes: rec.upvotes });
  } catch {
    return NextResponse.json({ error: "Unable to upvote." }, { status: 500 });
  }
}
