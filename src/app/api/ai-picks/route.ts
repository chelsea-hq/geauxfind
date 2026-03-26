import { NextRequest, NextResponse } from "next/server";
import { allPlaces, compactPlace, fallbackPicks, placeBySlugMap, timeOfDayLabel } from "@/lib/ai-places";
import { callVeniceChat, extractJson } from "@/lib/venice";

type AiPicksResponse = { picks: Array<{ slug: string; why: string }>; vibe: string };

export async function GET(request: NextRequest) {
  const mood = request.nextUrl.searchParams.get("mood")?.trim();
  const cuisine = request.nextUrl.searchParams.get("cuisine")?.trim();
  const time = timeOfDayLabel(request.nextUrl.searchParams.get("time") || undefined);

  const places = await allPlaces();
  const candidates = [...places]
    .filter((place) => (!cuisine ? true : `${place.cuisine} ${place.tags.join(" ")}`.toLowerCase().includes(cuisine.toLowerCase())))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 100)
    .map(compactPlace);

  try {
    const content = await callVeniceChat({
      maxTokens: 420,
      temperature: 0.65,
      messages: [
        {
          role: "system",
          content: "You are GeauxFind's local recommendation engine for Acadiana. Return only JSON.",
        },
        {
          role: "user",
          content: `Pick 4-6 places for this request. Time: ${time}. Mood: ${mood || "editor's choice"}. Cuisine: ${cuisine || "any"}.\n\nCandidate places JSON:\n${JSON.stringify(candidates)}\n\nReturn exactly this JSON shape: {\"vibe\": string, \"picks\": [{\"slug\": string, \"why\": string}]}`,
        },
      ],
    });

    const parsed = extractJson<AiPicksResponse>(content);
    const map = await placeBySlugMap();
    const picks = (parsed.picks || [])
      .map((item) => {
        const place = map.get(item.slug);
        if (!place) return null;
        return { ...place, why: item.why || "A strong local pick right now." };
      })
      .filter(Boolean)
      .slice(0, 6);

    if (!picks.length) throw new Error("No picks returned");

    return NextResponse.json({
      picks,
      vibe: parsed.vibe || `Top ${time} picks across Acadiana`,
    });
  } catch {
    const picks = (await fallbackPicks(6)).map((place) => ({ ...place, why: "Top-rated local favorite with proven community love." }));
    return NextResponse.json({ picks, vibe: `Editor's choice for ${time}` });
  }
}
