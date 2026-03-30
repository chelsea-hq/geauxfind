"use client";

import { useState } from "react";

const freeFeatures = [
  "Get your GeauxFind Verified badge",
  "Update your hours, contact info, and business details any time",
  "Share deals and specials with locals",
  "Get discovered through Ask Geaux AI recommendations",
];

const comingSoon = [
  "Featured placement in popular local guides",
  "Simple analytics to see how people find your listing",
  "More visibility tools built with Acadiana businesses in mind",
];

export default function PremiumPreviewPage() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-8">
        <p className="text-xs tracking-[0.18em] text-[var(--moss)]">BUSINESS OWNERS</p>
        <h1 className="mt-2 font-serif text-4xl text-[var(--cajun-red)]">GeauxFind for Business Owners</h1>
        <p className="mt-3 max-w-3xl text-[var(--warm-gray)]">
          We&apos;re building GeauxFind as a community service for Acadiana. Claiming your listing is free and helps locals find accurate,
          up-to-date information about your business.
        </p>
      </section>

      <section className="mt-6 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-6">
        <h2 className="font-serif text-2xl text-[var(--cast-iron)]">What you get today — free</h2>
        <ul className="mt-4 space-y-2 text-sm text-[var(--cast-iron)]">
          {freeFeatures.map((feature) => (
            <li key={feature}>• {feature}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-[var(--cream)] p-6">
        <h2 className="font-serif text-2xl text-[var(--cast-iron)]">Coming Soon</h2>
        <p className="mt-1 text-sm text-[var(--warm-gray)]">
          We&apos;re building this for the community. Premium features are coming — join the waitlist to be first.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[var(--cast-iron)]">
          {comingSoon.map((feature) => (
            <li key={feature}>• {feature}</li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@business.com"
            className="min-h-11 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 bg-white px-3"
          />
          <button
            type="button"
            onClick={() => setJoined(Boolean(email.trim()))}
            className="min-h-11 rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white"
          >
            Join Waitlist
          </button>
        </div>
        {joined ? <p className="mt-3 text-sm text-[var(--moss)]">You&apos;re on the waitlist. We&apos;ll keep you posted.</p> : null}
      </section>
    </main>
  );
}
