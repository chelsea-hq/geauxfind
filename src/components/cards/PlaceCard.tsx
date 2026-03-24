import Link from "next/link";
import { MapPin } from "lucide-react";
import { Place } from "@/types";
import { RatingStars } from "@/components/RatingStars";

export function PlaceCard({ place }: { place: Place }) {
  return (
    <Link
      href={`/place/${place.slug}`}
      className="group overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="h-48 overflow-hidden">
        <img
          src={place.image}
          alt={place.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-serif text-xl text-[var(--cast-iron)]">{place.name}</h3>
        <p className="text-sm text-[var(--warm-gray)]">
          {place.cuisine} · {place.price}
        </p>
        <div className="flex items-center justify-between">
          <RatingStars rating={place.rating} />
          <span className="inline-flex items-center text-xs text-[var(--warm-gray)]">
            <MapPin className="mr-1 h-3.5 w-3.5" />
            {place.city}
          </span>
        </div>
      </div>
    </Link>
  );
}
