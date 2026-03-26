import Link from "next/link";
import { readJsonFile } from "@/lib/community-data";
import { buildMetadata } from "@/lib/seo";
import { DealSubmitForm } from "./DealSubmitForm";

export const metadata = buildMetadata({
  title: "Deals & Offers in Acadiana | GeauxFind",
  description: "Local deals, gift cards, and offers from Acadiana restaurants and businesses — including Parish Tins.",
  path: "/deals",
});

interface DealOfTheDay {
  id: string;
  title: string;
  description: string;
  partner: string;
  partnerUrl: string;
  badge: string;
  validThrough: string;
  highlight: string;
}

interface FeaturedPartner {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  valueProp: string;
  category: string;
  featured: boolean;
  highlights: string[];
}

interface CommunityDeal {
  id: string;
  restaurant: string;
  deal: string;
  category: string;
  submittedBy: string;
  upvotes: number;
  createdAt: string;
  status: "approved" | "queued";
}

interface DealsFile {
  dealOfTheDay: DealOfTheDay;
  featuredPartners: FeaturedPartner[];
  categories: string[];
  communityDeals: CommunityDeal[];
}

export default async function DealsPage() {
  const data = await readJsonFile<DealsFile>("deals.json", {
    dealOfTheDay: null as unknown as DealOfTheDay,
    featuredPartners: [],
    categories: [],
    communityDeals: [],
  });

  const approvedDeals = data.communityDeals.filter((d) => d.status === "approved");
  const dotd = data.dealOfTheDay;
  const partners = data.featuredPartners;

  return (
    <main className="pb-16">
      {/* Hero */}
      <section className="bg-[linear-gradient(135deg,#8B1A1A,#bf5a24)] px-4 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">
            Acadiana Deals & Offers
          </p>
          <h1 className="text-4xl md:text-6xl">Save big, eat local.</h1>
          <p className="mt-3 text-lg text-white/90 md:text-2xl">
            Gift cards, happy hours, daily specials, and community finds — all in one place.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Deal of the Day */}
        {dotd ? (
          <section className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cajun-red)]">Deal of the Day</p>
            <div className="mt-3 rounded-3xl border-2 border-[var(--sunset-gold)] bg-[#FFF8F0] p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl">
                  <span className="inline-block rounded-full bg-[var(--sunset-gold)]/30 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[var(--cast-iron)]">
                    {dotd.badge}
                  </span>
                  <h2 className="mt-3 text-2xl font-bold text-[var(--cast-iron)] md:text-3xl">{dotd.title}</h2>
                  <p className="mt-3 text-[var(--warm-gray)]">{dotd.description}</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--cajun-red)]">{dotd.highlight}</p>
                  <p className="mt-2 text-xs text-[var(--warm-gray)]">Valid through {new Date(dotd.validThrough).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
                </div>
                <Link
                  href={dotd.partnerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center rounded-xl bg-[var(--cajun-red)] px-6 py-3 font-semibold text-white"
                >
                  Shop {dotd.partner} →
                </Link>
              </div>
            </div>
          </section>
        ) : null}

        {/* Featured Partners */}
        {partners.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-3xl text-[var(--cajun-red)]">Featured Partners</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-2">
              {partners.map((partner) => (
                <article
                  key={partner.id}
                  className="rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cajun-red)]">{partner.category}</p>
                      <h3 className="mt-1 text-2xl font-bold text-[var(--cast-iron)]">{partner.name}</h3>
                      <p className="mt-1 text-sm font-semibold text-[var(--sunset-gold)]">{partner.tagline}</p>
                    </div>
                    <div className="shrink-0 rounded-xl bg-[var(--cajun-red)]/10 px-4 py-2 text-center">
                      <p className="text-xs text-[var(--warm-gray)]">Value</p>
                      <p className="text-lg font-bold text-[var(--cajun-red)]">{partner.valueProp}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-[var(--warm-gray)]">{partner.description}</p>
                  <ul className="mt-4 space-y-1.5">
                    {partner.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-[var(--cast-iron)]">
                        <span className="text-[var(--sunset-gold)]">✓</span> {h}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={partner.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--cajun-red)] px-5 py-2.5 font-semibold text-white"
                  >
                    Visit {partner.name} →
                  </Link>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* Parish Tins explainer callout */}
        <section className="mt-10 rounded-2xl border border-[var(--sunset-gold)]/40 bg-[#FFFBF0] p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cajun-red)]">How It Works</p>
              <h3 className="mt-2 text-2xl font-bold text-[var(--cast-iron)]">What is a Parish Tin?</h3>
              <p className="mt-3 text-[var(--warm-gray)]">
                Parish Tins are beautiful collectible tins packed with 25 gift card coasters — each one worth $10 at a different
                Acadiana restaurant. You pay $25. You unlock $250 in local dining. It&apos;s that simple.
              </p>
              <p className="mt-2 text-[var(--warm-gray)]">
                Every tin supports local restaurants and helps keep Acadiana&apos;s food culture thriving. Perfect for visitors,
                newcomers to Lafayette, or anyone who loves to eat local.
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 text-center">
              <p className="text-5xl font-bold text-[var(--cajun-red)]">10×</p>
              <p className="text-sm text-[var(--warm-gray)]">your dining value</p>
            </div>
          </div>
        </section>

        {/* Community deal submissions — client component */}
        <DealSubmitForm initial={approvedDeals} />
      </div>
    </main>
  );
}
