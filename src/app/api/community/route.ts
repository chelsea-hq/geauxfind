import { NextResponse } from "next/server";
import { callVeniceChat, extractJson } from "@/lib/venice";
import { CommunitySubmission } from "@/types";
import { readJsonFile, writeJsonFile } from "@/lib/community-data";

const FILE = "community-submissions.json";

type ModResult = {
  decision: "approved" | "queued" | "rejected";
  reason: string;
};

async function moderateSubmission(text: string, placeName: string): Promise<ModResult> {
  if (!process.env.VENICE_API_KEY) {
    if (text.length < 8) return { decision: "rejected", reason: "Too short" };
    if (!/(lafayette|acadiana|breaux|new iberia|rayne|opelousas|cajun|bayou|boudin|crawfish|zydeco)/i.test(`${text} ${placeName}`)) {
      return { decision: "queued", reason: "Needs manual local relevance check" };
    }
    return { decision: "approved", reason: "Passed fallback moderation" };
  }

  try {
    const raw = await callVeniceChat({
      maxTokens: 180,
      temperature: 0.2,
      messages: [
        { role: "system", content: "You are a strict content moderator for a local Acadiana community feed. Return JSON only." },
        {
          role: "user",
          content: `Moderate this submission for spam, quality, and Acadiana relevance.\nReturn JSON: {\"decision\":\"approved|queued|rejected\",\"reason\":\"...\"}.\nPlace: ${placeName}\nText: ${text}`,
        },
      ],
    });

    const parsed = extractJson<ModResult>(raw);
    if (!["approved", "queued", "rejected"].includes(parsed.decision)) {
      return { decision: "queued", reason: "Model response ambiguous" };
    }
    return parsed;
  } catch {
    return { decision: "queued", reason: "Moderation service unavailable" };
  }
}

export async function GET() {
  const items = await readJsonFile<CommunitySubmission[]>(FILE, []);
  return NextResponse.json(items.filter((i) => i.moderation === "approved").sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const type = String(body?.type || "Food tip") as CommunitySubmission["type"];
    const placeName = String(body?.placeName || "").trim();
    const placeSlug = String(body?.placeSlug || "").trim();
    const text = String(body?.text || "").trim();
    const authorName = String(body?.authorName || "Anonymous Geaux").trim() || "Anonymous Geaux";
    const photoUrl = String(body?.photoUrl || "").trim();

    if (!placeName || !text) {
      return NextResponse.json({ error: "Place and tip text are required." }, { status: 400 });
    }

    const moderation = await moderateSubmission(text, placeName);

    const next: CommunitySubmission = {
      id: crypto.randomUUID(),
      type,
      placeName,
      ...(placeSlug ? { placeSlug } : {}),
      text,
      authorName,
      ...(photoUrl ? { photoUrl } : {}),
      moderation: moderation.decision,
      moderationReason: moderation.reason,
      createdAt: new Date().toISOString(),
    };

    const items = await readJsonFile<CommunitySubmission[]>(FILE, []);
    items.unshift(next);
    await writeJsonFile(FILE, items);

    if (moderation.decision === "rejected") {
      return NextResponse.json({ success: true, status: "dropped" });
    }

    return NextResponse.json({ success: true, status: moderation.decision, submission: next });
  } catch {
    return NextResponse.json({ error: "Unable to submit your Geaux right now." }, { status: 500 });
  }
}
