import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Event } from "@/types";

export function EventCard({ event }: { event: Event }) {
  return (
    <Link
      href={`/event/${event.slug}`}
      className="group overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="h-48 overflow-hidden">
        <img src={event.image} alt={event.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-serif text-xl">{event.name}</h3>
        <p className="inline-flex items-center text-sm text-[var(--warm-gray)]">
          <CalendarDays className="mr-1 h-4 w-4" />
          {event.date} · {event.time}
        </p>
        <p className="text-sm text-[var(--warm-gray)]">
          {event.venue}, {event.city}
        </p>
      </div>
    </Link>
  );
}
