"use client";

import { useState } from "react";

const tiers = [
  {
    name: "Free",
    price: "$0",
    features: ["Claimed badge", "Update basic info", "1 deal/month"],
    color: "border-[var(--spanish-moss)]/35",
  },
  {
    name: "Premium",
    price: "$29/mo",
    features: ["Featured placement", "Unlimited deals", "Analytics dashboard", "Priority in search"],
    color: "border-[var(--sunset-gold)] bg-[var(--sunset-gold)]/10",
  },
  {
    name: "Featured",
    price: "$99/mo",
    features: ["Homepage spotlight", "Newsletter inclusion", "Social media shoutout"],
    color: "border-[var(--sunset-gold)] bg-[var(--sunset-gold)]/20",
  },
];

export default function PremiumPreviewPage() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-8">
        <p className="text-xs tracking-[0.18em] text-[var(--moss)]">PREMIUM PREVIEW</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--cajun-red)]">Grow faster with GeauxFind plans</h1>
        <p className="mt-3 text-[var(--warm-gray)]">Pick the listing visibility level that matches your growth goals.</p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <article key={tier.name} className={`rounded-[12px] border p-5 ${tier.color}`}>
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl text-[var(--cast-iron)]">{tier.name}</h2>
              {tier.name !== "Free" ? <span className="rounded-full bg-[var(--cast-iron)] px-2 py-1 text-xs text-white">Coming Soon</span> : null}
            </div>
            <p className="mt-2 text-2xl font-semibold text-[var(--cajun-red)]">{tier.price}</p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--cast-iron)]">
              {tier.features.map((feature) => <li key={feature}>• {feature}</li>)}
            </ul>
          </article>
        ))}
      </section>

      <section className="mt-6 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-[var(--cream)] p-6">
        <h2 className="font-serif text-2xl text-[var(--cast-iron)]">Join the Premium waitlist</h2>
        <p className="mt-1 text-sm text-[var(--warm-gray)]">Be first when paid plans go live.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" className="min-h-11 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 bg-white px-3" />
          <button type="button" onClick={() => setJoined(Boolean(email.trim()))} className="min-h-11 rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white">Notify Me</button>
        </div>
        {joined ? <p className="mt-3 text-sm text-[var(--moss)]">You&apos;re on the list. We&apos;ll let you know when Premium launches.</p> : null}
      </section>
    </main>
  );
}
