"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CategoryNav } from "@/components/CategoryNav";
import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";
import { events, places } from "@/data/mock-data";
import type { WhatsNewItem } from "@/types";

export default function Home() {
  const [whatsNewItems, setWhatsNewItems] = useState<WhatsNewItem[]>([]);

  const featuredPlaces = useMemo(() => {
    const deduped = Array.from(new Map(places.filter((p) => p.featured).map((p) => [p.name.toLowerCase(), p])).values());
    return deduped.slice(0, 6);
  }, []);

  const newestItems = useMemo(() => whatsNewItems.slice(0, 4), [whatsNewItems]);
  const weekendEvents = events.slice(0, 3);

  useEffect(() => {
    fetch("/api/whats-new", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setWhatsNewItems(Array.isArray(data) ? data : []))
      .catch(() => setWhatsNewItems([]));
  }, []);

  return (
    <main className="pb-10">
      <section className="relative overflow-hidden bg-[linear-gradient(120deg,rgba(139,26,26,0.94),rgba(74,124,89,0.8)),url('https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center px-4 py-20 text-white">
        <div className="mx-auto grid max-w-5xl items-center gap-8 text-center md:grid-cols-[1.15fr_0.85fr] md:text-left">
          <div>
            <h1 className="text-balance font-serif text-5xl">Find your next favorite in Cajun Country</h1>
            <p className="mx-auto mt-3 max-w-2xl text-white/90 md:mx-0">From crawfish boils to festival weekends, GeauxFind curates the heart of South Louisiana.</p>
            <div className="mt-7"><SearchBar /></div>
          </div>
          <div className="mx-auto w-full max-w-[240px] md:max-w-[280px]">
            <Image src="/mascot/gator-wave.svg" alt="Geaux the Gator waving hello" width={280} height={280} className="h-auto w-full" priority />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        <Link href="/crawfish" className="block rounded-3xl border border-[var(--bayou-gold)]/40 bg-[linear-gradient(135deg,#fff8f0,#ffe8c2)] p-6 shadow-sm transition hover:shadow-md">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cajun-red)]">Seasonal Spotlight</p>
          <h2 className="mt-2 font-serif text-3xl text-[var(--cajun-red)]">🦞 Crawfish Season is Here!</h2>
          <p className="mt-2 text-[var(--warm-gray)]">Live price tracker, 18 verified boil spots, upcoming crawfish events, and local pro tips for March-May peak season.</p>
          <span className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--bayou-gold)] px-5 py-2 font-semibold text-[var(--cast-iron)]">See the Crawfish Guide</span>
        </Link>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4"><CategoryNav /></section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-3xl text-[var(--cajun-red)]">What&apos;s New in Acadiana</h2><Link href="/whats-new" className="text-sm underline">See full feed</Link></div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {newestItems.map((item) => (
            <a key={`${item.source}-${item.id}`} href={item.url} target="_blank" rel="noopener noreferrer" className="overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md">
              <div className="relative aspect-[16/10] w-full bg-[var(--cream-bg)]">
                <Image src={item.imageUrl || "/placeholder.svg"} alt={item.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" />
              </div>
              <div className="p-4"><p className="text-xs uppercase tracking-wide text-[var(--bayou-green)]">{item.source}</p><h3 className="font-serif text-lg">{item.title}</h3></div>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-3xl text-[var(--cajun-red)]">This Weekend</h2><Link href="/this-weekend" className="text-sm underline">See full roundup</Link></div>
        <div className="grid gap-6 md:grid-cols-3">{weekendEvents.map((e) => <EventCard key={e.slug} event={e} />)}</div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <h2 className="mb-2 font-serif text-3xl text-[var(--cajun-red)]">Geaux with the Best</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featuredPlaces.map((p) => <PlaceCard key={p.slug} place={p} />)}</div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="rounded-3xl border border-[var(--bayou-gold)]/30 bg-[var(--cream-bg)] p-8">
          <p className="text-sm uppercase tracking-widest text-[var(--bayou-green)]">Community Cookbook</p>
          <h3 className="mt-2 font-serif text-3xl text-[var(--cajun-red)]">Got a family recipe?</h3>
          <Link href="/recipes/submit" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--bayou-gold)] px-6 py-3 text-lg font-bold text-[var(--cast-iron)]">📝 Submit a Recipe</Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4">
        <div className="rounded-3xl bg-[var(--cast-iron)] p-8 text-white">
          <p className="text-sm uppercase tracking-widest text-[var(--bayou-gold)]">Ask Acadiana</p>
          <h3 className="mt-2 text-balance font-serif text-3xl">Where can I find live zydeco and late-night boudin?</h3>
          <Link href="/ask" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[var(--bayou-gold)] px-5 py-2 font-semibold text-[var(--cast-iron)] hover:opacity-90">Try Ask Acadiana</Link>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4"><NewsletterSignup /></section>
    </main>
  );
}
