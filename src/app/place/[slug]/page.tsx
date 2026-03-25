import { notFound } from "next/navigation";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { ReviewCard } from "@/components/ReviewCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { places } from "@/data/mock-data";
import { RatingStars } from "@/components/RatingStars";
import { ReviewSummaryCard } from "@/components/ReviewSummaryCard";

export async function generateStaticParams() {
  return places.map((p) => ({ slug: p.slug }));
}

export default async function PlaceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = places.find((p) => p.slug === slug);
  if (!place) return notFound();
  const similar = places.filter((p) => p.slug !== slug && p.category === place.category).slice(0, 2);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="h-80 overflow-hidden rounded-3xl">
        <img src={place.image} alt={place.name} className="h-full w-full object-cover" />
      </div>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr,320px]">
        <div>
          <h1 className="font-serif text-4xl text-[var(--cajun-red)]">{place.name}</h1>
          <p className="mt-2 text-[var(--warm-gray)]">
            {place.cuisine} · {place.price} · {place.address}
          </p>
          <RatingStars rating={place.rating} />
          <div className="mt-6">
            <MapPlaceholder />
          </div>
          <ReviewSummaryCard slug={place.slug} />
          <h2 className="mb-3 mt-8 font-serif text-2xl">Community Reviews</h2>
          <div className="space-y-3">{place.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}</div>

          <h2 className="mb-3 mt-8 font-serif text-2xl">Photo Gallery</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {place.gallery.length > 0 ? (
              place.gallery.map((src, idx) => (
                <div key={`${src}-${idx}`} className="h-32 overflow-hidden rounded-xl">
                  <img src={src} alt={`${place.name} gallery ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" />
                </div>
              ))
            ) : (
              <p className="col-span-full text-sm text-[var(--warm-gray)]">No gallery photos yet — check back soon.</p>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-5 text-sm">
          <h3 className="font-semibold">Details</h3>
          <p className="mt-2">📞 {place.phone}</p>
          <a className="text-[var(--cajun-red)] underline" href={place.website}>
            {place.website}
          </a>
          <ul className="mt-3 space-y-1">
            {place.hours.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </aside>
      </section>

      <h2 className="mb-4 mt-10 font-serif text-2xl">Similar Places</h2>
      <div className="grid gap-4 md:grid-cols-2">{similar.map((p) => <PlaceCard key={p.slug} place={p} />)}</div>
    </main>
  );
}
