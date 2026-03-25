"use client";

import { useMemo, useState } from "react";
import { BusinessCard } from "@/components/cajun/BusinessCard";
import { cajunCategories, type CajunBusiness } from "@/lib/cajun-connection";

type SortValue = "featured" | "newest" | "a-z";

export function BusinessesDirectory({ businesses }: { businesses: CajunBusiness[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [sort, setSort] = useState<SortValue>("featured");

  const filtered = useMemo(() => {
    let rows = businesses.filter((b) => b.name.toLowerCase().includes(query.toLowerCase()) || b.shortDescription.toLowerCase().includes(query.toLowerCase()));
    if (category !== "All") rows = rows.filter((b) => b.categories.includes(category as never));

    if (sort === "featured") rows = rows.sort((a, b) => Number(b.featured) - Number(a.featured));
    if (sort === "newest") rows = rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "a-z") rows = rows.sort((a, b) => a.name.localeCompare(b.name));

    return rows;
  }, [businesses, category, query, sort]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:grid-cols-[1fr_auto_auto]">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search businesses" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3" />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3">
          <option>All</option>
          {cajunCategories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortValue)} className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3">
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="a-z">A-Z</option>
        </select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((business) => <BusinessCard key={business.slug} business={business} />)}
      </div>
    </div>
  );
}
