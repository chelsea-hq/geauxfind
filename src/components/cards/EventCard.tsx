import Image from "next/image";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Event } from "@/types";

export function EventCard({ event }: { event: Event }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[var(--warm-gray)]/20 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/event/${event.slug}`} className="block">
        <div className="relative aspect-[16/10] w-full bg-[var(--cream-bg)]">
          <Image src={event.image || "/placeholder.svg"} alt={event.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link href={`/event/${event.slug}`} className="font-serif text-xl hover:text-[var(--cajun-red)]">{event.name}</Link>
        <p className="inline-flex items-center text-sm text-[var(--warm-gray)]"><CalendarDays className="mr-1 h-4 w-4" />{event.date} · {event.time}</p>
        <p className="text-sm text-[var(--warm-gray)]">{event.venue}, {event.city}</p>
        <span className="inline-block rounded-full border bg-amber-50 px-2 py-1 text-xs">{event.price}</span>
      </div>
    </article>
  );
}
