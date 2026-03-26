import { NextRequest, NextResponse } from "next/server";
import { buildSearchContext } from "@/lib/search-context";
import { allPlaces, compactPlace, placeBySlugMap } from "@/lib/ai-places";
import { callVeniceChat, extractJson } from "@/lib/venice";

type SmartResponse = {
  parsedIntent: string;
  results: Array<{ slug: string; why: string }>;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query) return NextResponse.json({ error: "Query is required" }, { status: 400 });

  try {
    const places = await allPlaces();
    const candidates = buildSearchContext(query, { limit: 120, sourcePlaces: places }).map(compactPlace);
    const content = await callVeniceChat({
      maxTokens: 500,
      temperature: 0.4,
      messages: [
        { role: "system", content: "You parse local search intent for Acadiana and rank candidates. Return only JSON." },
        {
          role: "user",
          content: `Search query: ${query}\n\nCandidates:\n${JSON.stringify(candidates)}\n\nReturn JSON: {\"parsedIntent\": string, \"results\": [{\"slug\": string, \"why\": string}]} with up to 12 ranked results.`,
        },
      ],
    });

    const parsed = extractJson<SmartResponse>(content);
    const map = await placeBySlugMap();
    const results = (parsed.results || [])
      .map((item) => {
        const place = map.get(item.slug);
        if (!place) return null;
        return { ...place, why: item.why || "Matches your request." };
      })
      .filter(Boolean)
      .slice(0, 12);

    if (!results.length) throw new Error("No AI ranked results");

    return NextResponse.json({ parsedIntent: parsed.parsedIntent || query, results });
  } catch {
    const places = await allPlaces();
    const fallback = buildSearchContext(query, { limit: 12, sourcePlaces: places }).map((place) => ({ ...place, why: "Keyword relevance match." }));
    return NextResponse.json({ parsedIntent: query, results: fallback });
  }
}
