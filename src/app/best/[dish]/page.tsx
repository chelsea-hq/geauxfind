import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { places } from "@/data/mock-data";
import { DISHES, getDishBySlug } from "@/lib/dishes";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { FaqSection } from "@/components/FaqSection";
import { RelatedLinks } from "@/components/RelatedLinks";

export function generateStaticParams() {
  return DISHES.map((d) => ({ dish: d.slug }));
}

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ dish: string }> }): Promise<Metadata> {
  const { dish } = await params;
  const meta = getDishBySlug(dish);
  if (!meta) {
    return buildMetadata({
      title: "Best of Lafayette | GeauxFind",
      description: "Find the best local dishes in Lafayette, Louisiana.",
      path: `/best/${dish}`,
    });
  }
  return buildMetadata({
    title: `Best ${meta.dish} in Lafayette, Louisiana — Local Favorites | GeauxFind`,
    description: `${meta.intro}`,
    path: `/best/${meta.slug}`,
    ogTitle: `Best ${meta.dish} in Lafayette`,
    ogSubtitle: meta.tagline,
    ogKicker: "GEAUXFIND · DISH GUIDE",
  });
}

function scorePlace(place: { name: string; tags?: string[]; cuisine?: string; smartTags?: string[] }, matchers: NonNullable<(typeof DISHES)[number]["matchers"]>): number {
  let score = 0;
  const name = place.name.toLowerCase();
  const tags = [...(place.tags ?? []), ...(place.smartTags ?? [])].map((t) => t.toLowerCase());
  const cuisine = (place.cuisine || "").toLowerCase();

  for (const kw of matchers.nameKeywords ?? []) {
    if (name.includes(kw.toLowerCase())) score += 5;
  }
  for (const t of matchers.tags ?? []) {
    if (tags.some((x) => x.includes(t.toLowerCase()))) score += 3;
  }
  for (const c of matchers.cuisineKeywords ?? []) {
    if (cuisine.includes(c.toLowerCase())) score += 2;
  }
  return score;
}

export default async function BestDishPage({ params }: { params: Promise<{ dish: string }> }) {
  const { dish } = await params;
  const meta = getDishBySlug(dish);
  if (!meta) return notFound();

  const ranked = places
    .map((p) => ({ p, score: scorePlace(p, meta.matchers) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
    .slice(0, 18);

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Best ${meta.dish} in Lafayette, Louisiana`,
    url: `${SITE_URL}/best/${meta.slug}`,
    itemListElement: ranked.map(({ p }, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Restaurant",
        name: p.name,
        url: `${SITE_URL}/place/${p.slug}`,
        address: {
          "@type": "PostalAddress",
          streetAddress: p.address,
          addressLocality: p.city,
          addressRegion: "LA",
          addressCountry: "US",
        },
      },
    })),
  };

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-10">
      <JsonLd data={itemList} />

      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--moss)]">Dish Guide</p>
        <h1 className="text-4xl font-serif text-[var(--cajun-red)] text-pretty md:text-5xl">
          Best {meta.dish} in Lafayette, Louisiana
        </h1>
        <p className="text-lg italic text-[var(--cast-iron)]/80">{meta.tagline}</p>
        <p className="max-w-3xl text-[var(--cast-iron)]/90">{meta.intro}</p>
      </header>

      {ranked.length > 0 ? (
        <section>
          <h2 className="mb-4 text-2xl text-[var(--cajun-red)]">Top spots for {meta.dish.toLowerCase()}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {ranked.map(({ p }) => (
              <PlaceCard key={p.slug} place={p} />
            ))}
          </div>
        </section>
      ) : (
        <p className="rounded-[12px] border border-dashed border-[var(--warm-gray)]/30 bg-white/60 p-4 text-sm text-[var(--warm-gray)]">
          No matches for {meta.dish.toLowerCase()} yet in our directory — our scrapers pick up new spots every few hours.
        </p>
      )}

      <FaqSection title={`About ${meta.dish.toLowerCase()} in Acadiana`} items={meta.faq} />

      <RelatedLinks
        title="More Acadiana dish guides"
        links={DISHES.filter((d) => d.slug !== meta.slug).map((d) => ({
          href: `/best/${d.slug}`,
          label: `Best ${d.dish} in Lafayette`,
          description: d.tagline,
        }))}
      />

      <p className="text-sm text-[var(--warm-gray)]">
        Know a spot we&apos;re missing? <Link href="/community" className="underline">Submit a tip</Link>.
      </p>
    </main>
  );
}
