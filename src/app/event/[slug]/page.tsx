import { notFound } from "next/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { MapWrapper } from "@/components/MapWrapper";
import { events, places } from "@/data/mock-data";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { RelatedLinks } from "@/components/RelatedLinks";

export async function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const event = events.find((e) => e.slug === slug);
  if (!event) return buildMetadata({ title: "Event | GeauxFind", description: "Discover events in Acadiana.", path: `/event/${slug}` });
  return buildMetadata({
    title: `${event.title} — ${event.date} at ${event.venue} | GeauxFind`,
    description: event.description,
    path: `/event/${event.slug}`,
  });
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = events.find((e) => e.slug === slug);
  if (!event) return notFound();

  const eventSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.date,
    endDate: event.endDate || event.date,
    location: {
      "@type": "Place",
      name: event.venue,
      address: event.address || `${event.city}, Louisiana`,
    },
    description: event.description,
    image: event.image || undefined,
    url: `https://geauxfind.vercel.app/event/${event.slug}`,
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <JsonLd data={eventSchema} />
      <div className="h-80 overflow-hidden rounded-3xl">
        <img src={event.image || "/placeholder.svg"} alt={event.title} className="h-full w-full object-cover" />
      </div>
      <h1 className="mt-6 font-serif text-4xl text-[var(--cajun-red)]">{event.title}</h1>
      <p className="text-lg font-semibold">
        {event.date} · {event.time}
      </p>
      <p className="mt-3 text-[var(--warm-gray)]">{event.description}</p>
      <p className="mt-2">
        📍 {event.venue}, {event.city} · 🎟️ {event.price || (event.free ? "Free" : "See listing")}
      </p>
      {event.link ? <a href={event.link} className="mt-4 inline-block rounded-full bg-[var(--cajun-red)] px-5 py-2 text-white">
        Event Details
      </a> : null}
      <div className="mt-6">
        <MapWrapper places={[{ slug: event.slug, name: event.venue, category: "events", city: event.city, rating: 0, price: "$", address: event.address || "", phone: "", website: "", hours: [], description: "", image: "", gallery: [], tags: [], reviews: [] }]} />
      </div>
      <h2 className="mb-4 mt-10 font-serif text-2xl">Related Events</h2>
      <div className="grid gap-4 md:grid-cols-2">{events.filter((e) => e.slug !== slug).slice(0, 4).map((e) => <EventCard key={e.slug} event={e} />)}</div>

      <RelatedLinks
        links={[
          ...events.filter((e) => e.slug !== slug && e.city === event.city).slice(0, 3).map((e) => ({ href: `/event/${e.slug}`, label: e.title, description: `${e.city} • ${e.date}` })),
          ...places.filter((p) => p.city === event.city).slice(0, 3).map((p) => ({ href: `/place/${p.slug}`, label: p.name, description: `${p.category} in ${p.city}` })),
        ]}
      />
    </main>
  );
}
