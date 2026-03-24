import { Star } from "lucide-react";

export function RatingStars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <div className="flex items-center gap-1" aria-label={`Rating ${rating} out of 5`}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < full ? "fill-[var(--bayou-gold)] text-[var(--bayou-gold)]" : "text-zinc-300"}`} />
      ))}
      <span className="ml-1 text-sm text-[var(--warm-gray)]">{rating.toFixed(1)}</span>
    </div>
  );
}
