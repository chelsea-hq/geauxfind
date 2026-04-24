import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { guidesByCategory } from "@/lib/guides-data";

export const metadata = buildMetadata({
  title: "Live Music This Weekend in Lafayette — Cajun, Zydeco & Blues | GeauxFind",
  description:
    "Every Lafayette and Acadiana venue with weekend live music — Friday, Saturday, and Sunday Cajun, zydeco, blues, and roots.",
  path: "/live-music/this-weekend",
});

export const revalidate = 3600;

const WEEKEND_DAYS = [
  { idx: 5, name: "Friday" },
  { idx: 6, name: "Saturday" },
  { idx: 0, name: "Sunday" },
];

export default async function LiveMusicWeekendPage() {
  const allVenues = await guidesByCategory("live-music");
  const byDay = WEEKEND_DAYS.map((d) => {
    const venues = allVenues.filter((v) => v.meta?.dayIndex === d.idx || v.tags?.includes(d.name));
    return { ...d, venues };
  });

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Live Music This Weekend in Acadiana",
    itemListElement: byDay.flatMap((d) =>
      d.venues.map((v, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: `${d.name}: ${v.name}`,
      })),
    ),
  };

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-4 pb-16 pt-10">
      <JsonLd data={itemList} />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🎶</span>
          <h1 className="text-4xl text-[var(--cajun-red)] text-pretty">Live Music This Weekend</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">
          Weekend music across Lafayette, Breaux Bridge, Eunice, and Opelousas — from Zydeco Breakfast to Saturday night Cajun dance halls.
        </p>
      </div>

      {byDay.map((d) => (
        <section key={d.name}>
          <h2 className="mb-3 text-2xl font-serif text-[var(--cast-iron)]">{d.name}</h2>
          {d.venues.length === 0 ? (
            <p className="text-sm text-[var(--warm-gray)]">No {d.name.toLowerCase()} shows on file yet.</p>
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {d.venues.map((v) => (
                <li key={`${d.idx}-${v.slug}`} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
                  <h3 className="text-lg font-semibold text-[var(--cast-iron)]">{v.name}</h3>
                  <p className="text-sm text-[var(--warm-gray)]">{v.city}</p>
                  <p className="mt-1 text-sm text-[var(--cast-iron)]/85">{v.description}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/live-music" className="rounded-full border border-[var(--spanish-moss)]/40 px-4 py-2 font-semibold text-[var(--cast-iron)]">All venues</Link>
        <Link href="/live-music/tonight" className="rounded-full border border-[var(--spanish-moss)]/40 px-4 py-2 font-semibold text-[var(--cast-iron)]">Tonight</Link>
        <Link href="/this-weekend" className="rounded-full bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">Weekend plan</Link>
      </div>
    </main>
  );
}
