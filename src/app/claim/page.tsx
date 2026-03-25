"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { places } from "@/data/mock-data";

const roles = ["owner", "manager", "marketing"] as const;

export default function ClaimPage() {
  const [query, setQuery] = useState("");
  const [selectedSlug, setSelectedSlug] = useState("");
  const [form, setForm] = useState({ claimantName: "", email: "", phone: "", role: "owner" as (typeof roles)[number] });
  const [status, setStatus] = useState("");

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return places.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 12);
  }, [query]);

  const selected = places.find((p) => p.slug === selectedSlug);

  async function submit() {
    if (!selected) return;
    const res = await fetch("/api/business-claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ placeSlug: selected.slug, businessName: selected.name, ...form }),
    });
    const data = await res.json();
    if (!res.ok) return setStatus(data.error || "Could not submit claim.");
    setStatus("✅ Claim pending review. We’ll follow up soon, cher!");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <section className="reveal rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-6">
        <p className="text-xs tracking-[0.2em] text-[var(--moss)]">BUSINESS TOOLS</p>
        <h1 className="mt-2 text-4xl text-[var(--cajun-red)]">Own a business in Acadiana? Claim your listing.</h1>
        <p className="mt-2 text-[var(--warm-gray)]">Get verified, update your info, post specials, and turn locals into regulars.</p>

        <input value={query} onChange={(e) => setQuery(e.target.value)} className="mt-5 w-full rounded-xl border border-[var(--spanish-moss)]/35 bg-[var(--cream)] px-4 py-3" placeholder="Search your business name..." />

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filtered.map((place) => (
            <button key={place.slug} onClick={() => setSelectedSlug(place.slug)} className={`rounded-xl border p-3 text-left ${selectedSlug === place.slug ? "border-[var(--cajun-red)] bg-[#fff4f0]" : "border-[var(--spanish-moss)]/30 bg-white"}`}>
              <p className="font-semibold">{place.name}</p>
              <p className="text-sm text-[var(--warm-gray)]">{place.city} · {place.cuisine}</p>
            </button>
          ))}
        </div>

        {selected ? <div className="mt-6 rounded-xl bg-[var(--cream)] p-4">
          <p className="font-semibold">Claiming: {selected.name}</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <input placeholder="Your name" className="rounded-lg border p-2" onChange={(e) => setForm((f) => ({ ...f, claimantName: e.target.value }))} />
            <input placeholder="Email" className="rounded-lg border p-2" onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            <input placeholder="Phone" className="rounded-lg border p-2" onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            <select className="rounded-lg border p-2" onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as (typeof roles)[number] }))}>{roles.map((role) => <option key={role} value={role}>{role}</option>)}</select>
          </div>
          <button onClick={submit} className="mt-4 rounded-xl bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">Submit Claim</button>
          {status ? <p className="mt-3 text-sm">{status}</p> : null}
        </div> : null}
      </section>

      <section className="mt-8 rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-6">
        <h2 className="text-2xl text-[var(--cajun-red)]">Plans built for local spots</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          {["Free", "$29/mo Featured", "$79/mo Promoted", "$149/mo Premium"].map((tier) => (
            <div key={tier} className="rounded-xl border border-[var(--spanish-moss)]/30 p-4">
              <p className="font-semibold">{tier}</p>
              <Link href="/coming-soon" className="mt-3 inline-block text-sm text-[var(--cajun-red)] underline">Upgrade</Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
