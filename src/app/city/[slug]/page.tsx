import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { EventCard } from "@/components/cards/EventCard";
import { places, events } from "@/data/mock-data";
import { CITIES, cityNameToSlug, getCityBySlug } from "@/lib/cities";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { RelatedLinks } from "@/components/RelatedLinks";
import FreshnessBadge from "@/components/FreshnessBadge";

export function generateStaticParams() {
  return CITIES.map((c) => ({ slug: c.slug }));
}

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) {
    return buildMetadata({
      title: "Acadiana City | GeauxFind",
      description: "Local discovery for cities across Acadiana, Louisiana.",
      path: `/city/${slug}`,
    });
  }
  return buildMetadata({
    title: `${city.name}, Louisiana — Food, Events & Hidden Gems | GeauxFind`,
    description: `${city.intro} Browse ${city.name}'s best restaurants, events, live music, and kids-eat-free spots — curated by locals.`,
    path: `/city/${city.slug}`,
  });
}

export default async function CityHubPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const city = getCityBySlug(slug);
  if (!city) return notFound();

  const cityPlaces = places.filter((p) => cityNameToSlug(p.city) === slug);
  const topRated = [...cityPlaces].sort((a, b) => b.rating - a.rating).slice(0, 9);
  const food = cityPlaces.filter((p) => p.category === "food").slice(0, 12);
  const music = cityPlaces.filter((p) => p.category === "music").slice(0, 6);
  const finds = cityPlaces.filter((p) => p.category === "finds").slice(0, 6);

  const cityEvents = events
    .filter((e) => cityNameToSlug(e.city || "") === slug)
    .filter((e) => new Date(`${e.endDate || e.date}T23:59:59`).getTime() >= Date.now())
    .slice(0, 6);

  const breadcrumbList = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Cities", item: `${SITE_URL}/city/${city.slug}` },
      { "@type": "ListItem", position: 3, name: city.name, item: `${SITE_URL}/city/${city.slug}` },
    ],
  };

  const placeItemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top places in ${city.name}, Louisiana`,
    itemListElement: topRated.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "LocalBusiness",
        name: p.name,
        url: `${SITE_URL}/place/${p.slug}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: p.address,
          addressLocality: p.city,
          addressRegion: "LA",
          addressCountry: "US",
        },
      },
    })),
  };

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-10">
      <JsonLd data={breadcrumbList} />
      <JsonLd data={placeItemList} />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--moss)]">Acadiana City Guide</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-serif text-[var(--cajun-red)] text-pretty md:text-5xl">
            {city.name}, Louisiana
          </h1>
          <FreshnessBadge file="events.json" label="Events" />
        </div>
        <p className="text-lg italic text-[var(--cast-iron)]/80">{city.tagline}</p>
        <p className="max-w-3xl text-[var(--cast-iron)]/90">{city.intro}</p>
        <p className="rounded-[8px] bg-[var(--cream-bg)] px-3 py-2 text-sm text-[var(--cast-iron)]">
          <strong>Good to know:</strong> {city.fun_fact}
        </p>
      </header>

      {topRated.length > 0 ? (
        <section>
          <h2 className="mb-4 text-3xl text-[var(--cajun-red)]">Top-rated in {city.name}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topRated.map((p) => (
              <PlaceCard key={p.slug} place={p} />
            ))}
          </div>
        </section>
      ) : null}

      {cityEvents.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl text-[var(--cajun-red)]">Upcoming in {city.name}</h2>
            <Link href={`/events?city=${encodeURIComponent(city.name)}`} className="gf-link text-sm">All events</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cityEvents.map((e) => (
              <EventCard key={e.slug} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      {food.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl text-[var(--cajun-red)]">Where to eat</h2>
            <Link href={`/food?city=${encodeURIComponent(city.name)}`} className="gf-link text-sm">All restaurants</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {food.map((p) => (
              <PlaceCard key={p.slug} place={p} />
            ))}
          </div>
        </section>
      ) : null}

      {music.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl text-[var(--cajun-red)]">Live music & venues</h2>
            <Link href={`/music?city=${encodeURIComponent(city.name)}`} className="gf-link text-sm">All venues</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {music.map((p) => (
              <PlaceCard key={p.slug} place={p} />
            ))}
          </div>
        </section>
      ) : null}

      {finds.length > 0 ? (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-3xl text-[var(--cajun-red)]">Finds & hidden gems</h2>
            <Link href={`/finds?city=${encodeURIComponent(city.name)}`} className="gf-link text-sm">All finds</Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {finds.map((p) => (
              <PlaceCard key={p.slug} place={p} />
            ))}
          </div>
        </section>
      ) : null}

      <RelatedLinks
        title={`Other Acadiana cities`}
        links={CITIES.filter((c) => c.slug !== slug)
          .slice(0, 8)
          .map((c) => ({ href: `/city/${c.slug}`, label: c.name, description: c.tagline }))}
      />
    </main>
  );
}
