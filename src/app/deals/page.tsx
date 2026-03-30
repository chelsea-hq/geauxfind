import Link from "next/link";
import { readJsonFile } from "@/lib/community-data";
import { buildMetadata } from "@/lib/seo";
import { DealSubmitForm } from "./DealSubmitForm";
import { DealGrid } from "./DealGrid";

export const metadata = buildMetadata({
  title: "Deals & Offers in Acadiana | GeauxFind",
  description:
    "Community-sourced deals, happy hours, and daily specials from Acadiana restaurants and local businesses.",
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

interface Partner {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  logo?: string;
  valueProp: string;
  category: string;
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
  featuredPartners: Partner[];
  categories: string[];
  communityDeals: CommunityDeal[];
}

function getCurrentSeasonContext() {
  const month = new Date().getMonth() + 1;
  if (month >= 2 && month <= 5) return "Crawfish season is rolling — catch these local favorites while they're hot.";
  if (month >= 9 && month <= 11) return "Festival season in Acadiana means more reasons to eat local and save.";
  if (month >= 6 && month <= 8) return "Summer specials are out — perfect time for cool drinks and patio bites.";
  return "Winter comfort-food season is here — warm up with local specials and neighborhood favorites.";
}

export default async function DealsPage() {
  const data = await readJsonFile<DealsFile>("deals.json", {
    dealOfTheDay: null as unknown as DealOfTheDay,
    featuredPartners: [],
    categories: [],
    communityDeals: [],
  });

  const approvedDeals = data.communityDeals.filter((deal) => deal.status === "approved");
  const happyHourDeals = approvedDeals
    .filter((deal) => deal.category === "Happy Hour")
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 4);
  const seasonalDeals = approvedDeals
    .filter((deal) => deal.category === "Seasonal")
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 4);

  const partner = data.featuredPartners.find((p) => p.name.toLowerCase().includes("parish tins"));

  return (
    <main className="pb-16">
      <section className="bg-[linear-gradient(135deg,#8B1A1A,#bf5a24)] px-4 py-14 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 inline-flex rounded-full bg-white/20 px-4 py-1 text-sm font-semibold">Community-Powered Savings</p>
          <h1 className="text-4xl md:text-6xl">Acadiana&apos;s Best Deals — Found by Locals</h1>
          <p className="mt-3 text-lg text-white/90 md:text-2xl">
            Happy hours, daily specials, and neighborhood finds from Lafayette and across Acadiana.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cajun-red)]">What&apos;s Good Right Now</p>
          <h2 className="mt-2 text-3xl font-bold text-[var(--cast-iron)] md:text-4xl">Most-loved local deals this week</h2>
          <p className="mt-2 text-[var(--warm-gray)]">Sorted by community upvotes so the best deals rise to the top.</p>
          <div className="mt-6">
            <DealGrid deals={approvedDeals} categories={data.categories} />
          </div>
        </section>

        <section className="mt-14 rounded-2xl border border-[var(--spanish-moss)]/30 bg-[var(--cream)]/40 p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-[var(--cast-iron)] md:text-3xl">🍺 Happy Hour Guide</h2>
              <p className="mt-1 text-sm text-[var(--warm-gray)]">
                Best after-work and early-evening picks around town. Most spots run 3–6 PM on weekdays.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {happyHourDeals.map((deal) => (
              <article key={deal.id} className="rounded-xl bg-white p-4 shadow-sm">
                <p className="font-bold text-[var(--cast-iron)]">{deal.restaurant}</p>
                <p className="mt-1 text-sm text-[var(--cast-iron)]">{deal.deal}</p>
                <p className="mt-2 text-xs text-[var(--warm-gray)]">🔥 {deal.upvotes} local upvotes</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--sunset-gold)]/40 bg-[#FFFBF0] p-6 md:p-8">
          <h2 className="text-2xl font-bold text-[var(--cast-iron)] md:text-3xl">Seasonal Picks</h2>
          <p className="mt-1 text-sm text-[var(--warm-gray)]">{getCurrentSeasonContext()}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {seasonalDeals.map((deal) => (
              <article key={deal.id} className="rounded-xl border border-[var(--sunset-gold)]/30 bg-white p-4">
                <p className="font-bold text-[var(--cast-iron)]">{deal.restaurant}</p>
                <p className="mt-1 text-sm text-[var(--cast-iron)]">{deal.deal}</p>
                <p className="mt-2 text-xs text-[var(--warm-gray)]">Submitted by {deal.submittedBy || "Anonymous"}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-[var(--spanish-moss)]/30 bg-white p-6 shadow-sm md:p-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cajun-red)]">Submit a Deal</p>
            <h2 className="mt-2 text-3xl font-bold text-[var(--cast-iron)]">Know a deal we&apos;re missing? Share it with Acadiana.</h2>
            <p className="mt-2 text-[var(--warm-gray)]">
              Help neighbors discover great local spots. We review submissions quickly and keep this board fresh.
            </p>
          </div>
          <DealSubmitForm initial={[]} />
        </section>

        {partner ? (
          <section className="mt-12">
            <article className="rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cajun-red)]">Our Partner</p>
              <p className="mt-2 text-lg font-semibold text-[var(--cast-iron)]">
                Parish Tins — $250 in local dining for $25
              </p>
              <p className="mt-1 text-sm text-[var(--warm-gray)]">{partner.tagline}</p>
              <Link
                href={partner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-[var(--cajun-red)] px-5 py-2.5 text-sm font-semibold text-white"
              >
                Visit Parish Tins →
              </Link>
            </article>
          </section>
        ) : null}
      </div>
    </main>
  );
}
