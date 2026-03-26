"use client";

import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SearchBar } from "@/components/SearchBar";
import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";
import { events, places, recipes } from "@/data/mock-data";
import { JsonLd } from "@/components/JsonLd";
import { FaqSection } from "@/components/FaqSection";
import type { WhatsNewItem } from "@/types";

export default function Home() {
  const [whatsNewItems, setWhatsNewItems] = useState<WhatsNewItem[]>([]);
  const [trending, setTrending] = useState<Array<{ query: string; count: number; spark: Array<{ label: string; count: number }> }>>([]);

  const featuredPlaces = useMemo(() => {
    const seen = new Set<string>();
    return places.filter((p) => {
      if (!p.featured || seen.has(p.name)) return false;
      seen.add(p.name);
      return true;
    }).slice(0, 5);
  }, []);
  const weekendEvents = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const daysToFriday = (5 - day + 7) % 7;
    const friday = new Date(now);
    friday.setDate(now.getDate() + daysToFriday);
    friday.setHours(0, 0, 0, 0);

    const sunday = new Date(friday);
    sunday.setDate(friday.getDate() + 2);
    sunday.setHours(23, 59, 59, 999);

    return events
      .filter((e) => {
        const d = new Date(`${e.date}T12:00:00`);
        return d >= friday && d <= sunday;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 6);
  }, []);
  const aiPicks = places.slice(2, 10);
  const featuredRecipe = recipes[0];

  useEffect(() => {
    fetch("/api/whats-new", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setWhatsNewItems(Array.isArray(data) ? data : []))
      .catch(() => setWhatsNewItems([]));

    fetch("/api/trending?limit=10", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setTrending(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setTrending([]));

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

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GeauxFind",
    url: "https://geauxfind.vercel.app",
    description: "AI-curated local discovery for Acadiana, Louisiana",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://geauxfind.vercel.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <main className="pb-16">
      <JsonLd data={websiteSchema} />
      {/* Hero — compact, Cajun-inspired illustrated background */}
      <section className="cajun-hero relative overflow-hidden px-4 pb-10 pt-24 md:pb-14 md:pt-28">
        {/* Decorative SVG elements */}
        <svg className="cajun-hero-deco cajun-hero-deco--fleur" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M60 10C60 10 70 30 60 50C50 30 60 10 60 10Z" fill="currentColor" opacity="0.12"/>
          <path d="M60 50C60 50 80 40 90 55C75 55 60 50 60 50Z" fill="currentColor" opacity="0.10"/>
          <path d="M60 50C60 50 40 40 30 55C45 55 60 50 60 50Z" fill="currentColor" opacity="0.10"/>
          <path d="M60 50C60 50 70 70 60 90C50 70 60 50 60 50Z" fill="currentColor" opacity="0.08"/>
          <circle cx="60" cy="50" r="6" fill="currentColor" opacity="0.15"/>
        </svg>
        <svg className="cajun-hero-deco cajun-hero-deco--fleur2" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M60 10C60 10 70 30 60 50C50 30 60 10 60 10Z" fill="currentColor" opacity="0.08"/>
          <path d="M60 50C60 50 80 40 90 55C75 55 60 50 60 50Z" fill="currentColor" opacity="0.06"/>
          <path d="M60 50C60 50 40 40 30 55C45 55 60 50 60 50Z" fill="currentColor" opacity="0.06"/>
          <circle cx="60" cy="50" r="6" fill="currentColor" opacity="0.10"/>
        </svg>
        {/* Crawfish decorative accents */}
        <div className="cajun-hero-deco cajun-hero-deco--crawfish" aria-hidden="true">🦞</div>
        <div className="cajun-hero-deco cajun-hero-deco--pepper" aria-hidden="true">🌶️</div>

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="fade-up mb-2 flex items-center gap-2">
            <span className="inline-block h-px w-8 bg-[var(--sunset-gold)]"></span>
            <p className="text-xs font-semibold tracking-[0.25em] text-[var(--sunset-gold)]">LOCAL • CURATED • AI-POWERED</p>
            <span className="inline-block h-px w-8 bg-[var(--sunset-gold)]"></span>
          </div>

          <h1 className="fade-up stagger-1 mt-2 text-4xl leading-tight text-white md:text-6xl" style={{ textWrap: "balance" as never }}>
            Discover the Heart of <span className="text-[var(--sunset-gold)]">Acadiana</span>
          </h1>

          <p className="fade-up stagger-2 mx-auto mt-3 max-w-2xl text-base text-white/85 md:text-lg">
            Your AI-powered guide to restaurants, events, hidden gems & everything Cajun Country has to offer.
          </p>

          <div className="fade-up stagger-3 mx-auto mt-6 w-full max-w-2xl">
            <div className="rounded-[14px] border border-white/25 bg-white/15 p-1.5 shadow-2xl backdrop-blur-md">
              <SearchBar />
            </div>
          </div>

          <div className="fade-up stagger-4 mt-5 w-full overflow-x-auto pb-2 text-sm text-white/75 scrollbar-hide">
            <div className="flex flex-nowrap items-center justify-start gap-2 sm:flex-wrap sm:justify-center sm:gap-3">
              <Link href="/explore" className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/20 px-3 py-1.5 transition-colors duration-200 hover:border-white/50 hover:text-white">🍴 Restaurants</Link>
              <Link href="/crawfish" className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/20 px-3 py-1.5 transition-colors duration-200 hover:border-white/50 hover:text-white">🦞 Crawfish</Link>
              <Link href="/events" className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/20 px-3 py-1.5 transition-colors duration-200 hover:border-white/50 hover:text-white">🎶 Events</Link>
              <Link href="/plan" className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/20 px-3 py-1.5 transition-colors duration-200 hover:border-white/50 hover:text-white">🗺️ Plan Your Day</Link>
              <Link href="/whos-got-it" className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/20 px-3 py-1.5 transition-colors duration-200 hover:border-white/50 hover:text-white">⚔️ Who&apos;s Got It?</Link>
              <Link href="/ask" className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-white/20 px-3 py-1.5 transition-colors duration-200 hover:border-white/50 hover:text-white">🐊 Ask Geaux</Link>
            </div>
          </div>

          {/* Small gator accent */}
          <div className="fade-up stagger-4 mt-4 md:absolute md:-right-4 md:bottom-0 md:mt-0">
            <Image src="/mascot/gator-wave.svg" alt="Geaux the gator" width={100} height={100} className="h-auto w-16 opacity-80 drop-shadow-lg md:w-24" />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-6xl px-4 reveal">
        <Link href="/crawfish" className="block rounded-[12px] bg-[linear-gradient(120deg,#bf1f34,#d46a2a,#e59d39)] p-6 text-white shadow-lg card-lift">
          <p className="text-xs tracking-[0.18em] text-white/80">SEASONAL SPOTLIGHT</p>
          <h2 className="mt-2 text-3xl md:text-4xl">It&apos;s Crawfish Season! 🦞</h2>
          <p className="mt-2 max-w-2xl text-white/90">Live prices, where to boil, and this week&apos;s can&apos;t-miss mudbug events across Acadiana.</p>
          <p className="crawfish-shimmer mt-4 text-lg font-semibold">Geaux grab your sack and follow the spice trail…</p>
        </Link>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 reveal">
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/cajun-connection" className="block rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-6 card-lift">
            <p className="text-xs tracking-[0.18em] text-[var(--moss)]">NEW DIRECTORY</p>
            <h2 className="mt-2 text-3xl text-[var(--cajun-red)] md:text-4xl">Cajun Connection ⚜</h2>
            <p className="mt-2 text-[var(--cast-iron)]/80">Discover Louisiana-made seasonings, food vendors, and featured Cajun fluencers across Acadiana.</p>
          </Link>
          <Link href="/kids-eat-free" className="block rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-6 card-lift">
            <p className="text-xs tracking-[0.18em] text-[var(--moss)]">FAMILY DEALS</p>
            <h2 className="mt-2 text-3xl text-[var(--cajun-red)] md:text-4xl">Kids Eat Free 🍽️</h2>
            <p className="mt-2 text-[var(--cast-iron)]/80">Where the little ones eat free or cheap in Lafayette, Broussard, and Acadiana — organized by day of the week.</p>
          </Link>
          <Link href="/live-music" className="block rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-6 card-lift">
            <p className="text-xs tracking-[0.18em] text-[var(--moss)]">TONIGHT</p>
            <h2 className="mt-2 text-3xl text-[var(--cajun-red)] md:text-4xl">Live Music 🎵</h2>
            <p className="mt-2 text-[var(--cast-iron)]/80">Cajun, zydeco, blues, and beyond — find live music across Acadiana every night of the week.</p>
          </Link>
          <Link href="/weekend-brunch" className="block rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-6 card-lift">
            <p className="text-xs tracking-[0.18em] text-[var(--moss)]">WEEKENDS</p>
            <h2 className="mt-2 text-3xl text-[var(--cajun-red)] md:text-4xl">Weekend Brunch 🥂</h2>
            <p className="mt-2 text-[var(--cast-iron)]/80">The best Saturday and Sunday brunch across Acadiana — from bottomless mimosas to Cajun Benedict.</p>
          </Link>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4 reveal">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl text-[var(--cajun-red)]">Food & Drink Guides</h2>
              <Link href="/deals" className="gf-link text-sm">See all offers</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/happy-hours" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">AFTER WORK</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Happy Hours</h3></Link>
              <Link href="/daily-specials" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">PLATE LUNCH</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Daily Specials</h3></Link>
              <Link href="/late-night" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">OPEN LATE</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Late Night Eats</h3></Link>
              <Link href="/coffee" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">CAFFEINE FIX</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Coffee Shops</h3></Link>
              <Link href="/breweries" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">CRAFT TRAIL</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Breweries</h3></Link>
              <Link href="/food-trucks" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">MOBILE FOOD</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Food Trucks</h3></Link>
            </div>
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-3xl text-[var(--cajun-red)]">Things to Do</h2>
              <Link href="/festivals" className="gf-link text-sm">Full calendar</Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Link href="/live-music" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">TONIGHT</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Live Music</h3></Link>
              <Link href="/dance-halls" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">CULTURE CORE</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Dance Halls</h3></Link>
              <Link href="/festivals" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">YEAR-ROUND</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Festivals</h3></Link>
              <Link href="/outdoor" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">BAYOU AIR</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Outdoor Adventures</h3></Link>
              <Link href="/photo-spots" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">CAMERA READY</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Photo Spots</h3></Link>
              <Link href="/date-night" className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 card-lift"><p className="text-xs text-[var(--moss)]">COUPLES</p><h3 className="mt-1 text-lg text-[var(--cajun-red)]">Date Night</h3></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="geaux-best" className="mx-auto mt-16 max-w-6xl px-4 reveal">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <p className="text-xs tracking-[0.2em] text-[var(--moss)]">⚜ Editorial Pick</p>
            <h2 className="mt-2 text-4xl text-[var(--cajun-red)]">Geaux with the Best</h2>
          </div>
          <Link href="/explore" className="gf-link text-sm text-[var(--cast-iron)]">See all spots</Link>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
          {featuredPlaces[0] ? <PlaceCard place={featuredPlaces[0]} featured /> : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {featuredPlaces.slice(1, 5).map((place) => (
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
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {aiPicks.map((pick) => (
              <div key={pick.slug} className="min-w-[280px] snap-start">
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

      <section className="mx-auto mt-16 max-w-6xl px-4 reveal">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-3xl text-[var(--cajun-red)]">Trending in Acadiana</h2><Link href="/trending" className="gf-link text-sm">View trends</Link></div>
        <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:p-6">
          {trending.length === 0 ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 rounded-[10px] bg-[var(--spanish-moss)]/20 shimmer" />) : trending.slice(0, 10).map((t, idx) => (
            <div key={t.query} className="flex items-center justify-between rounded-[10px] bg-[var(--cream)] px-3 py-2">
              <p className="text-sm"><span className="font-semibold">#{idx + 1}</span> {t.query} {t.count >= 3 ? "🔥" : ""}</p>
              <div className="flex items-end gap-1">{t.spark.slice(-7).map((p, i) => <span key={i} className="w-1.5 rounded-sm bg-[var(--cajun-red)]/70" style={{ height: `${Math.max(6, p.count * 6)}px` }} />)}</div>
            </div>
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

      <section className="mx-auto max-w-6xl px-4">
        <FaqSection
          title="Acadiana Quick Answers"
          items={[
            {
              question: "What is Acadiana?",
              answer: "Acadiana is the culturally rich south Louisiana region known for Cajun and Creole food, music, festivals, and warm community traditions.",
            },
            {
              question: "Best restaurants in Lafayette LA?",
              answer: "Top Lafayette picks often include local Cajun seafood spots, boudin favorites, and brunch destinations — GeauxFind helps you filter by vibe, city, and budget.",
            },
            {
              question: "Things to do in Cajun Country?",
              answer: "In Cajun Country you can catch live zydeco, explore food trails, attend festivals, discover hidden local finds, and plan weekend adventures across Acadiana.",
            },
          ]}
        />
      </section>
    </main>
  );
}
