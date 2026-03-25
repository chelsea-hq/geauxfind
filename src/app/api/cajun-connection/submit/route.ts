import { NextResponse } from "next/server";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";

export const runtime = "nodejs";

const FILE = "cajun-connection-submissions.json";

type Submission = {
  id: string;
  type: "business" | "fluencer";
  payload: Record<string, unknown>;
  submittedAt: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = body?.type === "fluencer" ? "fluencer" : "business";

    const submission: Submission = {
      id: crypto.randomUUID(),
      type,
      payload: body,
      submittedAt: new Date().toISOString(),
    };

    const submissions = await readJsonFile<Submission[]>(FILE, []);
    submissions.unshift(submission);
    await writeJsonFile(FILE, submissions);

    return NextResponse.json({
      success: true,
      message: "Thanks! We'll review your submission within 48 hours.",
    });
  } catch {
    return NextResponse.json({ success: false, error: "Unable to submit." }, { status: 500 });
  }
}
