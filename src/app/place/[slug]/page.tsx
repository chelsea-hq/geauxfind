import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { ReviewCard } from "@/components/ReviewCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { PlaceImage } from "@/components/PlaceImage";
import { places } from "@/data/mock-data";
import { RatingStars } from "@/components/RatingStars";
import { ReviewSummaryCard } from "@/components/ReviewSummaryCard";
import { readJsonFile } from "@/lib/community-data";
import type { BusinessClaim } from "@/types";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return places.map((p) => ({ slug: p.slug }));
}

type PhotoRecord = { id: string; slug: string; url: string; caption?: string; createdAt: string };

export default async function PlaceDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = places.find((p) => p.slug === slug);
  if (!place) return notFound();

  const similar = places.filter((p) => p.slug !== slug && p.category === place.category).slice(0, 2);
  const claims = await readJsonFile<BusinessClaim[]>("business-claims.json", []);
  const verified = claims.some((c) => c.placeSlug === slug);

  const submittedPhotos = (await readJsonFile<PhotoRecord[]>("photo-submissions.json", []))
    .filter((p) => p.slug === slug)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const mainImage = submittedPhotos[0]?.url || place.image;
  const gallery = [...submittedPhotos.map((p) => p.url), ...place.gallery];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="h-80 overflow-hidden rounded-3xl">
        <PlaceImage src={mainImage} alt={place.name} category={place.category} className="h-full w-full object-cover" />
      </div>
      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr,320px]">
        <div>
          <h1 className="font-serif text-4xl text-[var(--cajun-red)]">{place.name} {verified ? <span className="text-xl">✅ Verified</span> : null}</h1>
          <p className="mt-2 text-[var(--warm-gray)]">{place.cuisine} · {place.price} · {place.address}</p>
          <RatingStars rating={place.rating} />
          <div className="mt-6"><MapPlaceholder /></div>
          <ReviewSummaryCard slug={place.slug} />
          <h2 className="mb-3 mt-8 font-serif text-2xl">Community Reviews</h2>
          <div className="space-y-3">{place.reviews.map((r) => <ReviewCard key={r.id} review={r} />)}</div>

          <div className="mt-8 rounded-xl border border-[var(--spanish-moss)]/30 bg-white p-4">
            <h2 className="font-serif text-2xl">Community Photos</h2>
            <p className="mt-1 text-sm text-[var(--warm-gray)]">Real shots from locals, not stock vibes.</p>
            <form action="/api/photos" method="post" encType="multipart/form-data" className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
              <input type="hidden" name="slug" value={slug} />
              <input type="file" name="file" accept="image/*" required className="text-sm" />
              <input type="text" name="caption" placeholder="Optional caption" className="rounded-lg border p-2 text-sm" />
              <button className="rounded-lg bg-[var(--cajun-red)] px-3 py-2 text-sm font-semibold text-white">Add a Photo</button>
            </form>
          </div>

          <h2 className="mb-3 mt-8 font-serif text-2xl">Photo Gallery</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {gallery.length > 0 ? gallery.map((src, idx) => (
              <div key={`${src}-${idx}`} className="h-32 overflow-hidden rounded-xl"><img src={src} alt={`${place.name} gallery ${idx + 1}`} className="h-full w-full object-cover" loading="lazy" /></div>
            )) : <p className="col-span-full text-sm text-[var(--warm-gray)]">No gallery photos yet — be the first to share one.</p>}
          </div>

          <div className="mt-8 rounded-xl border border-dashed border-[var(--spanish-moss)]/40 bg-[var(--cream)] p-4 text-sm">
            Is this your business? <Link href={`/claim?business=${encodeURIComponent(place.name)}`} className="gf-link text-[var(--cajun-red)]">Claim it</Link> and start posting specials.
          </div>
        </div>

        <aside className="rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-5 text-sm">
          <h3 className="font-semibold">Details</h3>
          <p className="mt-2">📞 {place.phone}</p>
          <a className="text-[var(--cajun-red)] underline" href={place.website}>{place.website}</a>
          <ul className="mt-3 space-y-1">{place.hours.map((h) => <li key={h}>{h}</li>)}</ul>
          <Link href={`/business/${place.slug}`} className="mt-4 inline-block rounded-lg border px-3 py-2">Claim This Business</Link>
        </aside>
      </section>

      <h2 className="mb-4 mt-10 font-serif text-2xl">Similar Places</h2>
      <div className="grid gap-4 md:grid-cols-2">{similar.map((p) => <PlaceCard key={p.slug} place={p} />)}</div>
    </main>
  );
}
