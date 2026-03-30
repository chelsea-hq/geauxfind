import { NextResponse } from "next/server";

const OPEN_METEO_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=30.2241&longitude=-92.0198&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=America/Chicago&forecast_days=3";

const CACHE_TTL_MS = 60 * 60 * 1000;
let cache: { expiresAt: number; payload: Record<string, unknown> } | null = null;

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return NextResponse.json({ ...cache.payload, cached: true });
  }

  try {
    const res = await fetch(OPEN_METEO_URL, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);

    const data = (await res.json()) as {
      daily?: {
        time?: string[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
      };
    };

    const days = (data.daily?.time || []).map((date, i) => ({
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      tempMaxF: data.daily?.temperature_2m_max?.[i] ?? null,
      tempMinF: data.daily?.temperature_2m_min?.[i] ?? null,
      precipProbability: data.daily?.precipitation_probability_max?.[i] ?? null,
    }));

    const payload = {
      city: "Lafayette, LA",
      source: "Open-Meteo",
      fetchedAt: new Date().toISOString(),
      days,
    };

    cache = { expiresAt: now + CACHE_TTL_MS, payload };
    return NextResponse.json({ ...payload, cached: false });
  } catch (error) {
    return NextResponse.json(
      {
        city: "Lafayette, LA",
        source: "Open-Meteo",
        days: [],
        error: error instanceof Error ? error.message : "Failed to load weather",
      },
      { status: 500 }
    );
  }
}
