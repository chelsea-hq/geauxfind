"use client";

import { useState } from "react";

const CATEGORIES = ["Gift Cards", "Happy Hour", "Daily Special", "New Opening", "Seasonal", "Other"];

interface CommunityDeal {
  id: string;
  restaurant: string;
  deal: string;
  category: string;
  submittedBy: string;
  upvotes: number;
  createdAt: string;
}

export function DealSubmitForm({ initial }: { initial: CommunityDeal[] }) {
  const [deals, setDeals] = useState<CommunityDeal[]>(initial);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [form, setForm] = useState({ restaurant: "", deal: "", category: "Daily Special", submittedBy: "" });
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.restaurant || !form.deal) {
      setStatus("Please enter a restaurant name and deal description.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/deals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus(data.error || "Could not submit.");
      } else {
        setStatus("Deal submitted! It'll appear after a quick review.");
        setForm({ restaurant: "", deal: "", category: "Daily Special", submittedBy: "" });
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function upvote(id: string) {
    if (upvoted.has(id)) return;
    setUpvoted((prev) => new Set([...prev, id]));
    setDeals((prev) => prev.map((d) => d.id === id ? { ...d, upvotes: d.upvotes + 1 } : d));
    await fetch("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
  }

  return (
    <>
      <section className="mt-14">
        <h2 className="text-3xl text-[var(--cajun-red)]">Know a Deal? Share It</h2>
        <p className="mt-1 text-[var(--warm-gray)]">Help the community find the best offers around Acadiana.</p>
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-6">
          <div className="grid gap-3 md:grid-cols-2">
            <input
              required
              className="rounded-lg border border-[var(--spanish-moss)]/40 p-2.5 text-sm"
              placeholder="Restaurant or business name"
              value={form.restaurant}
              onChange={(e) => setForm((f) => ({ ...f, restaurant: e.target.value }))}
            />
            <select
              className="rounded-lg border border-[var(--spanish-moss)]/40 p-2.5 text-sm"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input
              className="rounded-lg border border-[var(--spanish-moss)]/40 p-2.5 text-sm"
              placeholder="Your name (optional)"
              value={form.submittedBy}
              onChange={(e) => setForm((f) => ({ ...f, submittedBy: e.target.value }))}
            />
          </div>
          <textarea
            required
            className="mt-3 min-h-24 w-full rounded-lg border border-[var(--spanish-moss)]/40 p-3 text-sm"
            placeholder="Describe the deal (e.g. Half-price oysters every Tuesday 4–7pm)"
            value={form.deal}
            onChange={(e) => setForm((f) => ({ ...f, deal: e.target.value }))}
          />
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[var(--cajun-red)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit Deal"}
            </button>
            {status ? <p className="text-sm text-[var(--warm-gray)]">{status}</p> : null}
          </div>
        </form>
      </section>

      {deals.length > 0 ? (
        <section className="mt-10">
          <h2 className="text-3xl text-[var(--cajun-red)]">Community Deals</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {deals.map((deal) => (
              <article key={deal.id} className="rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[var(--cast-iron)]">{deal.restaurant}</p>
                    <span className="mt-1 inline-block rounded-full bg-[var(--cream)] px-2.5 py-0.5 text-xs font-semibold text-[var(--cajun-red)]">{deal.category}</span>
                  </div>
                  <button
                    onClick={() => upvote(deal.id)}
                    disabled={upvoted.has(deal.id)}
                    className="flex shrink-0 flex-col items-center rounded-xl border border-[var(--spanish-moss)]/30 px-3 py-2 text-xs disabled:opacity-50"
                  >
                    <span>▲</span>
                    {deal.upvotes > 0 ? <span className="font-semibold">{deal.upvotes}</span> : null}
                  </button>
                </div>
                <p className="mt-3 text-sm text-[var(--cast-iron)]">{deal.deal}</p>
                <p className="mt-2 text-xs text-[var(--warm-gray)]">
                  Shared by {deal.submittedBy || "Anonymous"} · {new Date(deal.createdAt).toLocaleDateString()}
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
