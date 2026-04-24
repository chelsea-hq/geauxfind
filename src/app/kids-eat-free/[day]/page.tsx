import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { guidesByCategory } from "@/lib/guides-data";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
type Day = (typeof DAYS)[number];

const DAY_INDEX: Record<Day, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

export function generateStaticParams() {
  return DAYS.map((day) => ({ day }));
}

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }): Promise<Metadata> {
  const { day } = await params;
  if (!DAYS.includes(day as Day)) {
    return buildMetadata({
      title: "Kids Eat Free by Day | GeauxFind",
      description: "Browse Acadiana kids-eat-free deals by day of the week.",
      path: `/kids-eat-free/${day}`,
    });
  }
  const pretty = day.charAt(0).toUpperCase() + day.slice(1);
  return buildMetadata({
    title: `Kids Eat Free ${pretty} in Lafayette & Acadiana | GeauxFind`,
    description: `Every Acadiana restaurant where kids eat free or cheap on ${pretty}s — with offers, hours, and age limits.`,
    path: `/kids-eat-free/${day}`,
  });
}

export default async function KidsDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  if (!DAYS.includes(day as Day)) return notFound();
  const idx = DAY_INDEX[day as Day];
  const pretty = day.charAt(0).toUpperCase() + day.slice(1);
  const all = await guidesByCategory("kids-eat-free");
  const deals = all.filter((d) => d.meta?.dayIndex === idx || d.tags?.includes(pretty));

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Kids Eat Free on ${pretty} in Acadiana`,
    itemListElement: deals.map((d, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${d.name} — ${d.description ?? ""}`.trim(),
    })),
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10">
      <JsonLd data={itemList} />
      <nav aria-label="Days" className="flex flex-wrap gap-2 text-sm">
        {DAYS.map((d) => (
          <Link
            key={d}
            href={`/kids-eat-free/${d}`}
            className={`rounded-full border px-3 py-1 capitalize transition ${
              d === day
                ? "border-[var(--cajun-red)] bg-[var(--cajun-red)] text-white"
                : "border-[var(--warm-gray)]/25 bg-white text-[var(--cast-iron)]"
            }`}
            aria-current={d === day ? "page" : undefined}
          >
            {d}
          </Link>
        ))}
      </nav>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🍽️</span>
          <h1 className="text-4xl text-[var(--cajun-red)] text-pretty">Kids Eat Free — {pretty}</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">
          Every restaurant in Lafayette, Broussard, Youngsville, and Acadiana with a kids-eat-free or cheap-kids-meal deal on {pretty}s.
        </p>
      </div>

      {deals.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-[var(--warm-gray)]/30 bg-white/60 p-4 text-sm text-[var(--warm-gray)]">
          No {pretty} deals on file yet. Know one we&apos;re missing? <Link href="/community" className="underline">Submit a tip</Link>.
        </p>
      ) : (
        <ul className="grid gap-3">
          {deals.map((d) => (
            <li key={d.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold text-[var(--cast-iron)]">{d.name}</h2>
                <p className="text-sm text-[var(--warm-gray)]">
                  {d.city}{d.meta?.hours ? ` • ${d.meta.hours}` : ""}
                </p>
              </div>
              <p className="mt-2 text-[var(--cast-iron)]/90">{d.description}</p>
              {d.meta?.ageLimit ? (
                <p className="mt-1 text-sm text-[var(--warm-gray)]">
                  Age: {String(d.meta.ageLimit)}
                  {d.meta?.dineInOnly ? " • Dine-in only" : ""}
                </p>
              ) : null}
              {d.meta?.notes ? <p className="mt-1 text-xs text-[var(--warm-gray)]">{String(d.meta.notes)}</p> : null}
              {d.website ? (
                <a
                  href={d.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-[var(--cajun-red)] underline"
                >
                  Restaurant site
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-[var(--warm-gray)]">
        Always call ahead to confirm — deals change often. Source:{" "}
        <Link href="/kids-eat-free" className="underline">Full Acadiana kids-eat-free guide</Link>.
      </p>
    </main>
  );
}
