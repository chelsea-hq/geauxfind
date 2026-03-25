"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { CategoryNav } from "@/components/CategoryNav";
import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { applyVibeFilter, VibeFilter, VibeKey } from "@/components/VibeFilter";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";
import { events, places } from "@/data/mock-data";
import type { WhatsNewItem } from "@/types";

export default function Home() {
  const [vibe, setVibe] = useState<VibeKey>("all");
  const [whatsNewItems, setWhatsNewItems] = useState<WhatsNewItem[]>([]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GeauxFind",
    url: "https://geauxfind.vercel.app",
    description: "AI-curated local discovery hub for Acadiana, Louisiana"
  };

  const featuredPlaces = useMemo(() => places.filter((p) => p.featured), []);
  const newestItems = useMemo(() => whatsNewItems.slice(0, 4), [whatsNewItems]);
  const weekendEvents = events.slice(0, 3);
  const vibeBest = useMemo(() => applyVibeFilter(places, vibe).slice(0, 6), [vibe]);

  useEffect(() => {
    const loadWhatsNew = async () => {
      try {
        const res = await fetch("/api/whats-new", { cache: "no-store" });
        const data = (await res.json()) as WhatsNewItem[];
        setWhatsNewItems(Array.isArray(data) ? data : []);
      } catch {
        setWhatsNewItems([]);
      }
    };

    loadWhatsNew();
  }, []);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden bg-[linear-gradient(120deg,rgba(139,26,26,0.94),rgba(74,124,89,0.8)),url('https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-2 text-sm tracking-[0.2em]">ACADIANA LOCAL DISCOVERY</p>
          <h1 className="font-serif text-5xl">Find your next favorite in Cajun Country</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/90">From crawfish boils to festival weekends, GeauxFind curates the heart of South Louisiana.</p>
          <div className="mt-7">
            <SearchBar />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-8">
        <VibeFilter selected={vibe} onChange={setVibe} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-2">
        <h2 className="mb-5 font-serif text-3xl text-[var(--cajun-red)]">Explore by Category</h2>
        <CategoryNav />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-3xl text-[var(--cajun-red)]">What&apos;s New in Acadiana</h2>
          <Link href="/whats-new" className="text-sm underline">See full feed</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {newestItems.map((item) => (
            <a
              key={`${item.source}-${item.id}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 bg-white"
            >
              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} className="h-36 w-full object-cover" /> : <div className="h-36 w-full bg-[var(--cream-bg)]" />}
              <div className="p-4">
                <p className="text-xs uppercase tracking-wide text-[var(--bayou-green)]">{item.source}</p>
                <h3 className="font-serif text-xl">{item.title}</h3>
                <p className="text-xs text-[var(--warm-gray)]">{item.city ?? item.category}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-3xl text-[var(--cajun-red)]">This Weekend</h2>
          <Link href="/this-weekend" className="text-sm underline">See full roundup</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{weekendEvents.map((e) => <EventCard key={e.slug} event={e} />)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-2 font-serif text-3xl text-[var(--cajun-red)]">Geaux with the Best</h2>
        <p className="mb-5 text-[var(--warm-gray)]">Our editorial picks — places locals recommend before you even finish asking.</p>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {featuredPlaces.map((p) => (
            <Link key={p.slug} href={`/place/${p.slug}`} className="group overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <img src={p.image} alt={p.name} className="h-44 w-full object-cover" />
              <div className="space-y-2 p-4">
                <h3 className="font-serif text-2xl text-[var(--cast-iron)]">{p.name}</h3>
                <p className="text-xs uppercase tracking-wide text-[var(--bayou-green)]">{p.city} · {p.cuisine}</p>
                <p className="text-sm text-[var(--cast-iron)]/85">{p.featuredReason}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-3xl text-[var(--cajun-red)]">Vibe Picks</h2>
          <span className="text-sm text-[var(--warm-gray)]">{vibeBest.length} matches</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {vibeBest.map((p) => <PlaceCard key={p.slug} place={p} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="rounded-3xl border border-[var(--bayou-gold)]/30 bg-[var(--cream-bg)] p-8">
          <p className="text-sm uppercase tracking-widest text-[var(--bayou-green)]">Community Cookbook</p>
          <h3 className="mt-2 font-serif text-3xl text-[var(--cajun-red)]">Got a family recipe?</h3>
          <p className="mt-2 text-[var(--cast-iron)]/80">Share your gumbo, étouffée, or secret sauce and we might feature it on GeauxFind.</p>
          <Link href="/recipes/submit" className="mt-4 inline-block rounded-full bg-[var(--cajun-red)] px-5 py-2 font-semibold text-white">Submit a Recipe</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl bg-[var(--cast-iron)] p-8 text-white">
          <p className="text-sm uppercase tracking-widest text-[var(--bayou-gold)]">Ask Acadiana</p>
          <h3 className="mt-2 font-serif text-3xl">Where can I find live zydeco and late-night boudin?</h3>
          <p className="mt-2 text-white/80">Ask in plain language. AI answers coming soon — community flavor included.</p>
          <Link href="/ask" className="mt-4 inline-block rounded-full bg-[var(--bayou-gold)] px-5 py-2 font-semibold text-[var(--cast-iron)] transition hover:-translate-y-0.5 hover:shadow-lg">
            Try Ask Acadiana
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <NewsletterSignup />
      </section>

    </main>
  );
}
