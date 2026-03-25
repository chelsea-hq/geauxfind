"use client";

export function FilterBar({
  cities,
  city,
  setCity,
  prices,
  selectedPrices,
  togglePrice,
  rating,
  setRating,
  tags,
  selectedTag,
  setSelectedTag,
  clear,
}: {
  cities: string[];
  city: string;
  setCity: (v: string) => void;
  prices: Array<"$" | "$$" | "$$$">;
  selectedPrices: Array<"$" | "$$" | "$$$">;
  togglePrice: (v: "$" | "$$" | "$$$") => void;
  rating: number;
  setRating: (v: number) => void;
  tags: string[];
  selectedTag: string;
  setSelectedTag: (v: string) => void;
  clear: () => void;
}) {
  return (
    <>
      <div className="hidden rounded-xl border bg-white p-4 lg:block">
        <div className="grid gap-4 md:grid-cols-4">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="min-h-11 rounded-lg border px-3">
            <option value="all">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex items-center gap-3 text-sm">
            {prices.map((p) => (
              <label key={p} className="flex items-center gap-1">
                <input type="checkbox" checked={selectedPrices.includes(p)} onChange={() => togglePrice(p)} /> {p}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {[0, 3, 4, 4.5].map((r) => (
              <button key={r} onClick={() => setRating(r)} className={`min-h-11 rounded-full border px-3 text-sm ${rating === r ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>
                {r === 0 ? "Any" : `${r}+`}
              </button>
            ))}
          </div>
          <button onClick={clear} className="min-h-11 rounded-lg border px-3 text-sm hover:bg-[var(--cream-bg)]">Clear filters</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button onClick={() => setSelectedTag("all")} className={`rounded-full border px-3 py-1 text-xs ${selectedTag === "all" ? "bg-[var(--bayou-green)] text-white" : "bg-white"}`}>All tags</button>
          {tags.map((tag) => <button key={tag} onClick={() => setSelectedTag(tag)} className={`rounded-full border px-3 py-1 text-xs ${selectedTag === tag ? "bg-[var(--bayou-green)] text-white" : "bg-white"}`}>{tag}</button>)}
        </div>
      </div>

      <details className="rounded-xl border bg-white p-4 lg:hidden">
        <summary className="cursor-pointer text-sm font-semibold">Filters</summary>
        <div className="mt-3 space-y-3">
          <select value={city} onChange={(e) => setCity(e.target.value)} className="min-h-11 w-full rounded-lg border px-3">
            <option value="all">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-3 text-sm">{prices.map((p) => <label key={p}><input type="checkbox" checked={selectedPrices.includes(p)} onChange={() => togglePrice(p)} /> {p}</label>)}</div>
          <div className="flex flex-wrap gap-2">{[0, 3, 4, 4.5].map((r) => <button key={r} onClick={() => setRating(r)} className={`min-h-11 rounded-full border px-3 text-sm ${rating === r ? "bg-[var(--cajun-red)] text-white" : "bg-white"}`}>{r === 0 ? "Any" : `${r}+`}</button>)}</div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedTag("all")} className={`rounded-full border px-3 py-1 text-xs ${selectedTag === "all" ? "bg-[var(--bayou-green)] text-white" : "bg-white"}`}>All tags</button>
            {tags.map((tag) => <button key={tag} onClick={() => setSelectedTag(tag)} className={`rounded-full border px-3 py-1 text-xs ${selectedTag === tag ? "bg-[var(--bayou-green)] text-white" : "bg-white"}`}>{tag}</button>)}
          </div>
          <button onClick={clear} className="min-h-11 w-full rounded-lg border px-3 text-sm">Clear filters</button>
        </div>
      </details>
    </>
  );
}
