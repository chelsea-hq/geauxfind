import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { guidesByCategory } from "@/lib/guides-data";

const DAYS = ["saturday", "sunday"] as const;
type Day = (typeof DAYS)[number];

export function generateStaticParams() {
  return DAYS.map((day) => ({ day }));
}

export async function generateMetadata({ params }: { params: Promise<{ day: string }> }): Promise<Metadata> {
  const { day } = await params;
  if (!DAYS.includes(day as Day)) {
    return buildMetadata({
      title: "Weekend Brunch by Day | GeauxFind",
      description: "Saturday and Sunday brunch in Acadiana.",
      path: `/weekend-brunch/${day}`,
    });
  }
  const pretty = day.charAt(0).toUpperCase() + day.slice(1);
  return buildMetadata({
    title: `${pretty} Brunch in Lafayette & Acadiana — Best Spots | GeauxFind`,
    description: `The best ${pretty} brunch in Lafayette, Breaux Bridge, Youngsville, and Broussard — Cajun Benedict, bottomless mimosas, and locally loved spots.`,
    path: `/weekend-brunch/${day}`,
  });
}

export default async function BrunchDayPage({ params }: { params: Promise<{ day: string }> }) {
  const { day } = await params;
  if (!DAYS.includes(day as Day)) return notFound();
  const pretty = day.charAt(0).toUpperCase() + day.slice(1);
  const all = await guidesByCategory("weekend-brunch");
  const spots = all.filter((s) => s.tags?.includes(pretty));

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${pretty} Brunch in Acadiana`,
    itemListElement: spots.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: s.name,
    })),
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10">
      <JsonLd data={itemList} />
      <nav aria-label="Days" className="flex gap-2 text-sm">
        {DAYS.map((d) => (
          <Link
            key={d}
            href={`/weekend-brunch/${d}`}
            className={`rounded-full border px-3 py-1 capitalize transition ${
              d === day
                ? "border-[var(--cajun-red)] bg-[var(--cajun-red)] text-white"
                : "border-[var(--warm-gray)]/25 bg-white text-[var(--cast-iron)]"
            }`}
            aria-current={d === day ? "page" : undefined}
          >
            {d} brunch
          </Link>
        ))}
      </nav>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🥂</span>
          <h1 className="text-4xl text-[var(--cajun-red)] text-pretty">{pretty} Brunch in Acadiana</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">
          The best {pretty} brunch across Lafayette and Acadiana — Cajun Benedict, bottomless mimosas, patio sunshine, and community favorites.
        </p>
      </div>

      {spots.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-[var(--warm-gray)]/30 bg-white/60 p-4 text-sm text-[var(--warm-gray)]">
          No {pretty} brunch spots on file yet.
        </p>
      ) : (
        <ul className="grid gap-3">
          {spots.map((s) => (
            <li key={s.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold text-[var(--cast-iron)]">{s.name}</h2>
                <p className="text-sm text-[var(--warm-gray)]">
                  {s.city}{s.meta?.hours ? ` • ${s.meta.hours}` : ""}
                </p>
              </div>
              <p className="mt-1 text-sm text-[var(--cast-iron)]/85">{s.description}</p>
              {s.priceRange ? <p className="mt-1 text-sm text-[var(--warm-gray)]">{s.priceRange}</p> : null}
              {s.website ? (
                <a
                  href={s.website}
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
        Want the full picture? <Link href="/weekend-brunch" className="underline">All weekend brunch spots</Link>.
      </p>
    </main>
  );
}
