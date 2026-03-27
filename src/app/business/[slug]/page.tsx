"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { BusinessProfile } from "@/types";
import { usePlace } from "@/hooks/use-place";

export default function BusinessDashboardPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { place, loading: placeLoading } = usePlace(slug);
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [specialText, setSpecialText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch(`/api/business/${slug}`).then((r) => r.json()).then(setProfile).catch(() => setProfile(null));
  }, [slug]);

  if (placeLoading || !profile) return <main className="mx-auto max-w-4xl p-8">Loading dashboard...</main>;
  if (!place) return <main className="mx-auto max-w-4xl p-8">Business not found.</main>;

  async function save() {
    const res = await fetch(`/api/business/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setStatus(res.ok ? "Saved!" : "Could not save changes.");
  }

  async function addSpecial() {
    if (!specialText.trim()) return;
    setProfile((p) => p ? { ...p, specials: [{ id: crypto.randomUUID(), text: specialText, createdAt: new Date().toISOString() }, ...p.specials] } : p);
    setSpecialText("");
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-4xl text-[var(--cajun-red)]">{place.name} Business Dashboard</h1>
      <p className="mt-2 text-[var(--warm-gray)]">Mock analytics: <strong>{Math.floor(Math.random() * 800) + 220}</strong> views this week</p>
      <div className="mt-4 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-[var(--cream)] px-4 py-3 text-sm text-[var(--cast-iron)]">
        Is this your business? <Link href={`/claim/${slug}`} className="font-semibold text-[var(--cajun-red)] underline">Claim it free</Link>
      </div>

      <section className="mt-6 grid gap-3 rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
        <textarea className="rounded-lg border p-2" value={profile.description} onChange={(e) => setProfile({ ...profile, description: e.target.value })} />
        <input className="rounded-lg border p-2" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        <input className="rounded-lg border p-2" value={profile.website} onChange={(e) => setProfile({ ...profile, website: e.target.value })} />
        <textarea className="rounded-lg border p-2" value={profile.hours.join("\n")} onChange={(e) => setProfile({ ...profile, hours: e.target.value.split("\n") })} />
        <button onClick={save} className="w-fit rounded-xl bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">Save Business Info</button>
        {status ? <p className="text-sm">{status}</p> : null}
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
        <h2 className="text-2xl text-[var(--cajun-red)]">Post a Special</h2>
        <div className="mt-3 flex gap-2">
          <input className="flex-1 rounded-lg border p-2" placeholder="$5 boudin balls today!" value={specialText} onChange={(e) => setSpecialText(e.target.value)} />
          <button onClick={addSpecial} className="rounded-lg border px-4">Add</button>
        </div>
        <ul className="mt-3 space-y-2">
          {profile.specials.map((s) => <li key={s.id} className="rounded-lg bg-[var(--cream)] p-2">🔥 {s.text}</li>)}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
        <h2 className="text-2xl text-[var(--cajun-red)]">Upload Photos</h2>
        <form action="/api/photos" method="post" encType="multipart/form-data" className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="slug" value={slug} />
          <input type="file" name="file" accept="image/*" required />
          <input type="text" name="caption" placeholder="Caption" className="rounded-lg border p-2" />
          <button className="w-fit rounded-lg border px-3 py-2">Upload</button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
        <h2 className="text-2xl text-[var(--cajun-red)]">Upgrade Tiers</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          {["Free", "$29/mo Featured", "$79/mo Promoted", "$149/mo Premium"].map((tier) => (
            <div key={tier} className="rounded-xl border p-3">
              <p className="font-semibold">{tier}</p>
              <Link href="/coming-soon" className="text-sm text-[var(--cajun-red)] underline">Upgrade</Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
