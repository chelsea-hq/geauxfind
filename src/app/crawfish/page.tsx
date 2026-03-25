"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NewsletterSignup } from "@/components/sections/NewsletterSignup";
import { FaqSection } from "@/components/FaqSection";
import crawfishData from "../../../data/crawfish-season.json";

type Spot = (typeof crawfishData.spots)[number];
type ExtraSpot = Spot & { phone?: string | null };
type CityFilter = "All" | "Lafayette" | "Broussard" | "Youngsville" | "Breaux Bridge" | "Other";
type SortOption = "Best Price" | "Near Me" | "Drive-Thru" | "Dine-In";

const cityCenterCoords: Record<string, { lat: number; lng: number }> = {
  Lafayette: { lat: 30.2241, lng: -92.0198 },
  Broussard: { lat: 30.1471, lng: -91.9618 },
  Youngsville: { lat: 30.0996, lng: -91.9901 },
  "Breaux Bridge": { lat: 30.2735, lng: -91.8993 },
  Rayne: { lat: 30.2341, lng: -92.2687 },
  Abbeville: { lat: 29.9746, lng: -92.1343 },
  "Church Point": { lat: 30.4038, lng: -92.2154 }
};

function distanceMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CrawfishPage() {
  const [cityFilter, setCityFilter] = useState<CityFilter>("All");
  const [sortBy, setSortBy] = useState<SortOption>("Best Price");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showTipsMobile, setShowTipsMobile] = useState(false);

  useEffect(() => {
    if (sortBy !== "Near Me" || typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [sortBy]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return crawfishData.events.filter((event) => new Date(`${event.endDate}T23:59:59`) >= now);
  }, []);

  const curatedSpots = crawfishData.spots.slice(0, 18);
  const extraSpots: ExtraSpot[] = (crawfishData as typeof crawfishData & { extraSpots?: ExtraSpot[] }).extraSpots ?? [];
  const lastUpdatedLabel = crawfishData.priceTracker.lastUpdated
    ? new Date(crawfishData.priceTracker.lastUpdated).toLocaleString()
    : null;

  const visibleSpots = useMemo(() => {
    const filtered = curatedSpots.filter((spot) => {
      if (cityFilter === "All") return true;
      if (cityFilter === "Other") {
        return !["Lafayette", "Broussard", "Youngsville", "Breaux Bridge"].includes(spot.city);
      }
      return spot.city === cityFilter;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === "Best Price") {
        const aPrice = a.pricePerLbEstimate ?? Number.POSITIVE_INFINITY;
        const bPrice = b.pricePerLbEstimate ?? Number.POSITIVE_INFINITY;
        if (aPrice !== bPrice) return aPrice - bPrice;
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "Near Me" && userLocation) {
        const aCoord = cityCenterCoords[a.city];
        const bCoord = cityCenterCoords[b.city];
        const aDistance = aCoord
          ? distanceMiles(userLocation.lat, userLocation.lng, aCoord.lat, aCoord.lng)
          : Number.POSITIVE_INFINITY;
        const bDistance = bCoord
          ? distanceMiles(userLocation.lat, userLocation.lng, bCoord.lat, bCoord.lng)
          : Number.POSITIVE_INFINITY;
        if (aDistance !== bDistance) return aDistance - bDistance;
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "Drive-Thru") {
        const aDrive = a.tags.includes("Drive-Thru") ? 0 : 1;
        const bDrive = b.tags.includes("Drive-Thru") ? 0 : 1;
        if (aDrive !== bDrive) return aDrive - bDrive;
        return a.name.localeCompare(b.name);
      }

      if (sortBy === "Dine-In") {
        const aDine = a.tags.includes("Dine-In") ? 0 : 1;
        const bDine = b.tags.includes("Dine-In") ? 0 : 1;
        if (aDine !== bDine) return aDine - bDine;
        return a.name.localeCompare(b.name);
      }

      return a.name.localeCompare(b.name);
    });

    return sorted;
  }, [cityFilter, sortBy, userLocation, curatedSpots]);

  return (
    <main className="pb-12">
      <section className="bg-[linear-gradient(135deg,#8B1A1A,#bf5a24)] px-4 py-14 text-white">
        <div className="mx-auto grid max-w-6xl items-center gap-6 md:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="mb-3 inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">{crawfishData.hero.status}</p>
            <h1 className="text-4xl md:text-6xl">{crawfishData.hero.headline}</h1>
            <p className="mt-3 text-lg text-white/90 md:text-2xl">{crawfishData.hero.subtitle}</p>
            <div className="mt-6 inline-flex rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-base font-semibold md:text-lg">
              {crawfishData.hero.quickStats}
            </div>
          </div>
          <div className="mx-auto w-full max-w-[220px] md:max-w-[260px]">
            <Image src="/mascot/gator-crawfish.svg" alt="Geaux holding a crawfish" width={260} height={260} className="h-auto w-full" />
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        <div className="rounded-3xl border border-[var(--bayou-gold)]/30 bg-[#FFF8F0] p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-[var(--cajun-red)]">Price Tracker</p>
              <p className="mt-2 text-3xl font-bold text-[var(--cast-iron)]">{crawfishData.priceTracker.currentRange}</p>
              <p className="mt-2 text-[var(--warm-gray)]">{crawfishData.priceTracker.trend}</p>
              <p className="mt-1 text-[var(--warm-gray)]">{crawfishData.priceTracker.bestDealTip}</p>
              <p className="mt-1 text-sm text-[var(--warm-gray)]">{crawfishData.priceTracker.source}</p>
              {lastUpdatedLabel ? <p className="mt-1 text-xs text-[var(--warm-gray)]">Last updated: {lastUpdatedLabel}</p> : null}
            </div>
            <div className="flex flex-col items-start gap-2 md:items-end">
              <Link
                href={crawfishData.priceTracker.sourceLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--bayou-gold)] px-5 py-2 font-semibold text-[var(--cast-iron)]"
              >
                See live prices
              </Link>
              <p className="text-xs text-[var(--warm-gray)]">
                Prices via{" "}
                <Link href={crawfishData.priceTracker.sourceLink} target="_blank" rel="noopener noreferrer" className="underline">
                  The Crawfish App
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {upcomingEvents.length > 0 ? (
        <section className="mx-auto mt-10 max-w-6xl px-4">
          <h2 className="text-3xl text-[var(--cajun-red)]">Upcoming Crawfish Events</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {upcomingEvents.map((event) => (
              <article
                key={event.name}
                className={`rounded-2xl border p-5 shadow-sm ${event.featured ? "border-[var(--bayou-gold)] bg-[#FFF8F0]" : "border-[var(--warm-gray)]/20 bg-white"}`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--cajun-red)]">{event.featured ? "This Friday" : "Coming Up"}</p>
                <h3 className="mt-1 text-2xl">{event.name}</h3>
                <p className="mt-2 text-sm text-[var(--warm-gray)]">{new Date(event.date).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })} • {event.time}</p>
                <p className="mt-1 text-sm text-[var(--warm-gray)]">{event.location}</p>
                <p className="mt-2 font-semibold text-[var(--cast-iron)]">{event.price}</p>
                <p className="mt-2 text-sm text-[var(--warm-gray)]">{event.description}</p>
                {event.notes.length > 0 ? <ul className="mt-2 list-inside list-disc text-sm text-[var(--warm-gray)]">{event.notes.map((note) => <li key={note}>{note}</li>)}</ul> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-10 max-w-6xl px-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 className="text-3xl text-[var(--cajun-red)]">Where to Get Crawfish</h2>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="w-full overflow-x-auto pb-2 scrollbar-hide md:w-auto">
              <div className="flex min-w-max flex-nowrap gap-2">
                {(["All", "Lafayette", "Broussard", "Youngsville", "Breaux Bridge", "Other"] as CityFilter[]).map((city) => (
                  <button
                    key={city}
                    onClick={() => setCityFilter(city)}
                    className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${cityFilter === city ? "bg-[var(--cajun-red)] text-white" : "border border-[var(--warm-gray)]/20 bg-white text-[var(--cast-iron)]"}`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-full overflow-x-auto pb-2 scrollbar-hide md:w-auto">
              <div className="flex min-w-max flex-nowrap gap-2">
                {(["Best Price", "Near Me", "Drive-Thru", "Dine-In"] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => setSortBy(option)}
                    className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${sortBy === option ? "bg-[var(--bayou-gold)] text-[var(--cast-iron)]" : "border border-[var(--warm-gray)]/20 bg-white text-[var(--cast-iron)]"}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {visibleSpots.map((spot: Spot) => (
            <article key={`${spot.name}-${spot.address}`} className="rounded-2xl border border-[var(--warm-gray)]/15 bg-white p-5 shadow-sm">
              <h3 className="text-2xl text-[var(--cajun-red)]">
                {spot.website ? (
                  <Link href={spot.website} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                    {spot.name}
                  </Link>
                ) : (
                  spot.name
                )}
              </h3>
              <p className="mt-1 text-sm text-[var(--warm-gray)]">{spot.address}, {spot.city}</p>
              <p className="mt-1 text-sm text-[var(--warm-gray)]">{spot.hours}</p>
              <p className="mt-3 rounded-lg bg-[#FFF8F0] px-3 py-2 text-sm font-semibold text-[var(--cast-iron)]">{spot.priceSummary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {spot.tags.map((tag) => (
                  <span key={`${spot.name}-${tag}`} className="rounded-full bg-[var(--cream-bg)] px-3 py-1 text-xs font-semibold text-[var(--cajun-red)]">
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-sm text-[var(--warm-gray)]">{spot.description}</p>
            </article>
          ))}
        </div>
      </section>

      {extraSpots.length > 0 ? (
        <section className="mx-auto mt-10 max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-3xl text-[var(--cajun-red)]">More Crawfish Spots</h2>
            <p className="text-sm text-[var(--warm-gray)]">Additional listings from The Crawfish App</p>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {extraSpots.map((spot) => (
              <article key={`${spot.name}-${spot.address}`} className="rounded-2xl border border-[var(--warm-gray)]/15 bg-white p-5 shadow-sm">
                <h3 className="text-xl text-[var(--cajun-red)]">{spot.name}</h3>
                <p className="mt-1 text-sm text-[var(--warm-gray)]">{spot.address}, {spot.city}</p>
                <p className="mt-1 text-sm text-[var(--warm-gray)]">{spot.hours}</p>
                <p className="mt-3 rounded-lg bg-[#FFF8F0] px-3 py-2 text-sm font-semibold text-[var(--cast-iron)]">{spot.priceSummary}</p>
                {spot.phone ? <p className="mt-2 text-sm text-[var(--warm-gray)]">Phone: {spot.phone}</p> : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-3xl text-[var(--cajun-red)]">Crawfish Season 101</h2>
          <button
            type="button"
            onClick={() => setShowTipsMobile((v) => !v)}
            className="inline-flex min-h-11 items-center rounded-[10px] border border-[var(--warm-gray)]/25 bg-white px-3 text-sm font-semibold md:hidden"
            aria-expanded={showTipsMobile}
            aria-controls="crawfish-tips"
          >
            {showTipsMobile ? "Hide tips" : "Show tips"}
          </button>
        </div>
        <div id="crawfish-tips" className={`mt-4 space-y-3 ${showTipsMobile ? "block" : "hidden"} md:block`}>
          <details className="rounded-xl border border-[var(--warm-gray)]/20 bg-white p-4">
            <summary className="cursor-pointer font-semibold">When is peak season?</summary>
            <p className="mt-2 text-sm text-[var(--warm-gray)]">Peak season is March through May, when farm production is highest and pricing is usually best.</p>
          </details>
          <details className="rounded-xl border border-[var(--warm-gray)]/20 bg-white p-4">
            <summary className="cursor-pointer font-semibold">How much should I pay?</summary>
            <p className="mt-2 text-sm text-[var(--warm-gray)]">January often starts around $9-13/lb. Late March is currently $5.49-$8.99/lb boiled, with April/May often delivering the best value.</p>
          </details>
          <details className="rounded-xl border border-[var(--warm-gray)]/20 bg-white p-4">
            <summary className="cursor-pointer font-semibold">How to tell good crawfish?</summary>
            <p className="mt-2 text-sm text-[var(--warm-gray)]">Avoid crawfish with straight tails after boiling — it usually means they died before the boil. Fresh boil = better flavor and safety.</p>
          </details>
          <details className="rounded-xl border border-[var(--warm-gray)]/20 bg-white p-4">
            <summary className="cursor-pointer font-semibold">How much should I buy per person?</summary>
            <p className="mt-2 text-sm text-[var(--warm-gray)]">Plan on roughly 3-5 lbs per person for a full crawfish meal.</p>
          </details>
          <details className="rounded-xl border border-[var(--warm-gray)]/20 bg-white p-4">
            <summary className="cursor-pointer font-semibold">Best time to go?</summary>
            <p className="mt-2 text-sm text-[var(--warm-gray)]">Most places start boiling around 4-5pm. Weekdays usually have shorter waits. For lunch, always call ahead first.</p>
          </details>
          <details className="rounded-xl border border-[var(--warm-gray)]/20 bg-white p-4">
            <summary className="cursor-pointer font-semibold">Season outlook for 2026</summary>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[var(--warm-gray)]">
              {crawfishData.seasonOutlook.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </details>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-6xl px-4">
        <FaqSection
          title="Crawfish Season FAQ"
          items={[
            { question: "When is crawfish season?", answer: "Crawfish season usually runs from late winter through early summer, with March through May often considered peak season in Acadiana." },
            { question: "Where to find cheapest crawfish in Lafayette?", answer: "Check the GeauxFind crawfish tracker regularly — it highlights current price ranges and local boil spots around Lafayette and nearby cities." },
            { question: "What's the best time to buy crawfish?", answer: "You’ll usually get better pricing during peak spring production and by shopping weekday boils before weekend demand spikes." },
          ]}
        />
        <div className="rounded-3xl border border-[var(--bayou-gold)]/30 bg-[var(--cream-bg)] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cajun-red)]">Weekly Crawfish Intel</p>
          <h3 className="mt-2 text-3xl">Get weekly crawfish price updates</h3>
          <p className="mt-2 text-[var(--warm-gray)]">From market trends to the best boil spots, we&apos;ll send the freshest finds every Friday.</p>
        </div>
        <div className="mt-4">
          <NewsletterSignup />
        </div>
      </section>
    </main>
  );
}
