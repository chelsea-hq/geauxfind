import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import type { WhatsNewItem } from "@/types";

type FacebookFeed = {
  lastUpdated?: string;
  sources?: { pages?: string[]; groups?: string[] };
  items?: Array<{
    id: string;
    type: string;
    title: string;
    summary: string;
    source: string;
    sourceUrl: string;
    date: string;
    engagement?: { likes?: number; comments?: number };
    tags?: string[];
  }>;
};

function sourceBadgeFor(source: string, stream: "news" | "community") {
  const s = source.toLowerCase();
  if (s.includes("advocate")) return "📰 The Advocate";
  if (s.includes("developing lafayette")) return "📘 Developing Lafayette";
  if (s.includes("lafayette travel")) return "📘 Lafayette Travel";
  if (stream === "community") return "👥 Community";
  return "📰 Local News";
}

function normalizeNewsItem(item: WhatsNewItem) {
  return {
    id: item.id,
    title: item.title,
    summary: item.excerpt,
    source: item.source,
    sourceBadge: sourceBadgeFor(item.source, "news"),
    sourceUrl: item.sourceUrl,
    url: item.url,
    date: item.date,
    category: item.category,
    stream: "news" as const,
    imageUrl: item.imageUrl,
  };
}

function mapFacebookType(type: string) {
  switch (type) {
    case "new_opening":
      return "Business Opening";
    case "restaurant_rec":
      return "Restaurant Recommendation";
    case "event":
      return "Event";
    case "food_news":
      return "Food News";
    case "crawfish_update":
      return "Crawfish Update";
    default:
      return "Community";
  }
}

function normalizeFacebookItem(item: NonNullable<FacebookFeed["items"]>[number]) {
  return {
    id: item.id,
    title: item.title,
    summary: item.summary,
    source: item.source,
    sourceBadge: sourceBadgeFor(item.source, "community"),
    sourceUrl: item.sourceUrl,
    url: item.sourceUrl,
    date: item.date,
    category: mapFacebookType(item.type),
    stream: "community" as const,
    engagement: {
      likes: Number(item.engagement?.likes || 0),
      comments: Number(item.engagement?.comments || 0),
    },
  };
}

export async function GET() {
  const whatsNewPath = path.join(process.cwd(), "data", "whats-new.json");
  const facebookPath = path.join(process.cwd(), "data", "facebook-feed.json");

  try {
    const [newsRaw, fbRaw] = await Promise.all([
      fs.readFile(whatsNewPath, "utf-8").catch(() => "[]"),
      fs.readFile(facebookPath, "utf-8").catch(() => '{"items": []}'),
    ]);

    const newsItems = (JSON.parse(newsRaw) as WhatsNewItem[]).map(normalizeNewsItem);
    const facebookFeed = JSON.parse(fbRaw) as FacebookFeed;
    const facebookItems = (facebookFeed.items || []).map(normalizeFacebookItem);

    const merged = [...newsItems, ...facebookItems].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return NextResponse.json(merged);
  } catch {
    return NextResponse.json([]);
  }
}
