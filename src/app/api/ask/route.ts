import { promises as fs } from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import {
  buildSearchContext,
  getCurrentEvents,
  getFeaturedRecipes,
} from "@/lib/search-context";
import { allPlaces } from "@/lib/ai-places";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

type FacebookContextItem = {
  title?: string;
  summary?: string;
  source?: string;
  date?: string;
  type?: string;
  tags?: string[];
};

async function getFacebookContext() {
  try {
    const filePath = path.join(process.cwd(), "data", "facebook-feed.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as { items?: FacebookContextItem[] };

    return (parsed.items || [])
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 12)
      .map(
        (item) =>
          `- ${item.title || "Community update"} | type: ${item.type || "general"} | source: ${item.source || "Facebook"} | date: ${item.date || "unknown"} | summary: ${item.summary || "n/a"} | tags: ${(item.tags || []).join(", ")}`
      )
      .join("\n");
  } catch {
    return "";
  }
}

async function formatPrompt(question: string, location?: { lat?: number; lng?: number; city?: string }) {
  const places = await allPlaces();
  const categories = Array.from(new Set(places.map((p) => p.category))).sort();
  const cities = Array.from(new Set(places.map((p) => p.city))).sort();
  const topRatedByCategory = categories.map((category) => ({
    category,
    picks: places
      .filter((place) => place.category === category)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((p) => ({ name: p.name, rating: p.rating, slug: p.slug, city: p.city })),
  }));

  const summary = { totalPlaces: places.length, categories, cities, topRatedByCategory };

  const relevantPlaces = buildSearchContext(question, {
    limit: 50,
    userLat: location?.lat,
    userLng: location?.lng,
    sourcePlaces: places,
  });
  const events = getCurrentEvents().slice(0, 8);
  const recipes = getFeaturedRecipes().slice(0, 6);
  const facebookContext = await getFacebookContext();

  const topByCategory = summary.topRatedByCategory
    .map(
      ({ category, picks }) =>
        `- ${category}: ${picks
          .map((p) => `${p.name} (${p.rating.toFixed(1)}, ${p.city}) [/${p.slug}]`)
          .join("; ")}`
    )
    .join("\n");

  const placeContext = relevantPlaces
    .map(
      (place) =>
        `- ${place.name} | slug: ${place.slug} | rating: ${place.rating.toFixed(1)} | city: ${place.city} | category: ${place.category} | tags: ${place.tags.join(", "
        )} | description: ${place.description}`
    )
    .join("\n");

  const eventContext = events
    .map(
      (event) =>
        `- ${event.title} (${event.date} ${event.time}) in ${event.city} at ${event.venue}. Price: ${event.price || (event.free ? "Free" : "Unknown")}. ${event.description}`
    )
    .join("\n");

  const recipeContext = recipes
    .map(
      (recipe) =>
        `- ${recipe.title} (rating ${recipe.rating.toFixed(1)}, difficulty ${recipe.difficulty}) inspired by ${recipe.inspiredBy}`
    )
    .join("\n");

  const systemPrompt = `You are Geaux the Gator, the Ask Acadiana mascot and a warm, casual, cajun-flavored local guide for South Louisiana.

HARD RULES:
0) Do NOT include <think> tags or reasoning blocks in your response. Jump straight to the answer.
1) Keep responses SHORT and conversational — 2-4 sentences max for simple questions, 5-8 for complex ones. No essays.
2) Answer ONLY questions related to Acadiana / South Louisiana culture, food, events, and places.
2) Use the provided database context as your primary source of truth.
3) When mentioning a place, ALWAYS format it as [Place Name](/place/slug).
4) Include ratings when recommending places.
5) If the answer is uncertain or missing in context, say so honestly and suggest nearby alternatives.
6) Keep responses concise, friendly, and useful.
7) Introduce yourself as Geaux the Gator when it fits naturally.
8) Sprinkle in occasional Cajun expressions (for example: "Mais yeah!", "Laissez les bons temps rouler") without overdoing it.
9) Try to suggest related ideas: "If you like X, also check out Y."

DATABASE OVERVIEW:
- Total places: ${summary.totalPlaces}
- Categories: ${summary.categories.join(", ")}
- Cities: ${summary.cities.join(", ")}

Top-rated by category:
${topByCategory}

Current events:
${eventContext}

Featured recipes:
${recipeContext}

Most relevant places for this user question:
${placeContext}

Recent Facebook community/news context (paraphrased):
${facebookContext || "- No recent Facebook context available."}

${location?.city ? `User location context: The user is currently near ${location.city}. Prioritize places close to them. When multiple options exist, mention the nearest ones first.` : ""}
`;

  return systemPrompt;
}

export async function POST(request: NextRequest) {
  try {
    const { question, history, location } = (await request.json()) as {
      question?: string;
      history?: ChatMessage[];
      location?: { lat?: number; lng?: number; city?: string };
    };

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Question is required." }, { status: 400 });
    }

    const apiKey = process.env.VENICE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing VENICE_API_KEY." }, { status: 500 });
    }

    const systemPrompt = await formatPrompt(question, location);

    const cleanedHistory: ChatMessage[] = Array.isArray(history)
      ? history
          .filter(
            (m): m is ChatMessage =>
              !!m &&
              typeof m.content === "string" &&
              (m.role === "user" || m.role === "assistant")
          )
          .slice(-10)
      : [];

    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      ...cleanedHistory,
      { role: "user", content: question.trim() },
    ];

    const veniceResponse = await fetch("https://api.venice.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "qwen3-4b",
        stream: true,
        temperature: 0.7,
        messages,
      }),
    });

    if (!veniceResponse.ok || !veniceResponse.body) {
      const errorText = await veniceResponse.text().catch(() => "Unable to read error from Venice API");
      return NextResponse.json(
        { error: `Venice API error: ${veniceResponse.status} ${errorText}` },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = veniceResponse.body!.getReader();
        let buffer = "";
        let insideThink = false;
        let thinkBuffer = "";

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;

              const payload = trimmed.replace(/^data:\s*/, "");
              if (!payload || payload === "[DONE]") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
                continue;
              }

              try {
                const json = JSON.parse(payload) as {
                  choices?: Array<{ delta?: { content?: string } }>;
                };

                const token = json.choices?.[0]?.delta?.content ?? "";
                if (!token) continue;

                // Filter out <think>...</think> blocks in streaming
                if (insideThink) {
                  thinkBuffer += token;
                  const closeIdx = thinkBuffer.indexOf("</think>");
                  if (closeIdx !== -1) {
                    insideThink = false;
                    // Emit anything after the closing tag
                    const after = thinkBuffer.slice(closeIdx + 8).trimStart();
                    thinkBuffer = "";
                    if (after) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: after })}\n\n`));
                    }
                  }
                  continue;
                }

                const openIdx = token.indexOf("<think>");
                if (openIdx !== -1) {
                  // Emit text before the tag
                  const before = token.slice(0, openIdx);
                  if (before) {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: before })}\n\n`));
                  }
                  const remainder = token.slice(openIdx + 7);
                  const closeInSame = remainder.indexOf("</think>");
                  if (closeInSame !== -1) {
                    const after = remainder.slice(closeInSame + 8).trimStart();
                    if (after) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: after })}\n\n`));
                    }
                  } else {
                    insideThink = true;
                    thinkBuffer = remainder;
                  }
                  continue;
                }

                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token })}\n\n`));
              } catch {
                // Ignore malformed payload chunks and continue streaming.
              }
            }
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
        } catch {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "I'm having trouble thinking right now." })}\n\n`
            )
          );
          controller.close();
        } finally {
          reader.releaseLock();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch {
    return NextResponse.json({ error: "I'm having trouble thinking right now." }, { status: 500 });
  }
}
