import Link from "next/link";
import { events } from "@/data/mock-data";

// Picks a single highest-priority event happening RIGHT NOW (today is between
// startDate and endDate). Used at the top of the home page so the biggest
// thing happening in town gets a hero treatment.

const FESTIVAL_KEYWORDS = /festival international|mardi gras|festival acadiens|festivals acadiens|cinema on the bayou|frog festival|sugar cane festival|crawfish festival/i;

type HappeningEvent = {
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  description: string;
  link?: string | null;
  category?: string;
};

function pickHero(now = new Date()): HappeningEvent | null {
  const todayMs = now.getTime();

  const live = events.filter((e) => {
    const start = new Date(`${e.date}T00:00:00-05:00`).getTime();
    const end = new Date(`${e.endDate || e.date}T23:59:59-05:00`).getTime();
    return Number.isFinite(start) && Number.isFinite(end) && start <= todayMs && todayMs <= end;
  });

  if (!live.length) return null;

  // Prefer big-name festivals
  const flagship = live.find((e) => FESTIVAL_KEYWORDS.test(e.title) || e.category === "festival");
  return (flagship ?? live[0]) as HappeningEvent;
}

function daysLeft(endDate: string, now = new Date()): number {
  const end = new Date(`${endDate}T23:59:59-05:00`).getTime();
  return Math.max(0, Math.ceil((end - now.getTime()) / (24 * 60 * 60 * 1000)));
}

export function HappeningNowBanner() {
  const event = pickHero();
  if (!event) return null;

  const remaining = daysLeft(event.endDate || event.date);
  const isMultiDay = event.endDate && event.endDate !== event.date;

  return (
    <section className="mx-auto mt-6 max-w-6xl px-4 reveal">
      <Link
        href={event.link || `/event/${event.slug}`}
        target={event.link ? "_blank" : undefined}
        rel={event.link ? "noopener noreferrer" : undefined}
        className="block rounded-[16px] bg-[linear-gradient(120deg,#7a1326_0%,#bf1f34_45%,#d46a2a_75%,#e59d39_100%)] p-6 text-white shadow-xl transition-transform hover:-translate-y-0.5 md:p-8"
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-bold tracking-[0.2em] ring-1 ring-white/30">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
                </span>
                HAPPENING NOW
              </span>
              {isMultiDay && remaining > 0 ? (
                <span className="rounded-full bg-black/20 px-3 py-1 text-xs font-semibold">
                  {remaining === 1 ? "Last day" : `${remaining} days left`}
                </span>
              ) : null}
            </div>
            <h2 className="mt-3 font-serif text-3xl leading-tight md:text-4xl">
              {event.title}
            </h2>
            <p className="mt-2 max-w-2xl text-white/90">{event.description}</p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/30">
              See details →
            </span>
          </div>
        </div>
      </Link>
    </section>
  );
}
