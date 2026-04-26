import { NextResponse } from "next/server";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  topicFromInput,
  upsertTopicFromContent,
  type CommunityRecsData,
} from "@/lib/dump-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RECS_PATH = path.join(process.cwd(), "data", "community-recs.json");

function isAuthed(token: string | null): boolean {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) return false;
  return !!token && token === secret;
}

async function readRecs(): Promise<CommunityRecsData> {
  try {
    const raw = await readFile(RECS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return {
      topics: Array.isArray(parsed?.topics) ? parsed.topics : [],
      businesses: Array.isArray(parsed?.businesses) ? parsed.businesses : [],
      ...parsed,
    };
  } catch {
    return { topics: [], businesses: [] };
  }
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const headerToken = req.headers.get("x-admin-token");
  const queryToken = url.searchParams.get("token");
  if (!isAuthed(headerToken || queryToken)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { topic?: string; content?: string; commit?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const topic = (body.topic || "").trim();
  const content = (body.content || "").trim();
  const commit = body.commit !== false;

  if (!topic) return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  if (!content || content.length < 30) {
    return NextResponse.json({ error: "Content too short — paste the full thread" }, { status: 400 });
  }

  const existing = await readRecs();
  const topicMeta = topicFromInput(topic);

  const result = upsertTopicFromContent({
    existing,
    topicMeta,
    content,
    source: "facebook-group",
  });

  if (commit) {
    await writeFile(RECS_PATH, JSON.stringify(result.output, null, 2) + "\n");
  }

  return NextResponse.json({
    topic: result.topic,
    placesFound: result.placesFound,
    newMentions: result.newMentions,
    absoluteMentions: result.absoluteMentions,
    committed: commit,
    viewUrl: `/community?topic=${encodeURIComponent(topicMeta.slug)}`,
  });
}
