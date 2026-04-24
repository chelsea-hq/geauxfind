import Link from "next/link";
import { promises as fs } from "node:fs";
import path from "node:path";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import FreshnessBadge from "@/components/FreshnessBadge";
import { JsonLd } from "@/components/JsonLd";

export const metadata = buildMetadata({
  title: "Tonight in Lafayette — Live Music, Events & Kids Eat Free | GeauxFind",
  description:
    "What's happening in Lafayette and Acadiana tonight: live music venues, kids-eat-free deals, and things to do today. Updated every few hours.",
  path: "/tonight",
  ogTitle: "Tonight in Lafayette",
  ogSubtitle: "Live music, kids-eat-free, and tonight's best across Acadiana.",
  ogKicker: "GEAUXFIND · TONIGHT",
});

export const revalidate = 1800;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type GuideEntry = {
  name: string;
  slug: string;
  category: string;
  description?: string;
  city?: string;
  website?: string;
  meta?: Record<string, unknown> & {
    day?: string;
    dayIndex?: number;
    hours?: string;
    genre?: string;
    offer?: string;
    age_limit?: string;
    ageLimit?: string;
  };
  tags?: string[];
};

async function loadGuides(): Promise<GuideEntry[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "guides.json"), "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? (data as GuideEntry[]) : Object.values(data as Record<string, GuideEntry>);
  } catch {
    return [];
  }
}

export default async function TonightPage() {
  const now = new Date();
  const dayIndex = now.getDay();
  const dayName = DAY_NAMES[dayIndex];
  const guides = await loadGuides();

  // Pick entries whose tags include today's name OR whose meta.dayIndex matches
  const matchesToday = (g: GuideEntry): boolean => {
    if (g.meta?.dayIndex === dayIndex) return true;
    if (g.tags?.includes(dayName)) return true;
    return false;
  };

  const liveMusic = guides.filter((g) => g.category === "live-music" && matchesToday(g));
  const kidsDeals = guides.filter((g) => g.category === "kids-eat-free" && matchesToday(g));

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(now);

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `Tonight in Lafayette — ${formattedDate}`,
          url: `${SITE_URL}/tonight`,
          description: "Live music, events, and kids-eat-free deals in Acadiana tonight.",
        }}
      />

      <section className="rounded-[16px] bg-[linear-gradient(130deg,#0e2a2a,#1f4a47)] px-6 py-8 text-white">
        <p className="text-xs tracking-[0.25em] text-[var(--sunset-gold)]">TONIGHT</p>
        <h1 className="mt-2 text-4xl md:text-5xl text-pretty">
          {dayName} in Acadiana — <span className="text-[var(--sunset-gold)]">{formattedDate}</span>
        </h1>
        <p className="mt-3 max-w-2xl text-white/85">
          Your one-page snapshot of what&apos;s happening tonight across Lafayette, Broussard, Youngsville, and the rest of
          Cajun Country. Live music, kids&apos; deals, all in one place.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <FreshnessBadge file="guides.json" label="Guides" className="!bg-white/10 !text-white !ring-white/25" />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-3xl text-[var(--cajun-red)] text-pretty">🎶 Live Music Tonight</h2>
          <Link href="/live-music" className="gf-link text-sm">All venues</Link>
        </div>
        {liveMusic.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--warm-gray)]/30 bg-white/60 p-4 text-sm text-[var(--warm-gray)]">
            Nothing confirmed at our regulars for {dayName.toLowerCase()} night. Many venues add weekend shows last-minute — check
            <Link href="/live-music" className="underline"> the venue list</Link> for social links.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {liveMusic.map((v) => (
              <article key={v.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
                <h3 className="text-xl font-semibold text-[var(--cast-iron)]">{v.name}</h3>
                <p className="mt-1 text-sm text-[var(--warm-gray)]">{v.city}</p>
                <p className="mt-3 text-sm text-[var(--cast-iron)]/90">{v.description}</p>
                {v.meta?.hours ? <p className="mt-1 text-xs text-[var(--warm-gray)]">{v.meta.hours}</p> : null}
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="text-3xl text-[var(--cajun-red)] text-pretty">🍽️ Kids Eat Free Tonight</h2>
          <Link href="/kids-eat-free" className="gf-link text-sm">Full weekly list</Link>
        </div>
        {kidsDeals.length === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--warm-gray)]/30 bg-white/60 p-4 text-sm text-[var(--warm-gray)]">
            No kids-eat-free deals on file for {dayName.toLowerCase()}. Browse the{" "}
            <Link href="/kids-eat-free" className="underline">weekly schedule</Link> by day.
          </p>
        ) : (
          <ul className="grid gap-3 md:grid-cols-2">
            {kidsDeals.map((deal) => (
              <li key={deal.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
                <p className="text-sm text-[var(--warm-gray)]">{deal.city}{deal.meta?.hours ? ` • ${deal.meta.hours}` : ""}</p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--cast-iron)]">{deal.name}</h3>
                <p className="mt-1 text-sm text-[var(--cast-iron)]/85">{deal.description}</p>
                {deal.meta?.notes ? <p className="mt-1 text-xs text-[var(--warm-gray)]">{String(deal.meta.notes)}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
        <h2 className="text-2xl text-[var(--cajun-red)]">Want more?</h2>
        <p className="mt-1 text-sm text-[var(--cast-iron)]/85">
          Jump into the full weekend plan, latest openings, or ask our AI guide for a night-out itinerary.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/this-weekend" className="rounded-full bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">This weekend</Link>
          <Link href="/whats-new" className="rounded-full border border-[var(--spanish-moss)]/40 px-4 py-2 font-semibold text-[var(--cast-iron)]">What&apos;s new</Link>
          <Link href="/ask" className="rounded-full border border-[var(--spanish-moss)]/40 px-4 py-2 font-semibold text-[var(--cast-iron)]">Ask Geaux</Link>
        </div>
      </section>
    </main>
  );
}
