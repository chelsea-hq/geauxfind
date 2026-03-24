import { PlaceCard } from "@/components/cards/PlaceCard";
import { EventCard } from "@/components/cards/EventCard";
import { RecipeCard } from "@/components/cards/RecipeCard";
import { MapPlaceholder } from "@/components/MapPlaceholder";
import { events, places, recipes } from "@/data/mock-data";
import { CategoryType } from "@/types";

export function CategoryPage({ type, title }: { type: CategoryType; title: string }) {
  const content = {
    food: places.filter((p) => p.category === "food"),
    music: places.filter((p) => p.category === "music"),
    finds: places.filter((p) => p.category === "finds"),
    events,
    recipes
  }[type];

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">{title}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[260px,1fr]">
        <aside className="space-y-4 rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-4 text-sm">
          <h2 className="font-semibold">Filter & Sort</h2>
          <p>Cuisine · City · Price · Rating</p>
          <label className="flex items-center gap-2"><input type="checkbox" /> Map view</label>
          <MapPlaceholder />
        </aside>
        <section className="grid gap-4 md:grid-cols-2">
          {type === "events" && events.map((item) => <EventCard key={item.slug} event={item} />)}
          {type === "recipes" && recipes.map((item) => <RecipeCard key={item.slug} recipe={item} />)}
          {(type === "food" || type === "music" || type === "finds") && (content as typeof places).map((item) => <PlaceCard key={item.slug} place={item} />)}
        </section>
      </div>
    </main>
  );
}
