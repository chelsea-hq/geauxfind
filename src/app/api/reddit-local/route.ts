import { NextResponse } from "next/server";

const SUBREDDITS = ["Acadiana", "lafayette"];
const TTL_MS = 30 * 60 * 1000;
let cache: { expiresAt: number; payload: Record<string, unknown> } | null = null;

const KEYWORDS = [
  "food",
  "restaurant",
  "eat",
  "brunch",
  "happy hour",
  "event",
  "festival",
  "things to do",
  "date night",
  "live music",
  "bar",
  "coffee",
  "crawfish",
];

function isRelevant(text: string) {
  const normalized = text.toLowerCase();
  return KEYWORDS.some((k) => normalized.includes(k));
}

async function fetchSubreddit(subreddit: string) {
  const url = `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`;
  const res = await fetch(url, {
    headers: { "User-Agent": "GeauxFind/1.0 (local-events aggregator)" },
    next: { revalidate: 1800 },
  });
  if (!res.ok) throw new Error(`Failed r/${subreddit}: ${res.status}`);

  const json = (await res.json()) as {
    data?: { children?: Array<{ data?: Record<string, unknown> }> };
  };

  return (json.data?.children || [])
    .map((item) => item.data || {})
    .map((post) => {
      const title = String(post.title || "");
      const selftext = String(post.selftext || "");
      return {
        id: String(post.id || ""),
        subreddit,
        title,
        url: `https://reddit.com${String(post.permalink || "")}`,
        score: Number(post.score || 0),
        comments: Number(post.num_comments || 0),
        author: String(post.author || ""),
        createdUtc: Number(post.created_utc || 0),
        text: selftext,
      };
    })
    .filter((p) => p.id && isRelevant(`${p.title}\n${p.text}`));
}

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return NextResponse.json({ ...cache.payload, cached: true });
  }

  try {
    const batches = await Promise.all(SUBREDDITS.map((s) => fetchSubreddit(s)));
    const posts = batches
      .flat()
      .sort((a, b) => b.score - a.score || b.comments - a.comments)
      .slice(0, 12);

    const payload = {
      source: "Reddit public JSON",
      fetchedAt: new Date().toISOString(),
      posts,
    };

    cache = { expiresAt: now + TTL_MS, payload };
    return NextResponse.json({ ...payload, cached: false });
  } catch (error) {
    return NextResponse.json(
      {
        source: "Reddit public JSON",
        posts: [],
        error: error instanceof Error ? error.message : "Failed to load Reddit posts",
      },
      { status: 500 }
    );
  }
}
