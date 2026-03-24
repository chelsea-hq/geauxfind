import { Review } from "@/types";
import { RatingStars } from "./RatingStars";

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="font-semibold">{review.author}</h4>
        <RatingStars rating={review.rating} />
      </div>
      <p className="text-sm text-[var(--warm-gray)]">{review.comment}</p>
    </article>
  );
}
