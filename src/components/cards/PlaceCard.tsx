import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Place } from "@/types";
import { RatingStars } from "@/components/RatingStars";

const badgeColor: Record<string, string> = {
  food: "bg-red-100 text-red-900",
  music: "bg-purple-100 text-purple-900",
  finds: "bg-amber-100 text-amber-900",
};

export function PlaceCard({ place }: { place: Place }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[var(--warm-gray)]/20 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/place/${place.slug}`} className="block">
        <div className="relative aspect-[16/10] w-full bg-[var(--cream-bg)]">
          <Image src={place.image || "/placeholder.svg"} alt={place.name} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-cover" />
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/place/${place.slug}`} className="font-serif text-xl hover:text-[var(--cajun-red)]">{place.name}</Link>
          <span className={`rounded-full px-2 py-1 text-xs ${badgeColor[place.category] ?? "bg-stone-100 text-stone-900"}`}>{place.category}</span>
        </div>
        <div className="flex items-center justify-between">
          <RatingStars rating={place.rating} />
          <span className="text-xs text-[var(--warm-gray)]">{place.reviews?.length ?? 0} reviews</span>
        </div>
        <p className="flex items-center text-sm text-[var(--warm-gray)]"><MapPin className="mr-1 h-4 w-4" />{place.city}</p>
        <p className="line-clamp-1 text-sm text-[var(--cast-iron)]/80">{place.description}</p>
        <div className="flex flex-wrap gap-1">{(place.smartTags ?? []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full border px-2 py-0.5 text-xs">{tag}</span>)}</div>
      </div>
    </article>
  );
}
