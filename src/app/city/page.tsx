import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { CITIES } from "@/lib/cities";

export const metadata = buildMetadata({
  title: "Acadiana City Guides — Lafayette, Breaux Bridge, Scott & more | GeauxFind",
  description:
    "Local guides to every city in Acadiana, Louisiana — food, events, live music, and hidden gems curated for locals and visitors alike.",
  path: "/city",
});

export default function CityIndexPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-10">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--moss)]">Acadiana City Guides</p>
        <h1 className="text-4xl font-serif text-[var(--cajun-red)] text-pretty md:text-5xl">
          Every city in Acadiana
        </h1>
        <p className="max-w-3xl text-[var(--cast-iron)]/90">
          Local guides to the towns that make up Acadiana. Each has its own food scene, music traditions, festivals, and character. Pick a city to see what&apos;s good there.
        </p>
      </header>

      <ul className="grid gap-4 md:grid-cols-2">
        {CITIES.map((city) => (
          <li key={city.slug}>
            <Link
              href={`/city/${city.slug}`}
              className="block rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5 transition hover:border-[var(--cajun-red)]/50 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold text-[var(--cast-iron)]">{city.name}, Louisiana</h2>
              <p className="mt-1 text-sm italic text-[var(--cajun-red)]/80">{city.tagline}</p>
              <p className="mt-2 text-sm text-[var(--cast-iron)]/85">{city.intro.slice(0, 160)}…</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
