import { notFound } from "next/navigation";
import { recipes } from "@/data/mock-data";
import { RatingStars } from "@/components/RatingStars";
import { RecipeChecklist } from "@/components/RecipeChecklist";
import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import { RelatedLinks } from "@/components/RelatedLinks";
import { places } from "@/data/mock-data";

export async function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const recipe = recipes.find((r) => r.slug === slug);
  if (!recipe) return buildMetadata({ title: "Recipe | GeauxFind", description: "Discover Cajun recipes.", path: `/recipe/${slug}` });
  return buildMetadata({
    title: `${recipe.title} Recipe — Cajun Cooking | GeauxFind`,
    description: `Learn how to make ${recipe.title} with prep tips, ingredients, and step-by-step Cajun cooking instructions.`,
    path: `/recipe/${recipe.slug}`,
  });
}

export default async function RecipeDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const recipe = recipes.find((r) => r.slug === slug);
  if (!recipe) return notFound();

  const recipeSchema = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    recipeYield: `${recipe.servings} servings`,
    recipeIngredient: recipe.ingredients,
    recipeInstructions: recipe.steps,
    image: recipe.image,
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <JsonLd data={recipeSchema} />
      <div className="h-80 overflow-hidden rounded-3xl">
        <img src={recipe.image} alt={recipe.title} className="h-full w-full object-cover" />
      </div>
      <h1 className="mt-6 font-serif text-4xl text-[var(--cajun-red)]">{recipe.title}</h1>
      <div className="mt-2 flex flex-wrap gap-3 text-sm">
        <span>Prep: {recipe.prepTime}</span>
        <span>Cook: {recipe.cookTime}</span>
        <span>Serves: {recipe.servings}</span>
        <span>Difficulty: {recipe.difficulty}</span>
      </div>
      <RatingStars rating={recipe.rating} />
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-5">
          <h2 className="font-serif text-2xl">Ingredients</h2>
          <RecipeChecklist ingredients={recipe.ingredients} />
        </section>
        <section className="rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-5">
          <h2 className="font-serif text-2xl">Steps</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            {recipe.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </section>
      </div>
      <p className="mt-6 text-sm text-[var(--warm-gray)]">Inspired by {recipe.inspiredBy}</p>

      <RelatedLinks
        title="Taste it around town"
        links={places
          .filter((p) => p.category === "food" && (p.cuisine?.toLowerCase().includes("cajun") || p.tags.some((t) => recipe.title.toLowerCase().includes(t.toLowerCase()))))
          .slice(0, 6)
          .map((p) => ({ href: `/place/${p.slug}`, label: p.name, description: `${p.city} • ${p.cuisine || "Local cuisine"}` }))}
      />
    </main>
  );
}
