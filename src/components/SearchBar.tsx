"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { places } from "@/data/mock-data";

const PLACE_NAMES = places.map((place) => place.name);

export function SearchBar() {
  const [query, setQuery] = useState("");

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return PLACE_NAMES.filter((name) => name.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  return (
    <form
      action="/search"
      method="GET"
      className="relative mx-auto flex max-w-3xl items-center gap-2 rounded-full bg-white p-2 shadow-xl ring-1 ring-black/5"
    >
      <Search className="ml-3 h-5 w-5 text-[var(--warm-gray)]" />
      <input
        name="q"
        aria-label="Search Acadiana"
        placeholder="What are you looking for in Acadiana?"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        className="h-12 flex-1 bg-transparent px-2 text-[15px] outline-none"
      />
      <button
        type="submit"
        className="rounded-full bg-[var(--cajun-red)] px-5 py-3 font-medium text-white"
      >
        Geaux
      </button>

      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-20 mx-auto w-[92%] rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-2 shadow-lg">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="submit"
              name="q"
              value={suggestion}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--cast-iron)] hover:bg-[var(--cream-bg)]"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
