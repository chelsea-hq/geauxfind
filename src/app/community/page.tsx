"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { places } from "@/data/mock-data";
import type { CommunitySubmission } from "@/types";

const types: CommunitySubmission["type"][] = ["Food tip", "Hidden gem", "Event", "Review", "Photo"];

function badgeFor(userCount: number, topVotes: number) {
  if (topVotes >= 10) return "👑 Taste Maker";
  if (userCount >= 20) return "⚜️ Acadiana OG";
  if (userCount >= 5) return "🌟 Local Expert";
  if (userCount >= 1) return "🐊 Geaux Getter";
  return "";
}

export default function CommunityPage() {
  const [items, setItems] = useState<CommunitySubmission[]>([]);
  const [votes, setVotes] = useState<Record<string, number>>({});
  const [form, setForm] = useState({ type: "Food tip" as CommunitySubmission["type"], placeName: "", placeSlug: "", text: "", authorName: "Anonymous Geaux" });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/community").then((r) => r.json()).then(setItems).catch(() => setItems([]));
    const saved = localStorage.getItem("geaux-upvotes");
    if (saved) setVotes(JSON.parse(saved));
  }, []);

  function upvote(id: string) {
    const next = { ...votes, [id]: (votes[id] || 0) + 1 };
    setVotes(next);
    localStorage.setItem("geaux-upvotes", JSON.stringify(next));
  }

  const leaderboard = useMemo(() => {
    const byAuthor = new Map<string, CommunitySubmission[]>();
    items.forEach((item) => {
      byAuthor.set(item.authorName, [...(byAuthor.get(item.authorName) || []), item]);
    });
    return byAuthor;
  }, [items]);

  async function submit() {
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
      <h1 className="text-4xl text-[var(--cajun-red)]">Drop a Geaux — Share your Acadiana discoveries</h1>

      <section className="mt-6 rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
        <div className="grid gap-3 md:grid-cols-2">
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
        <button onClick={submit} className="mt-3 rounded-xl bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">Drop It</button>
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
    </main>
  );
}
