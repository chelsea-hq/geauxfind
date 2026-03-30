import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { CommunityRecsData, topicFromInput, upsertTopicFromContent } from "@/lib/dump-parser";
import { createAdminClient } from "@/lib/supabase";

const COMMUNITY_RECS_FILE = path.join(process.cwd(), "data", "community-recs.json");

async function readCommunityRecs(): Promise<CommunityRecsData> {
  try {
    const raw = await fs.readFile(COMMUNITY_RECS_FILE, "utf8");
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

export async function POST(request: NextRequest) {
  const expectedKey = process.env.GEAUXFIND_INGEST_KEY;
  const providedKey = request.headers.get("x-api-key") || "";

  if (!expectedKey || providedKey !== expectedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const topic = String(body?.topic || "").trim();
    const content = String(body?.content || "");
    const source = String(body?.source || "discord").trim() || "discord";

    if (!topic) return NextResponse.json({ error: "topic is required" }, { status: 400 });
    if (!content.trim()) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const existing = await readCommunityRecs();
    const topicMeta = topicFromInput(topic);
    const { output, placesFound, newMentions } = upsertTopicFromContent({
      existing,
      topicMeta,
      content,
      source,
    });

    // Keep JSON write for backward compatibility
    await fs.writeFile(COMMUNITY_RECS_FILE, `${JSON.stringify(output, null, 2)}\n`, "utf8");

    // Also persist raw dump + parsed payload in Supabase (best effort)
    try {
      const supabase = createAdminClient();
      const supabaseUntyped = supabase as unknown as {
        from: (table: string) => {
          insert: (values: {
            raw_text: string;
            source: string;
            processed: boolean;
            parsed_items: { topic: unknown; placesFound: number; newMentions: number };
            items_created: number;
            processed_at: string;
          }) => Promise<{ error: unknown }>;
        };
      };
      const { error } = await supabaseUntyped.from("intake_dumps").insert({
        raw_text: content,
        source,
        processed: true,
        parsed_items: {
          topic: topicMeta,
          placesFound,
          newMentions,
        },
        items_created: placesFound,
        processed_at: new Date().toISOString(),
      });

      if (error) throw error;
    } catch (supabaseError) {
      console.error("Failed to write intake_dumps row:", supabaseError);
    }

    return NextResponse.json({
      success: true,
      topic: topicMeta.name,
      placesFound,
      newMentions,
    });
  } catch {
    return NextResponse.json({ error: "Failed to ingest community dump" }, { status: 500 });
  }
}
