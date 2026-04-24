import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { guidesByCategory } from "@/lib/guides-data";

export const metadata = buildMetadata({
  title: "Live Music in Lafayette Tonight — Cajun, Zydeco & Blues | GeauxFind",
  description:
    "Which Lafayette venues have live music tonight — Cajun jams, zydeco, blues, and open mic nights. Updated from local venue schedules.",
  path: "/live-music/tonight",
});

export const revalidate = 1800;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function LiveMusicTonightPage() {
  const now = new Date();
  const idx = now.getDay();
  const dayName = DAY_NAMES[idx];
  const venues = (await guidesByCategory("live-music")).filter((v) => {
    if (v.meta?.dayIndex === idx) return true;
    if (v.tags?.includes(dayName)) return true;
    return false;
  });

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Live Music Tonight in Acadiana — ${dayName}`,
    itemListElement: venues.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: v.name,
    })),
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10">
      <JsonLd data={itemList} />
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl" aria-hidden="true">🎵</span>
          <h1 className="text-4xl text-[var(--cajun-red)] text-pretty">Live Music Tonight</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">
          {dayName} nights in Acadiana — Cajun jams, zydeco, blues, karaoke, and songwriter showcases at venues from Lafayette to Breaux Bridge.
        </p>
      </div>

      {venues.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-[var(--warm-gray)]/30 bg-white/60 p-4 text-sm text-[var(--warm-gray)]">
          No {dayName.toLowerCase()} nights on file at our regulars. Many venues book weekend shows last-minute — check{" "}
          <Link href="/live-music" className="underline">the venue list</Link> for social links.
        </p>
      ) : (
        <ul className="grid gap-3">
          {venues.map((v) => (
            <li key={v.slug} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-xl font-semibold text-[var(--cast-iron)]">{v.name}</h2>
                <p className="text-sm text-[var(--warm-gray)]">{v.city}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--cast-iron)]/85">{v.description}</p>
              {v.meta?.hours ? <p className="mt-1 text-xs text-[var(--warm-gray)]">{v.meta.hours}</p> : null}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/live-music" className="rounded-full border border-[var(--spanish-moss)]/40 px-4 py-2 font-semibold text-[var(--cast-iron)]">All venues</Link>
        <Link href="/live-music/this-weekend" className="rounded-full border border-[var(--spanish-moss)]/40 px-4 py-2 font-semibold text-[var(--cast-iron)]">This weekend</Link>
        <Link href="/tonight" className="rounded-full bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">Full tonight guide</Link>
      </div>
    </main>
  );
}
