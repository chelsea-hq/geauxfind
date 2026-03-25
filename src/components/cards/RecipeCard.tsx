import Image from "next/image";
import Link from "next/link";
import { Recipe } from "@/types";

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <article className="card-lift overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm">
      <Link href={`/recipe/${recipe.slug}`} className="block">
        <div className="card-image-zoom relative aspect-[16/10] w-full">
          <Image src={recipe.image || "/placeholder.svg"} alt={recipe.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="text-xl">{recipe.title}</h3>
            <p className="mt-1 text-xs text-white/80">{recipe.difficulty} • {recipe.prepTime} prep • {recipe.cookTime} cook</p>
            <span className="mt-3 inline-flex min-h-11 items-center rounded-[10px] bg-white/95 px-3 py-2 text-sm font-semibold text-[var(--cast-iron)]">View Recipe</span>
          </div>
        </div>
      </Link>
    </article>
  );
}
