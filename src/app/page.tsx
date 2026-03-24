import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { CategoryNav } from "@/components/CategoryNav";
import { EventCard } from "@/components/cards/EventCard";
import { PlaceCard } from "@/components/cards/PlaceCard";
import { events, places } from "@/data/mock-data";

export default function Home() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GeauxFind",
    url: "https://geauxfind.vercel.app",
    description: "AI-curated local discovery hub for Acadiana, Louisiana"
  };

  const bestOfAcadiana = [...places].sort((a, b) => b.rating - a.rating).slice(0, 5);

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="relative overflow-hidden bg-[linear-gradient(120deg,rgba(139,26,26,0.94),rgba(74,124,89,0.8)),url('https://images.unsplash.com/photo-1470337458703-46ad1756a187?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-2 text-sm tracking-[0.2em]">ACADIANA LOCAL DISCOVERY</p>
          <h1 className="font-serif text-5xl">Find your next favorite in Cajun Country</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/90">From crawfish boils to festival weekends, GeauxFind curates the heart of South Louisiana.</p>
          <div className="mt-7">
            <SearchBar />
          </div>
        </div>
      </section>

      <div className="mx-auto my-8 flex max-w-6xl items-center gap-4 px-4" aria-hidden>
        <div className="h-px flex-1 bg-[var(--warm-gray)]/30" />
        <svg viewBox="0 0 64 64" className="h-7 w-7 text-[var(--bayou-gold)]/60" fill="currentColor">
          <path d="M30 4c-2 2-2 6 0 8-5 2-9 6-11 11-3-1-7 0-9 3 2 2 6 2 9 1 0 2 0 4 1 6-3 1-6 5-6 8 3 1 7 0 9-2 3 4 7 8 12 9v8h4v-8c5-1 9-5 12-9 2 2 6 3 9 2 0-3-3-7-6-8 1-2 1-4 1-6 3 1 7 1 9-1-2-3-6-4-9-3-2-5-6-9-11-11 2-2 2-6 0-8h-4z" />
        </svg>
        <div className="h-px flex-1 bg-[var(--warm-gray)]/30" />
      </div>

      <section className="mx-auto max-w-6xl px-4 py-4">
        <h2 className="mb-5 font-serif text-3xl text-[var(--cajun-red)]">Explore by Category</h2>
        <CategoryNav />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-3xl text-[var(--cajun-red)]">This Weekend</h2>
          <Link href="/this-weekend" className="text-sm underline">
            See full roundup
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{events.slice(0, 3).map((e) => <EventCard key={e.slug} event={e} />)}</div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-4 font-serif text-3xl text-[var(--cajun-red)]">Best Of Acadiana</h2>
        <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
          <div className="space-y-3 rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-5">
            {bestOfAcadiana.map((p, index) => (
              <Link
                key={p.slug}
                href={`/place/${p.slug}`}
                className="flex items-center justify-between rounded-xl border border-transparent px-3 py-2 transition hover:border-[var(--bayou-gold)]/40 hover:bg-[var(--cream-bg)]"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--cajun-red)]/10 font-semibold text-[var(--cajun-red)]">#{index + 1}</span>
                  <div>
                    <p className="font-semibold text-[var(--cast-iron)]">{p.name}</p>
                    <p className="text-xs text-[var(--warm-gray)]">
                      {p.city} · {p.cuisine}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-medium text-[var(--bayou-green)]">{p.rating.toFixed(1)}★</span>
              </Link>
            ))}
          </div>
          <PlaceCard place={bestOfAcadiana[0]} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <div className="rounded-3xl bg-[var(--cast-iron)] p-8 text-white">
          <p className="text-sm uppercase tracking-widest text-[var(--bayou-gold)]">Ask Acadiana</p>
          <h3 className="mt-2 font-serif text-3xl">Where can I find live zydeco and late-night boudin?</h3>
          <p className="mt-2 text-white/80">Ask in plain language. AI answers coming soon — community flavor included.</p>
          <Link href="/ask" className="mt-4 inline-block rounded-full bg-[var(--bayou-gold)] px-5 py-2 font-semibold text-[var(--cast-iron)] transition hover:-translate-y-0.5 hover:shadow-lg">
            Try Ask Acadiana
          </Link>
        </div>
      </section>
    </main>
  );
}
