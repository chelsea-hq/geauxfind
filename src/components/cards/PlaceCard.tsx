import Image from "next/image";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Place } from "@/types";
import { RatingStars } from "@/components/RatingStars";

const badgeColor: Record<string, string> = {
  food: "bg-[#fbe8d6] text-[#7d3f1f]",
  music: "bg-[#f0e8ff] text-[#4c2a7a]",
  finds: "bg-[#e8f3ea] text-[#1f5f33]",
  events: "bg-[#ffe8ee] text-[#8f1f3c]",
  outdoors: "bg-[#e3f2ec] text-[#1a3a2a]",
  shopping: "bg-[#fff0de] text-[#8a4e14]",
};

const placeholderByCategory: Record<string, string> = {
  food: "/placeholders/food.svg",
  music: "/placeholders/music.svg",
  finds: "/placeholders/finds.svg",
  events: "/placeholders/events.svg",
  outdoors: "/placeholders/outdoors.svg",
  shopping: "/placeholders/shopping.svg",
};

function getImageSrc(place: Place) {
  const image = place.image?.trim();
  const isMissing = !image || image === "/placeholder.svg" || image.endsWith("/placeholder.svg");
  if (isMissing) return placeholderByCategory[place.category] ?? "/placeholders/default.svg";
  return image;
}

export function PlaceCard({ place, featured = false, compact = false }: { place: Place; featured?: boolean; compact?: boolean }) {
  const smart = place.smartTags ?? [];
  const specialTag = smart.find((t) => /late|night/i.test(t)) ? "Late Night" : smart.length > 2 ? "Hidden Gem" : null;

  return (
    <article className="card-lift overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm">
      <Link href={`/place/${place.slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sunset-gold)]">
        <div className={`card-image-zoom relative w-full bg-[var(--cream-bg)] ${featured ? "aspect-[16/9] sm:aspect-[16/10]" : compact ? "aspect-[16/9] sm:aspect-[18/10]" : "aspect-[16/9] sm:aspect-[16/10]"}`}>
          <Image src={getImageSrc(place)} alt={place.name} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
            <span className={`rounded-[10px] px-2 py-1 text-xs font-semibold ${badgeColor[place.category] ?? "bg-stone-100 text-stone-900"}`}>{place.category}</span>
            {specialTag ? <span className="rounded-[10px] bg-black/60 px-2 py-1 text-xs text-white">{specialTag}</span> : null}
          </div>
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/place/${place.slug}`} className="line-clamp-2 text-xl leading-tight hover:text-[var(--cajun-red)]">{place.name}</Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0"><RatingStars rating={place.rating} /></div>
          <span className="shrink-0 text-xs text-[var(--warm-gray)]">{place.reviews?.length ?? 0} reviews</span>
        </div>
        <p className="flex items-center text-sm text-[var(--warm-gray)]"><MapPin className="mr-1 h-4 w-4" />{place.city}</p>
        {!compact ? <p className="line-clamp-2 text-sm text-[var(--cast-iron)]/85">{place.description}</p> : null}
      </div>
    </article>
  );
}
