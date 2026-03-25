"use client";

import { useEffect, useState } from "react";

export function ReviewSummaryCard({ slug }: { slug: string }) {
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    fetch(`/api/review-summary?place=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setSummary(data?.summary || ""))
      .catch(() => setSummary(""));
  }, [slug]);

  if (!summary) return null;

  return (
    <section className="mt-8 rounded-2xl border border-[var(--bayou-gold)]/40 bg-[linear-gradient(135deg,#fffdf6,#fff4dc)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--bayou-green)]">What People Say</p>
      <blockquote className="mt-2 border-l-4 border-[var(--bayou-gold)] pl-4 text-[15px] leading-relaxed text-[var(--cast-iron)]/90">
        “{summary}”
      </blockquote>
    </section>
  );
}
