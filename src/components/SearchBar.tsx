"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

// Place names for autocomplete are fetched on demand from the slim search
// index so the full place dataset never ships in this client bundle. Cached at
// module scope so it loads at most once per session.
let cachedPlaceNames: string[] | null = null;

export function SearchBar() {
  const [query, setQuery] = useState("");
  const [placeNames, setPlaceNames] = useState<string[]>(cachedPlaceNames ?? []);

  useEffect(() => {
    if (cachedPlaceNames) return;
    fetch("/api/search-index")
      .then((r) => r.json())
      .then((data) => {
        const names = Array.isArray(data?.items)
          ? data.items.map((item: { name: string }) => item.name)
          : [];
        cachedPlaceNames = names;
        setPlaceNames(names);
      })
      .catch(() => null);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return placeNames.filter((name) => name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, placeNames]);

  const trackSearch = (value: string) => {
    const query = value.trim();
    if (!query) return;
    fetch("/api/track-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
      keepalive: true,
    }).catch(() => null);
  };

  return (
    <form
      action="/search"
      method="GET"
      onSubmit={() => trackSearch(query)}
      className="relative mx-auto flex max-w-3xl items-center gap-2 rounded-[10px] bg-white/85 p-2 shadow-xl backdrop-blur-md ring-1 ring-black/5"
    >
      <Search className="ml-2 h-5 w-5 text-[var(--warm-gray)]" />
      <label htmlFor="home-search" className="sr-only">Search Acadiana</label>
      <input
        id="home-search"
        name="q"
        aria-label="Search Acadiana"
        placeholder="What are you looking for in Acadiana?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        className="h-11 flex-1 bg-transparent px-2 text-[15px] text-gray-900 placeholder:text-gray-500 outline-none"
      />
      <button type="submit" className="min-h-11 rounded-[10px] bg-[var(--cajun-red)] px-5 py-2 font-medium text-white transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sunset-gold)]">
        Geaux
      </button>

      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 mx-auto w-[95%] rounded-[10px] border border-[var(--spanish-moss)]/30 bg-white p-2 shadow-lg">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="submit" name="q" value={suggestion} onClick={() => trackSearch(suggestion)} className="block min-h-11 w-full rounded-[8px] px-3 py-2 text-left text-sm text-[var(--cast-iron)] transition-colors hover:bg-[var(--cream-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sunset-gold)]">
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
