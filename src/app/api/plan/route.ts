import { NextRequest, NextResponse } from "next/server";
import { allPlaces, compactPlace, placeBySlugMap } from "@/lib/ai-places";
import { callVeniceChat, extractJson } from "@/lib/venice";

type DayPart = "Morning" | "Afternoon" | "Evening";

type ItineraryStop = {
  time: string;
  slug: string;
  note: string;
  dayPart: DayPart;
  hiddenGem?: boolean;
};

type PlanResponse = {
  headline: string;
  overview: string;
  hiddenGemReason: string;
  stops: ItineraryStop[];
};

function estimateDriveMins(currentCity: string, nextCity: string) {
  if (currentCity === nextCity) return 8;
  return 15;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      city?: string;
      duration?: "half-day" | "full-day" | "weekend";
      vibe?: "foodie" | "family" | "date-night" | "adventure" | "culture";
      regenerateSeed?: number;
    };

    const prompt = body.prompt?.trim() || "Plan my day in Acadiana";
    const city = body.city?.trim() || "Lafayette";
    const duration = body.duration || "full-day";
    const vibe = body.vibe || "foodie";

    const targetStops = duration === "half-day" ? 4 : duration === "weekend" ? 9 : 6;

    const places = await allPlaces();
    const cityPool = places.filter((p) => p.city.toLowerCase() === city.toLowerCase());
    const basePool = (cityPool.length > 20 ? cityPool : places)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 180)
      .map(compactPlace);

    const content = await callVeniceChat({
      maxTokens: 1200,
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "You are an Acadiana itinerary planner. Return only strict JSON. Build realistic routes that avoid zig-zagging and include at least one hidden gem.",
        },
        {
          role: "user",
          content:
            `Prompt: ${prompt}\nCity: ${city}\nDuration: ${duration}\nVibe: ${vibe}\nTarget stops: ${targetStops}\n` +
            `Use ONLY these places:\n${JSON.stringify(basePool)}\n\n` +
            `Return JSON: {"headline":string,"overview":string,"hiddenGemReason":string,"stops":[{"time":string,"slug":string,"note":string,"dayPart":"Morning|Afternoon|Evening","hiddenGem":boolean}]}`,
        },
      ],
    });

    const parsed = extractJson<PlanResponse>(content);
    const map = await placeBySlugMap();

    const hydrated = (parsed.stops || [])
      .map((stop) => {
        const place = map.get(stop.slug);
        if (!place) return null;
        return { ...stop, place };
      })
      .filter((stop): stop is ItineraryStop & { place: NonNullable<ReturnType<typeof map.get>> } => stop !== null)
      .slice(0, Math.max(4, targetStops));

    if (!hydrated.length) throw new Error("No itinerary");

    const withDrives = hydrated.map((stop, i) => {
      const next = hydrated[i + 1];
      return {
        ...stop,
        driveToNextMins: next ? estimateDriveMins(stop.place.city, next.place.city) : null,
      };
    });

    return NextResponse.json({
      headline: parsed.headline || "Your Acadiana game plan",
      overview: parsed.overview || "A locally-tuned itinerary with food, fun, and flavor.",
      hiddenGemReason: parsed.hiddenGemReason || "We slipped in at least one under-the-radar local favorite.",
      stops: withDrives,
    });
  } catch {
    const places = await allPlaces();
    const fallback = places
      .filter((p) => p.city.toLowerCase() === "lafayette")
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 6)
      .map((place, i) => ({
        time: ["9:00 AM", "11:00 AM", "1:00 PM", "3:00 PM", "6:00 PM", "8:00 PM"][i] || "10:00 AM",
        note: "A local favorite stop.",
        dayPart: i < 2 ? "Morning" : i < 4 ? "Afternoon" : "Evening",
        hiddenGem: i === 2,
        place,
        driveToNextMins: i < 5 ? 12 : null,
      }));

    return NextResponse.json({
      headline: "Lafayette flavor run",
      overview: "Fallback itinerary packed with top local spots.",
      hiddenGemReason: "One stop is marked as your hidden gem.",
      stops: fallback,
    });
  }
}
