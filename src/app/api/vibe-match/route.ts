import { NextRequest, NextResponse } from "next/server";
import { allPlaces, compactPlace, placeBySlugMap } from "@/lib/ai-places";
import { buildSearchContext } from "@/lib/search-context";
import { callVeniceChat, extractJson } from "@/lib/venice";

type VibeResponse = {
  summary: string;
  results: Array<{ slug: string; why: string }>;
};

/** Shuffle array in place (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a diverse candidate pool:
 * - Some keyword-matched results
 * - Some random high-rated places the AI hasn't seen before
 * - Some from less-common categories
 * This prevents the AI from always picking the same popular spots.
 */
function buildDiverseCandidates(prompt: string, city?: string): ReturnType<typeof compactPlace>[] {
  // Get keyword matches (max 40)
  const keywordMatches = buildSearchContext(prompt, 40);
  const keywordSlugs = new Set(keywordMatches.map((p) => p.slug));

  // Filter by city if provided
  const pool = city
    ? allPlaces.filter((p) => p.city.toLowerCase() === city.toLowerCase())
    : allPlaces;

  // Get random places NOT in keyword matches for diversity
  const remaining = pool.filter((p) => !keywordSlugs.has(p.slug));
  const randomPicks = shuffle(remaining).slice(0, 40);

  // Get some from underrepresented categories
  const categories = [...new Set(allPlaces.map((p) => p.category))];
  const categoryPicks: typeof allPlaces = [];
  for (const cat of categories) {
    const catPlaces = remaining.filter((p) => p.category === cat);
    if (catPlaces.length > 0) {
      categoryPicks.push(...shuffle(catPlaces).slice(0, 5));
    }
  }

  // Combine and dedupe
  const seen = new Set<string>();
  const combined: typeof allPlaces = [];
  for (const place of [...keywordMatches, ...categoryPicks, ...randomPicks]) {
    if (!seen.has(place.slug)) {
      seen.add(place.slug);
      combined.push(place);
    }
  }

  return combined.slice(0, 80).map(compactPlace);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { prompt?: string; city?: string };
    const prompt = body.prompt?.trim();
    const city = body.city?.trim();

    if (!prompt) return NextResponse.json({ error: "Prompt is required" }, { status: 400 });

    const candidates = buildDiverseCandidates(prompt, city);
    const cityInstruction = city
      ? `The user is in ${city} — strongly prefer places in or very near ${city}. `
      : "";

    const content = await callVeniceChat({
      maxTokens: 700,
      temperature: 0.85, // Higher temp = more creative/varied picks
      messages: [
        {
          role: "system",
          content:
            "You are an Acadiana local who knows EVERY spot — not just the famous ones. " +
            "You love recommending hidden gems, neighborhood joints, and underrated favorites alongside the classics. " +
            "Mix it up! Include at least 2 lesser-known or surprising picks. Return only JSON.",
        },
        {
          role: "user",
          content:
            `User vibe: ${prompt}\n${cityInstruction}\n` +
            `Candidate places (pick from these, but VARY your choices — don't always pick the obvious ones):\n` +
            `${JSON.stringify(candidates)}\n\n` +
            `Return JSON: {"summary": string, "results": [{"slug": string, "why": string}]} with 6-8 results. ` +
            `Include a mix of well-known and hidden gems. Each "why" should be specific to the user's vibe, not generic.`,
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
    // Fallback: random diverse picks instead of always the same featured places
    const randomFallback = shuffle(allPlaces.filter((p) => p.rating >= 4.0)).slice(0, 6);
    const results = randomFallback.map((place) => ({
      ...place,
      why: "A local favorite worth checking out.",
    }));
    return NextResponse.json({ summary: "Here are some great local picks for you.", results });
  }
}
