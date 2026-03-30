import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Event } from "@/types";

function getMonthDay(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return { month: "UP", day: "—" };
  return {
    month: parsed.toLocaleString("en-US", { month: "short" }).toUpperCase(),
    day: String(parsed.getDate()),
  };
}

export function EventCard({ event }: { event: Event }) {
  const { month, day } = getMonthDay(event.date);

  return (
    <article className="card-lift overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm">
      <Link href={`/event/${event.slug}`} className="block">
        <div className="card-image-zoom relative aspect-[16/10] w-full bg-[var(--cream-bg)]">
          <Image
            src={event.image || "/placeholder.svg"}
            alt={event.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      </Link>
      <div className="space-y-3 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex h-14 w-14 flex-col items-center justify-center rounded-[10px] border border-[var(--sunset-gold)]/50 bg-[var(--cream)] text-[var(--cast-iron)]">
            <span className="text-[10px] tracking-[0.1em] text-[var(--warm-gray)]">{month}</span>
            <span className="text-lg leading-none">{day}</span>
          </div>
          <div>
            <Link href={`/event/${event.slug}`} className="text-xl leading-tight hover:text-[var(--cajun-red)]">{event.title}</Link>
            <p className="mt-1 text-sm text-[var(--warm-gray)]">{event.time} {event.price ? `· ${event.price}` : event.free ? "· Free" : ""}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="inline-flex items-center rounded-[10px] bg-[var(--cream)] px-2 py-1 text-xs text-[var(--cast-iron)]"><MapPin className="mr-1 h-3.5 w-3.5" />{event.venue}, {event.city}</p>
          <span className="rounded-full bg-[var(--spanish-moss)]/20 px-2 py-1 text-[10px] uppercase tracking-wide text-[var(--warm-gray)]">{event.source}</span>
        </div>
      </div>
    </article>
  );
}
