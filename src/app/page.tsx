"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";
import { events, places, recipes } from "@/data/mock-data";
import type { WhatsNewItem } from "@/types";

const HERO_IMAGE = "https://images.unsplash.com/photo-1548690312-e3b507d8c110?w=1920&q=80";

export default function Home() {
  const [whatsNewItems, setWhatsNewItems] = useState<WhatsNewItem[]>([]);

  const featuredPlaces = useMemo(() => places.filter((p) => p.featured).slice(0, 5), []);
  const weekendEvents = events.slice(0, 3);
  const aiPicks = places.slice(2, 10);
  const featuredRecipe = recipes[0];

  useEffect(() => {
    fetch("/api/whats-new", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setWhatsNewItems(Array.isArray(data) ? data : []))
      .catch(() => setWhatsNewItems([]));

    const targets = Array.from(document.querySelectorAll(".reveal"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("is-visible");
        });
      },
      { threshold: 0.16 }
    );
    targets.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <main className="pb-16">
      <section className="relative flex min-h-[92vh] items-center overflow-hidden px-4 py-16 text-white">
        <Image src={HERO_IMAGE} alt="Louisiana bayou sunset at golden hour" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(26,58,42,0.68),rgba(45,41,38,0.42))]" />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-10 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="fade-up text-sm tracking-[0.22em] text-white/85">LOCAL • CURATED • ACADIANA</p>
            <h1 className="fade-up stagger-1 mt-3 text-5xl leading-tight md:text-7xl">Discover Acadiana</h1>
            <p className="fade-up stagger-2 mt-4 max-w-xl text-lg text-white/92 md:text-xl">Your AI-powered guide to the best of Lafayette & Cajun Country.</p>
            <div className="fade-up stagger-3 mt-8 rounded-[12px] border border-white/35 bg-white/20 p-2 shadow-2xl backdrop-blur-md">
              <SearchBar />
            </div>
          </div>

          <div className="fade-up stagger-4 relative mx-auto w-full max-w-[240px] md:max-w-[300px]">
            <Image src="/mascot/gator-wave.svg" alt="Geaux the gator mascot waving" width={300} height={300} className="h-auto w-full drop-shadow-[0_16px_26px_rgba(0,0,0,0.35)]" />
          </div>
        </div>

        <a href="#geaux-best" className="chevron-bounce absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border border-white/45 bg-black/20 p-2 text-white" aria-label="Scroll to featured places">
          <ChevronDown className="h-5 w-5" />
        </a>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 reveal">
        <Link href="/crawfish" className="block rounded-[12px] bg-[linear-gradient(120deg,#bf1f34,#d46a2a,#e59d39)] p-6 text-white shadow-lg card-lift">
          <p className="text-xs tracking-[0.18em] text-white/80">SEASONAL SPOTLIGHT</p>
          <h2 className="mt-2 text-3xl md:text-4xl">It&apos;s Crawfish Season! 🦞</h2>
          <p className="mt-2 max-w-2xl text-white/90">Live prices, where to boil, and this week&apos;s can&apos;t-miss mudbug events across Acadiana.</p>
          <p className="crawfish-shimmer mt-4 text-lg font-semibold">Geaux grab your sack and follow the spice trail…</p>
        </Link>
      </section>

      <section id="geaux-best" className="mx-auto mt-16 max-w-6xl px-4 reveal">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-[var(--moss)]">⚜ Editorial Pick</p>
            <h2 className="mt-2 text-4xl text-[var(--cajun-red)]">Geaux with the Best</h2>
          </div>
          <Link href="/explore" className="gf-link text-sm text-[var(--cast-iron)]">See all spots</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {featuredPlaces[0] ? <PlaceCard place={featuredPlaces[0]} featured /> : null}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {featuredPlaces.slice(1).map((place) => (
              <PlaceCard key={place.slug} place={place} compact />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 reveal">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-3xl text-[var(--cajun-red)]">AI Picks For You</h2>
          <Sparkles className="h-5 w-5 text-[var(--sunset-gold)]" />
        </div>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[var(--cream)] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[var(--cream)] to-transparent" />
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
            {aiPicks.map((pick) => (
              <div key={pick.slug} className="min-w-[290px] snap-start">
                <PlaceCard place={pick} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 reveal">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-3xl text-[var(--cajun-red)]">This Weekend</h2><Link href="/this-weekend" className="gf-link text-sm">See full roundup</Link></div>
        <div className="grid gap-6 md:grid-cols-3">{weekendEvents.map((e) => <EventCard key={e.slug} event={e} />)}</div>
      </section>

      <section className="mx-auto mt-16 max-w-6xl px-4 reveal">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-3xl text-[var(--cajun-red)]">What&apos;s New</h2><Link href="/whats-new" className="gf-link text-sm">See full feed</Link></div>
        <div className="space-y-4 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:p-6">
          {whatsNewItems.length === 0 ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-[10px] bg-[var(--spanish-moss)]/20 shimmer" />) : whatsNewItems.slice(0, 4).map((item) => (
            <a key={`${item.source}-${item.id}`} href={item.url} target="_blank" rel="noopener noreferrer" className="group grid gap-4 rounded-[10px] border border-transparent p-2 transition-colors hover:border-[var(--sunset-gold)]/35 hover:bg-[var(--cream)] md:grid-cols-[140px_1fr_auto]">
              <div className="relative h-24 w-full overflow-hidden rounded-[8px] md:h-[88px]">
                <Image src={item.imageUrl || "/placeholder.svg"} alt={item.title} fill sizes="140px" className="object-cover" />
              </div>
              <div>
                <h3 className="text-lg leading-snug group-hover:text-[var(--cajun-red)]">{item.title}</h3>
                <p className="mt-1 text-sm text-[var(--warm-gray)]">{item.source}</p>
              </div>
              <div className="self-start rounded-[8px] bg-[var(--cream)] px-2 py-1 text-xs text-[var(--warm-gray)]">Latest</div>
            </a>
          ))}
        </div>
      </section>

      {featuredRecipe ? (
        <section className="mx-auto mt-16 max-w-6xl px-4 reveal">
          <h2 className="mb-4 text-3xl text-[var(--cajun-red)]">From the Kitchen</h2>
          <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
            <div className="rounded-[12px] border border-[var(--spanish-moss)]/35 bg-white p-3">
              <Image src={featuredRecipe.image || "/placeholder.svg"} alt={featuredRecipe.title} width={900} height={500} className="h-[280px] w-full rounded-[10px] object-cover" />
              <h3 className="mt-4 text-2xl">{featuredRecipe.title}</h3>
              <Link href={`/recipe/${featuredRecipe.slug}`} className="mt-3 inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-[0.98]">View Recipe</Link>
            </div>
            <div className="rounded-[12px] bg-[var(--cast-iron)] p-6 text-white">
              <p className="text-xs tracking-[0.17em] text-[var(--sunset-gold)]">ASK GEAUX</p>
              <h3 className="mt-2 text-2xl">Need a late-night bite, a dance floor, and a porch with good gumbo?</h3>
              <Link href="/ask" className="mt-4 inline-flex min-h-11 items-center rounded-[10px] bg-[var(--sunset-gold)] px-4 py-2 font-semibold text-[var(--cast-iron)]">Ask Geaux 🐊</Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-16 max-w-6xl px-4 reveal"><NewsletterSignup /></section>
    </main>
  );
}
