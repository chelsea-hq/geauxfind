import { notFound } from "next/navigation";
import { EventCard } from "@/components/cards/EventCard";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { events } from "@/data/mock-data";

export async function generateStaticParams() {
  return events.map((e) => ({ slug: e.slug }));
}

export default async function EventDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = events.find((e) => e.slug === slug);
  if (!event) return notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
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
        <MapPlaceholder />
      </div>
      <h2 className="mb-4 mt-10 font-serif text-2xl">Related Events</h2>
      <div className="grid gap-4 md:grid-cols-2">{events.filter((e) => e.slug !== slug).slice(0, 4).map((e) => <EventCard key={e.slug} event={e} />)}</div>
    </main>
  );
}
