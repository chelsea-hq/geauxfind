import { events, weekendHighlights } from "@/data/mock-data";
import { EventCard } from "@/components/cards/EventCard";

export default function ThisWeekend() {
  const grouped = events.reduce<Record<string, typeof events>>((acc, event) => {
    const day = new Date(`${event.date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric"
    });
    if (!acc[day]) acc[day] = [];
    acc[day].push(event);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">This Weekend in Acadiana</h1>
      <p className="mt-3 max-w-3xl text-[var(--warm-gray)]">{weekendHighlights.intro}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-4">
          <h2 className="font-semibold">Weather Outlook</h2>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">{weekendHighlights.weather}</p>
          <p className="mt-2 text-xs text-[var(--warm-gray)]/80">Forecast placeholder — live weather integration coming soon.</p>
        </div>
        <div className="rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-4 md:col-span-2">
          <h2 className="font-semibold">Food Specials</h2>
          <ul className="mt-2 list-disc pl-5 text-sm text-[var(--warm-gray)]">
            {weekendHighlights.foodSpecials.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className="mb-4 mt-8 font-serif text-2xl">Weekend Roundup by Day</h2>
      <div className="space-y-8">
        {Object.entries(grouped).map(([day, dayEvents]) => (
          <section key={day}>
            <h3 className="mb-3 inline-flex rounded-full bg-[var(--bayou-gold)]/20 px-4 py-1 font-semibold text-[var(--cast-iron)]">{day}</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dayEvents.map((e) => (
                <EventCard key={e.slug} event={e} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <h2 className="mb-2 mt-8 font-serif text-2xl">Music Listings</h2>
      <ul className="list-disc pl-5 text-sm text-[var(--warm-gray)]">
        {weekendHighlights.music.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </main>
  );
}
