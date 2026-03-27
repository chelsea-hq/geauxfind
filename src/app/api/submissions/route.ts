import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";
import type { NewBusinessSubmission } from "@/lib/claim-types";

const FILE = "submissions.json";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    const category = String(body?.category || "").trim();
    const city = String(body?.city || "").trim();
    const address = String(body?.address || "").trim();

    if (!name || !category || !city || !address) {
      return NextResponse.json({ error: "Missing required business fields." }, { status: 400 });
    }

    const submissions = await readJsonFile<NewBusinessSubmission[]>(FILE, []);
    const submission: NewBusinessSubmission = {
      id: crypto.randomUUID(),
      name,
      category,
      cuisineType: String(body?.cuisineType || "").trim(),
      city,
      address,
      phone: String(body?.phone || "").trim(),
      website: String(body?.website || "").trim(),
      description: String(body?.description || "").trim(),
      hours: String(body?.hours || "").trim(),
      photos: Array.isArray(body?.photos) ? body.photos.map((photo: unknown) => String(photo)).filter(Boolean) : [],
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    submissions.unshift(submission);
    await writeJsonFile(FILE, submissions);

    return NextResponse.json({ success: true, id: submission.id });
  } catch {
    return NextResponse.json({ error: "Unable to submit business." }, { status: 500 });
  }
}
