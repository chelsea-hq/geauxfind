import { NextRequest, NextResponse } from "next/server";
import { compactPlace, fallbackPicks, placeBySlugMap } from "@/lib/ai-places";
import { buildSearchContext } from "@/lib/search-context";
import { callVeniceChat, extractJson } from "@/lib/venice";

type VibeResponse = {
  summary: string;
  results: Array<{ slug: string; why: string }>;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();

    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const candidates = buildSearchContext(prompt, 120).map(compactPlace);
    const content = await callVeniceChat({
      maxTokens: 650,
      temperature: 0.6,
      messages: [
        { role: "system", content: "You are an Acadiana outing concierge. Return only JSON." },
        {
          role: "user",
          content: `User vibe request: ${prompt}\n\nCandidate places:\n${JSON.stringify(candidates)}\n\nReturn JSON: {\"summary\": string, \"results\": [{\"slug\": string, \"why\": string}]} with 5-8 results.`,
        },
      ],
    });

    const parsed = extractJson<VibeResponse>(content);
    const map = placeBySlugMap();
    const results = (parsed.results || [])
      .map((item) => {
        const place = map.get(item.slug);
        if (!place) return null;
        return { ...place, why: item.why || "Matches your vibe." };
      })
      .filter(Boolean)
      .slice(0, 8);

    if (!results.length) throw new Error("No vibe results");

    return NextResponse.json({ summary: parsed.summary || "Your curated vibe match.", results });
  } catch {
    const results = fallbackPicks(6).map((place) => ({ ...place, why: "Highly rated, versatile local favorite." }));
    return NextResponse.json({ summary: "Here are trusted local picks while AI warms up.", results });
  }
}
