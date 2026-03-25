import trendsData from "../../data/search-trends.json";

export type SearchTrendEntry = { query: string; timestamp: string };

export function normalizeQuery(query: string) {
  return query.trim().toLowerCase();
}

export function bucketByDay(entries: SearchTrendEntry[], days = 7) {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const labels: string[] = [];
  const map = new Map<string, number>();

  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    labels.push(key);
    map.set(key, 0);
  }

  entries.forEach((entry) => {
    const day = new Date(entry.timestamp).toISOString().slice(0, 10);
    if (map.has(day)) map.set(day, (map.get(day) || 0) + 1);
  });

  return labels.map((label) => ({ label, count: map.get(label) || 0 }));
}

export function getTrending(limit = 10) {
  const entries = (trendsData.queries || []) as SearchTrendEntry[];
  const counts = new Map<string, number>();

  entries.forEach((entry) => {
    const normalized = normalizeQuery(entry.query);
    if (!normalized) return;
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  const list = [...counts.entries()]
    .map(([query, count]) => ({
      query,
      count,
      spark: bucketByDay(entries.filter((e) => normalizeQuery(e.query) === query), 7),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  return list;
}

export function getSeasonalSignals() {
  return [
    { term: "crawfish", season: "March–June", reason: "Peak boil season across Acadiana" },
    { term: "king cake", season: "January–February", reason: "Mardi Gras tradition spike" },
    { term: "festival", season: "April–May", reason: "Spring festivals and outdoor weekends" },
  ];
}
