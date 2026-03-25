import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Place } from "@/types";
import { RatingStars } from "@/components/RatingStars";

const badgeColor: Record<string, string> = {
  food: "bg-[#fbe8d6] text-[#7d3f1f]",
  music: "bg-[#e8ecff] text-[#28327a]",
  finds: "bg-[#e8f3ea] text-[#1f5f33]",
};

export function PlaceCard({ place, featured = false, compact = false }: { place: Place; featured?: boolean; compact?: boolean }) {
  const smart = place.smartTags ?? [];
  const specialTag = smart.find((t) => /late|night/i.test(t)) ? "Late Night" : smart.length > 2 ? "Hidden Gem" : null;

  return (
    <article className={`card-lift overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm ${featured ? "h-full" : ""}`}>
      <Link href={`/place/${place.slug}`} className="block">
        <div className={`card-image-zoom relative w-full bg-[var(--cream-bg)] ${featured ? "aspect-[16/10]" : compact ? "aspect-[18/10]" : "aspect-[16/10]"}`}>
          <Image src={place.image || "/placeholder.svg"} alt={place.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <span className={`rounded-[10px] px-2 py-1 text-xs font-semibold ${badgeColor[place.category] ?? "bg-stone-100 text-stone-900"}`}>{place.category}</span>
            {specialTag ? <span className="rounded-[10px] bg-black/60 px-2 py-1 text-xs text-white">{specialTag}</span> : null}
          </div>
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/place/${place.slug}`} className="text-xl leading-tight hover:text-[var(--cajun-red)]">{place.name}</Link>
        </div>
        <div className="flex items-center justify-between">
          <RatingStars rating={place.rating} />
          <span className="text-xs text-[var(--warm-gray)]">{place.reviews?.length ?? 0} reviews</span>
        </div>
        <p className="flex items-center text-sm text-[var(--warm-gray)]"><MapPin className="mr-1 h-4 w-4" />{place.city}</p>
        {!compact ? <p className="line-clamp-2 text-sm text-[var(--cast-iron)]/85">{place.description}</p> : null}
      </div>
    </article>
  );
}
