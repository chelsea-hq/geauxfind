import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import recsData from "../../../../data/community-recs.json";
import { places } from "@/data/mock-data";
import type { CommunityRecsData } from "@/lib/dump-parser";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";

const data = recsData as CommunityRecsData;

export function generateStaticParams() {
  return (data.topics || []).map((t) => ({ slug: t.slug }));
}

export const revalidate = 3600;

function findTopic(slug: string) {
  return (data.topics || []).find((t) => t.slug === slug) || null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) {
    return buildMetadata({
      title: "Best of Acadiana | GeauxFind",
      description: "Crowd-sourced rankings of Acadiana's best food.",
      path: `/best-of/${slug}`,
    });
  }
  const top = (topic.topBusinesses || []).slice(0, 3).map((b) => b.name).join(", ");
  return buildMetadata({
    title: `${topic.name} — ${top || "Local favorites"} | GeauxFind`,
    description: `${topic.businessCount} contenders, ${topic.totalMentions} community votes. Top picks: ${top || "see the full ranking"}.`,
    path: `/best-of/${slug}`,
    ogTitle: topic.name,
    ogSubtitle: `${topic.totalMentions} votes from local Facebook groups`,
    ogKicker: "GEAUXFIND · COMMUNITY PICKS",
  });
}

export default async function BestOfTopic({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const topic = findTopic(slug);
  if (!topic) return notFound();

  const businesses = (topic.topBusinesses || []).slice(0, 20);

  // Cross-reference community business slugs with the operational `places`
  // dataset for photos + place links. Match exact slug first, then by name.
  const placeBySlug = new Map(places.map((p) => [p.slug, p]));
  const placeByNormName = new Map(places.map((p) => [p.name.toLowerCase().replace(/[^a-z0-9]+/g, ""), p]));

  function lookupPlace(b: { slug: string; name: string }) {
    const exact = placeBySlug.get(b.slug);
    if (exact) return exact;
    const normName = b.name.toLowerCase().replace(/[^a-z0-9]+/g, "");
    return placeByNormName.get(normName) || null;
  }

  const ranked = businesses.map((b) => ({ ...b, place: lookupPlace(b) }));
  const matched = ranked.filter((r) => r.place).length;

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: topic.name,
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: ranked.length,
    itemListElement: ranked.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: r.name,
      url: r.place ? `https://geauxfind.vercel.app/place/${r.place.slug}` : undefined,
    })),
  };

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <JsonLd data={itemListLd} />

      <nav aria-label="Breadcrumb" className="text-xs text-[var(--warm-gray)]">
        <Link href="/best-of" className="hover:text-[var(--cajun-red)]">
          ← Back to all community picks
        </Link>
      </nav>

      <header className="mt-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cajun-red)]">
          Community picks · {topic.category}
        </p>
        <h1 className="font-serif text-4xl text-[var(--cajun-red)] md:text-5xl">{topic.name}</h1>
        <p className="text-[var(--warm-gray)]">
          <span className="font-semibold text-[var(--cast-iron)] tabular-nums">{topic.totalMentions}</span>{" "}
          mentions across {topic.businessCount} businesses
          {matched > 0 ? <> · {matched} linked to detail pages</> : null}
        </p>
      </header>

      <ol className="mt-8 grid gap-3">
        {ranked.map((r, i) => {
          const isWinner = i === 0;
          const placeHref = r.place ? `/place/${r.place.slug}` : null;
          const photo = r.place?.image || null;

          const inner = (
            <article
              className={`flex items-start gap-4 rounded-2xl border bg-white p-4 transition-colors ${
                isWinner
                  ? "border-[var(--cajun-red)]/50 shadow-sm"
                  : "border-[var(--spanish-moss)]/30 hover:border-[var(--cajun-red)]/40"
              }`}
            >
              <div className="flex w-14 shrink-0 flex-col items-center">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full font-serif text-lg font-bold tabular-nums ${
                    isWinner
                      ? "bg-[var(--cajun-red)] text-white"
                      : "bg-[var(--cream)] text-[var(--cast-iron)]"
                  }`}
                >
                  {i + 1}
                </span>
                {isWinner ? (
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--cajun-red)]">
                    Winner
                  </span>
                ) : null}
              </div>

              {photo ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                  <Image
                    src={photo}
                    alt={r.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : null}

              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold text-[var(--cast-iron)]">{r.name}</h2>
                {r.place ? (
                  <p className="text-xs text-[var(--warm-gray)]">
                    {r.place.city || "Lafayette"}
                    {r.place.cuisine ? ` · ${r.place.cuisine}` : ""}
                  </p>
                ) : null}
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--cream)] px-2.5 py-0.5 text-xs font-semibold text-[var(--cajun-red)] tabular-nums">
                  {r.mentionCount} {r.mentionCount === 1 ? "mention" : "mentions"}
                </p>
              </div>
            </article>
          );

          return (
            <li key={r.slug}>
              {placeHref ? (
                <Link href={placeHref} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ol>

      <section className="mt-10 rounded-2xl border border-[var(--spanish-moss)]/30 bg-[var(--cream)] p-5 text-sm text-[var(--warm-gray)]">
        <h3 className="font-semibold text-[var(--cast-iron)]">How these rankings work</h3>
        <p className="mt-2">
          We capture full Facebook threads asking about <strong>{topic.category.toLowerCase()}</strong> in
          Acadiana, parse out the business names mentioned, dedupe aliases (so &ldquo;{ranked[0]?.name || "a place"}&rdquo;
          and &ldquo;{(ranked[0]?.name || "a place").split(" ")[0]}&rdquo; count as one vote), and rank by
          how many distinct people recommended each spot. No paid placements, no algorithmic guessing —
          just the names that keep coming up.
        </p>
      </section>
    </main>
  );
}
