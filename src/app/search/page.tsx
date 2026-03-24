import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { RecipeCard } from "@/components/cards/RecipeCard";
import { events, places, recipes } from "@/data/mock-data";

export default function SearchPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="rounded-2xl bg-[var(--cast-iron)] p-6 text-white"><h1 className="font-serif text-3xl">AI Answer (Preview)</h1><p className="mt-2 text-white/80">If you&apos;re craving authentic Cajun this weekend: try Don&apos;s Seafood for gumbo, catch Randol&apos;s for live music, and save crawfish étouffée for Sunday supper.</p></div>
      <section className="mt-8"><h2 className="mb-4 font-serif text-2xl">Places</h2><div className="grid gap-4 md:grid-cols-2">{places.map((p)=><PlaceCard key={p.slug} place={p}/>)}</div></section>
      <section className="mt-8"><h2 className="mb-4 font-serif text-2xl">Events</h2><div className="grid gap-4 md:grid-cols-2">{events.map((e)=><EventCard key={e.slug} event={e}/>)}</div></section>
      <section className="mt-8"><h2 className="mb-4 font-serif text-2xl">Recipes</h2><div className="grid gap-4 md:grid-cols-2">{recipes.map((r)=><RecipeCard key={r.slug} recipe={r}/>)}</div></section>
    </main>
  );
}
