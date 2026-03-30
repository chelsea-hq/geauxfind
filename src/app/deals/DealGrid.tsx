"use client";

import { useMemo, useState } from "react";

interface CommunityDeal {
  id: string;
  restaurant: string;
  deal: string;
  category: string;
  submittedBy: string;
  upvotes: number;
  createdAt: string;
  status: "approved" | "queued";
}

interface DealGridProps {
  deals: CommunityDeal[];
  categories: string[];
}

export function DealGrid({ deals, categories }: DealGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const sortedDeals = useMemo(
    () => [...deals].sort((a, b) => b.upvotes - a.upvotes),
    [deals],
  );

  const filteredDeals = useMemo(() => {
    if (activeCategory === "All") return sortedDeals;
    return sortedDeals.filter((deal) => deal.category === activeCategory);
  }, [activeCategory, sortedDeals]);

  const pillCategories = ["All", ...categories];

  return (
    <div>
      <div className="-mx-4 overflow-x-auto px-4 pb-2">
        <div className="flex min-w-max gap-2">
          {pillCategories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "scale-100 border-[var(--cajun-red)] bg-[var(--cajun-red)] text-white"
                    : "scale-[0.98] border-[var(--spanish-moss)]/35 bg-white text-[var(--cast-iron)] hover:scale-100 hover:border-[var(--sunset-gold)]"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <div
        key={activeCategory}
        className="mt-5 grid gap-4 transition-all duration-300 ease-out sm:grid-cols-2 lg:grid-cols-3"
      >
        {filteredDeals.map((deal) => (
          <article
            key={deal.id}
            className="rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-[var(--cast-iron)]">{deal.restaurant}</h3>
              <span className="shrink-0 rounded-full bg-[var(--cream)] px-2.5 py-1 text-xs font-semibold text-[var(--cajun-red)]">
                {deal.category}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-[var(--cast-iron)]">{deal.deal}</p>

            <div className="mt-4 flex items-center justify-between text-xs text-[var(--warm-gray)]">
              <p>Added by {deal.submittedBy || "GeauxFind"}</p>
              <p className="font-semibold text-[var(--cajun-red)]">🔥 {deal.upvotes}</p>
            </div>
          </article>
        ))}
      </div>

      {filteredDeals.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-[var(--spanish-moss)]/40 bg-white p-6 text-center text-sm text-[var(--warm-gray)]">
          No deals in this category yet. Check back soon or submit one below.
        </div>
      ) : null}
    </div>
  );
}
