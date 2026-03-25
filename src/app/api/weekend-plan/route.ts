import { NextRequest, NextResponse } from "next/server";
import { allPlaces, compactPlace, placeBySlugMap } from "@/lib/ai-places";
import { callVeniceChat, extractJson } from "@/lib/venice";

type Stop = { slot: "Morning" | "Lunch" | "Afternoon" | "Dinner" | "Evening"; slug: string; plan: string };
type PlanResponse = {
  overview: string;
  saturday: Stop[];
  sunday: Stop[];
};

const fallbackSlots: Stop["slot"][] = ["Morning", "Lunch", "Afternoon", "Dinner", "Evening"];

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      group?: "solo" | "date" | "family" | "friends";
      budget?: "$" | "$$" | "$$$";
      interests?: string[];
    };

    const group = body.group || "date";
    const budget = body.budget || "$$";
    const interests = Array.isArray(body.interests) ? body.interests : [];

    const candidates = [...allPlaces]
      .filter((place) => budget === "$$$" || place.price !== "$$$")
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 140)
      .map(compactPlace);

    const content = await callVeniceChat({
      maxTokens: 1000,
      temperature: 0.65,
      messages: [
        { role: "system", content: "You create realistic Acadiana weekend itineraries. Return only JSON." },
        {
          role: "user",
          content: `Build a Saturday + Sunday itinerary. Group: ${group}. Budget: ${budget}. Interests: ${interests.join(", ") || "Food"}. Use only candidate slugs.\n\nCandidates:\n${JSON.stringify(candidates)}\n\nReturn JSON:\n{\"overview\": string, \"saturday\": [{\"slot\":\"Morning|Lunch|Afternoon|Dinner|Evening\",\"slug\": string, \"plan\": string}], \"sunday\": [same shape]}`,
        },
      ],
    });

    const parsed = extractJson<PlanResponse>(content);
    const map = placeBySlugMap();

    const hydrate = (stops: Stop[]) =>
      stops
        .map((stop) => {
          const place = map.get(stop.slug);
          if (!place) return null;
          return { ...stop, place };
        })
        .filter(Boolean);

    const saturday = hydrate(parsed.saturday || []);
    const sunday = hydrate(parsed.sunday || []);

    if (!saturday.length || !sunday.length) throw new Error("Incomplete itinerary");

    return NextResponse.json({ overview: parsed.overview || "Your ideal Acadiana weekend.", saturday, sunday });
  } catch {
    const top = [...allPlaces].sort((a, b) => b.rating - a.rating).slice(0, 10);
    const saturday = fallbackSlots.map((slot, index) => ({ slot, plan: "Enjoy a local favorite.", place: top[index % top.length], slug: top[index % top.length].slug }));
    const sunday = fallbackSlots.map((slot, index) => ({ slot, plan: "Keep the weekend rolling with a community staple.", place: top[(index + 5) % top.length], slug: top[(index + 5) % top.length].slug }));
    return NextResponse.json({ overview: "Fallback weekend plan with top-rated places.", saturday, sunday });
  }
}
