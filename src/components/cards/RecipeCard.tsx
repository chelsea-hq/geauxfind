import Link from "next/link";
import { Recipe } from "@/types";
import { RatingStars } from "@/components/RatingStars";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipe/${recipe.slug}`}
      className="group overflow-hidden rounded-2xl border border-[var(--warm-gray)]/20 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="h-48 overflow-hidden">
        <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="font-serif text-xl">{recipe.title}</h3>
        <p className="text-sm text-[var(--warm-gray)]">
          {recipe.prepTime} prep · {recipe.cookTime} cook · {recipe.difficulty}
        </p>
        <RatingStars rating={recipe.rating} />
      </div>
    </Link>
  );
}
