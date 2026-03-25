import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@/types";
import { RatingStars } from "@/components/RatingStars";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="overflow-hidden rounded-xl border border-[var(--warm-gray)]/20 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/recipe/${recipe.slug}`} className="block">
        <div className="relative aspect-[16/10] w-full bg-[var(--cream-bg)]">
          <Image src={recipe.image || "/placeholder.svg"} alt={recipe.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
        </div>
      </Link>
      <div className="space-y-2 p-4">
        <Link href={`/recipe/${recipe.slug}`} className="font-serif text-xl hover:text-[var(--cajun-red)]">{recipe.title}</Link>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border bg-amber-50 px-2 py-1">{recipe.difficulty}</span>
          <span>{recipe.prepTime} prep</span>
          <span>{recipe.cookTime} cook</span>
        </div>
        <RatingStars rating={recipe.rating} />
      </div>
    </article>
  );
}
