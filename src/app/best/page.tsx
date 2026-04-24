import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { DISHES } from "@/lib/dishes";

export const metadata = buildMetadata({
  title: "Best Of Acadiana — Boudin, Gumbo, Po-Boys & More | GeauxFind",
  description:
    "Dish-by-dish guides to the best of Acadiana — where to find the boudin, gumbo, crawfish étouffée, beignets, king cake, and cracklins locals actually eat.",
  path: "/best",
});

export default function BestIndexPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--moss)]">Dish Guides</p>
        <h1 className="text-4xl font-serif text-[var(--cajun-red)] text-pretty md:text-5xl">
          Best Of Acadiana
        </h1>
        <p className="max-w-3xl text-[var(--cast-iron)]/90">
          The dishes that travelers come to Louisiana for and locals argue about. Each guide ranks restaurants from our directory using name, tag, and cuisine signals, plus editorial context on what the dish actually is.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {DISHES.map((dish) => (
          <li key={dish.slug}>
            <Link
              href={`/best/${dish.slug}`}
              className="block rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5 transition hover:border-[var(--cajun-red)]/50 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-[var(--cast-iron)]">Best {dish.dish} in Lafayette</h2>
              <p className="mt-1 text-sm italic text-[var(--cajun-red)]/80">{dish.tagline}</p>
              <p className="mt-2 text-sm text-[var(--cast-iron)]/85">{dish.intro.slice(0, 160)}…</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
