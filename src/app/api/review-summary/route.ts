import { NextRequest, NextResponse } from "next/server";
import { allPlaces } from "@/lib/ai-places";
import { callVeniceChat } from "@/lib/venice";

export async function GET(request: NextRequest) {
  const placeParam = request.nextUrl.searchParams.get("place")?.trim();
  if (!placeParam) return NextResponse.json({ error: "place is required" }, { status: 400 });

  const places = await allPlaces();
  const place = places.find((item) => item.slug === placeParam || item.name.toLowerCase() === placeParam.toLowerCase());
  if (!place) return NextResponse.json({ error: "Place not found" }, { status: 404 });

  try {
    const summary = await callVeniceChat({
      maxTokens: 260,
      temperature: 0.55,
      messages: [
        { role: "system", content: "You summarize what locals say about places in a short, balanced, warm style." },
        {
          role: "user",
          content: `Write a 2-3 sentence \"What People Say\" summary for this place.\nName: ${place.name}\nCategory: ${place.category}\nCuisine: ${place.cuisine || "n/a"}\nRating: ${place.rating}\nPrice: ${place.price_level || place.price}\nTags: ${(place.smartTags || place.tags || []).join(", ")}\nDescription: ${place.description}`,
        },
      ],
    });

    return NextResponse.json({ summary: summary || "Locals consistently praise the quality, flavor, and welcoming atmosphere here." });
  } catch {
    return NextResponse.json({ summary: `${place.name} is known around ${place.city} for dependable quality, strong ${place.category} vibes, and a solid ${place.rating.toFixed(1)}-star reputation.` });
  }
}
