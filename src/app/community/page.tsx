"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { places } from "@/data/mock-data";
import type { CommunitySubmission } from "@/types";
import type { RecSubmission } from "@/app/api/recs/route";

const types: CommunitySubmission["type"][] = ["Food tip", "Hidden gem", "Event", "Review", "Photo"];
const REC_CATEGORIES = ["Restaurant", "Bar & Drinks", "Coffee Shop", "Bakery", "Food Truck", "Seafood", "Cajun/Creole", "Hidden Gem", "Other"];

function badgeFor(userCount: number, topVotes: number) {
  if (topVotes >= 10) return "👑 Taste Maker";
  if (userCount >= 20) return "⚜️ Acadiana OG";
  if (userCount >= 5) return "🌟 Local Expert";
  if (userCount >= 1) return "🐊 Geaux Getter";
  return "";
}

type Tab = "recs" | "tips";

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("recs");

  // --- Recs state ---
  const [recs, setRecs] = useState<RecSubmission[]>([]);
  const [recVotes, setRecVotes] = useState<Set<string>>(new Set());
  const [recForm, setRecForm] = useState({ placeName: "", recommendation: "", category: "Restaurant", submittedBy: "" });
  const [recStatus, setRecStatus] = useState("");
  const [recSubmitting, setRecSubmitting] = useState(false);

  // --- Tips state ---
  const [items, setItems] = useState<CommunitySubmission[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ type: "Food tip" as CommunitySubmission["type"], placeName: "", placeSlug: "", text: "", authorName: "Anonymous Geaux" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/community").then((r) => r.json()).then(setItems).catch(() => setItems([]));
    fetch("/api/recs").then((r) => r.json()).then(setRecs).catch(() => setRecs([]));
    const saved = localStorage.getItem("geaux-upvotes");
    if (saved) setVotes(JSON.parse(saved));
    const savedRec = localStorage.getItem("geaux-rec-upvotes");
    if (savedRec) setRecVotes(new Set(JSON.parse(savedRec)));
  }, []);

  // Upvote tip
  function upvote(id: string) {
    const next = { ...votes, [id]: (votes[id] || 0) + 1 };
    setVotes(next);
    localStorage.setItem("geaux-upvotes", JSON.stringify(next));
  }

  // Upvote rec
  async function upvoteRec(id: string) {
    if (recVotes.has(id)) return;
    const next = new Set([...recVotes, id]);
    setRecVotes(next);
    localStorage.setItem("geaux-rec-upvotes", JSON.stringify([...next]));
    setRecs((prev) => prev.map((r) => r.id === id ? { ...r, upvotes: r.upvotes + 1 } : r));
    await fetch("/api/recs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
  }

  const leaderboard = useMemo(() => {
    const byAuthor = new Map<string, CommunitySubmission[]>();
    items.forEach((item) => {
      byAuthor.set(item.authorName, [...(byAuthor.get(item.authorName) || []), item]);
    });
    return byAuthor;
  }, [items]);

  async function submitRec(e: React.FormEvent) {
    e.preventDefault();
    if (!recForm.placeName || !recForm.recommendation) {
      setRecStatus("Please fill in the place name and your recommendation.");
      return;
    }
    setRecSubmitting(true);
    try {
      const res = await fetch("/api/recs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setRecStatus(data.error || "Could not submit.");
      } else if (data.status === "approved" && data.rec) {
        setRecs((prev) => [data.rec, ...prev]);
        setRecStatus("Your rec is live!");
        setRecForm({ placeName: "", recommendation: "", category: "Restaurant", submittedBy: "" });
      } else {
        setRecStatus("Thanks! Your rec is in review.");
        setRecForm({ placeName: "", recommendation: "", category: "Restaurant", submittedBy: "" });
      }
    } finally {
      setRecSubmitting(false);
    }
  }

  async function submitTip() {
    let photoUrl = "";
    if (photoFile && form.placeSlug) {
      const data = new FormData();
      data.append("slug", form.placeSlug);
      data.append("file", photoFile);
      data.append("caption", `Community upload by ${form.authorName}`);
      const photoRes = await fetch("/api/photos", { method: "POST", body: data });
      const payload = await photoRes.json();
      photoUrl = payload?.photo?.url || "";
    }
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, photoUrl }),
    });
    const data = await res.json();
    if (!res.ok) return setStatus(data.error || "Could not submit.");
    if (data.status === "approved" && data.submission) {
      setItems((prev) => [data.submission, ...prev]);
      setStatus("🔥 Posted! Your Geaux is live.");
    } else if (data.status === "queued") {
      setStatus("🫶 Thanks! Your Geaux is queued for quick review.");
    } else {
      setStatus("Thanks for sharing!");
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl text-[var(--cajun-red)]">Community</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Share your Acadiana discoveries, recs, and tips with the community.</p>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b border-[var(--spanish-moss)]/25">
        <button
          onClick={() => setTab("recs")}
          className={`min-h-11 rounded-t-lg px-5 py-2.5 text-sm font-semibold transition-colors ${tab === "recs" ? "border-b-2 border-[var(--cajun-red)] text-[var(--cajun-red)]" : "text-[var(--warm-gray)] hover:text-[var(--cast-iron)]"}`}
        >
          Submit a Rec
        </button>
        <button
          onClick={() => setTab("tips")}
          className={`min-h-11 rounded-t-lg px-5 py-2.5 text-sm font-semibold transition-colors ${tab === "tips" ? "border-b-2 border-[var(--cajun-red)] text-[var(--cajun-red)]" : "text-[var(--warm-gray)] hover:text-[var(--cast-iron)]"}`}
        >
          Drop a Geaux
        </button>
      </div>

      {/* Submit a Rec Tab */}
      {tab === "recs" ? (
        <div className="mt-6">
          <section className="rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
            <h2 className="text-xl font-semibold text-[var(--cast-iron)]">Recommend a place</h2>
            <p className="mt-1 text-sm text-[var(--warm-gray)]">Tell the community about a restaurant or spot worth visiting.</p>
            <form onSubmit={submitRec} className="mt-4 grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  required
                  className="rounded-lg border border-[var(--spanish-moss)]/40 p-2.5 text-sm"
                  placeholder="Place name *"
                  value={recForm.placeName}
                  onChange={(e) => setRecForm((f) => ({ ...f, placeName: e.target.value }))}
                />
                <select
                  className="rounded-lg border border-[var(--spanish-moss)]/40 p-2.5 text-sm"
                  value={recForm.category}
                  onChange={(e) => setRecForm((f) => ({ ...f, category: e.target.value }))}
                >
                  {REC_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input
                  className="rounded-lg border border-[var(--spanish-moss)]/40 p-2.5 text-sm md:col-span-2"
                  placeholder="Your name (optional)"
                  value={recForm.submittedBy}
                  onChange={(e) => setRecForm((f) => ({ ...f, submittedBy: e.target.value }))}
                />
              </div>
              <textarea
                required
                className="min-h-28 rounded-lg border border-[var(--spanish-moss)]/40 p-3 text-sm"
                placeholder="What do you recommend and why? (e.g. 'Best boudin balls in Acadiana — get them fried')"
                value={recForm.recommendation}
                onChange={(e) => setRecForm((f) => ({ ...f, recommendation: e.target.value }))}
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={recSubmitting}
                  className="rounded-xl bg-[var(--cajun-red)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {recSubmitting ? "Submitting…" : "Submit Rec"}
                </button>
                {recStatus ? <p className="text-sm text-[var(--warm-gray)]">{recStatus}</p> : null}
              </div>
            </form>
          </section>

          {/* Rec feed */}
          {recs.length > 0 ? (
            <section className="mt-8">
              <h2 className="text-2xl text-[var(--cajun-red)]">Community Recs</h2>
              <div className="mt-4 grid gap-4">
                {recs.map((rec) => (
                  <article key={rec.id} className="rounded-xl border border-[var(--spanish-moss)]/25 bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-[var(--cast-iron)]">{rec.placeName}</p>
                        <span className="mt-1 inline-block rounded-full bg-[var(--cream)] px-2.5 py-0.5 text-xs font-semibold text-[var(--cajun-red)]">
                          {rec.category}
                        </span>
                      </div>
                      <button
                        onClick={() => upvoteRec(rec.id)}
                        disabled={recVotes.has(rec.id)}
                        aria-label={`Upvote ${rec.placeName}`}
                        className="flex shrink-0 flex-col items-center rounded-xl border border-[var(--spanish-moss)]/30 px-3 py-2 text-xs hover:border-[var(--cajun-red)] disabled:opacity-50"
                      >
                        <span>▲</span>
                        <span className="font-semibold">{rec.upvotes}</span>
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-[var(--cast-iron)]">{rec.recommendation}</p>
                    <p className="mt-2 text-xs text-[var(--warm-gray)]">
                      by {rec.submittedBy || "Anonymous"} · {new Date(rec.createdAt).toLocaleDateString()}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <div className="mt-10 rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-8 text-center">
              <p className="text-3xl">🐊</p>
              <p className="mt-2 font-semibold text-[var(--cast-iron)]">No recs yet — be the first!</p>
              <p className="mt-1 text-sm text-[var(--warm-gray)]">Share your favorite Acadiana spots with the community.</p>
            </div>
          )}
        </div>
      ) : null}

      {/* Drop a Geaux Tab */}
      {tab === "tips" ? (
        <div className="mt-6">
          <section className="rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
            <h2 className="text-xl font-semibold text-[var(--cast-iron)]">Drop a Geaux — Share your Acadiana discoveries</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select className="rounded-lg border p-2" onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as CommunitySubmission["type"] }))}>
                {types.map((type) => <option key={type}>{type}</option>)}
              </select>
              <input list="place-list" className="rounded-lg border p-2" placeholder="Place name" onChange={(e) => {
                const place = places.find((p) => p.name.toLowerCase() === e.target.value.toLowerCase());
                setForm((f) => ({ ...f, placeName: e.target.value, placeSlug: place?.slug || "" }));
              }} />
              <datalist id="place-list">{places.slice(0, 150).map((p) => <option key={p.slug} value={p.name} />)}</datalist>
              <input className="rounded-lg border p-2" placeholder="Your name (or Anonymous Geaux)" onChange={(e) => setForm((f) => ({ ...f, authorName: e.target.value || "Anonymous Geaux" }))} />
              <input type="file" accept="image/*" className="rounded-lg border p-2" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
            </div>
            <textarea className="mt-3 min-h-28 w-full rounded-lg border p-3" placeholder="Tell us your tip, hidden gem, or review..." onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))} />
            <button onClick={submitTip} className="mt-3 rounded-xl bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">Drop It</button>
            {status ? <p className="mt-2 text-sm">{status}</p> : null}
          </section>

          <section className="mt-8 grid gap-4">
            {items.map((item) => {
              const userItems = leaderboard.get(item.authorName) || [];
              const topVotes = Math.max(...userItems.map((i) => votes[i.id] || 0), 0);
              return (
                <article key={item.id} className="rounded-xl border border-[var(--spanish-moss)]/25 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold">{item.authorName} <span className="text-xs text-[var(--warm-gray)]">{badgeFor(userItems.length, topVotes)}</span></p>
                    <p className="text-xs text-[var(--warm-gray)]">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-wider text-[var(--moss)]">{item.type}</p>
                  <p className="mt-1">{item.text}</p>
                  <p className="mt-2 text-sm text-[var(--warm-gray)]">at {item.placeSlug ? <Link className="text-[var(--cajun-red)] underline" href={`/place/${item.placeSlug}`}>{item.placeName}</Link> : item.placeName}</p>
                  {item.photoUrl ? <img src={item.photoUrl} alt={item.placeName} className="mt-3 h-48 w-full rounded-lg object-cover" /> : null}
                  <button onClick={() => upvote(item.id)} className="mt-3 rounded-lg border px-3 py-1 text-sm">⬆️ Upvote ({votes[item.id] || 0})</button>
                </article>
              );
            })}
          </section>
        </div>
      ) : null}
    </main>
  );
}
