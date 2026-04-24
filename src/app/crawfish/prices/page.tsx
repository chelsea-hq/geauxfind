import Link from "next/link";
import { buildMetadata, SITE_URL } from "@/lib/seo";
import { JsonLd } from "@/components/JsonLd";
import FreshnessBadge from "@/components/FreshnessBadge";
import { RelatedLinks } from "@/components/RelatedLinks";
import { getFileUpdatedAt, formatAbsolute } from "@/lib/freshness";
import { filterOperational } from "@/lib/place-status";
import pricesData from "../../../../data/crawfish-prices.json";

type Vendor = {
  name: string;
  address: string;
  city: string;
  boiledPricePerLb: number | null;
  boiledPriceText: string;
  livePricePerLb: number | null;
  livePriceText: string;
  boiledSize: string | null;
  liveSize: string | null;
  rating?: number;
  phone?: string | null;
  updatedAt?: string | null;
};

export const metadata = buildMetadata({
  title: "Crawfish Prices in Lafayette & Acadiana — Live This Week | GeauxFind",
  description:
    "Live boiled and live crawfish prices from 60+ Acadiana vendors across Lafayette, Breaux Bridge, Abbeville, Scott, and more. Updated from the Crawfish App feed several times a day.",
  path: "/crawfish/prices",
});

export const revalidate = 1800;

function stats(vendors: Vendor[]) {
  const boiled = vendors.map((v) => v.boiledPricePerLb).filter((p): p is number => typeof p === "number" && p > 0);
  const live = vendors.map((v) => v.livePricePerLb).filter((p): p is number => typeof p === "number" && p > 0);
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
  const sortedBoiled = [...boiled].sort((a, b) => a - b);
  const sortedLive = [...live].sort((a, b) => a - b);
  return {
    boiled: {
      low: sortedBoiled[0] ?? null,
      high: sortedBoiled.at(-1) ?? null,
      avg: avg(boiled),
      count: boiled.length,
    },
    live: {
      low: sortedLive[0] ?? null,
      high: sortedLive.at(-1) ?? null,
      avg: avg(live),
      count: live.length,
    },
  };
}

function fmt(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toFixed(2)}`;
}

export default function CrawfishPricesPage() {
  const vendors: Vendor[] = filterOperational((pricesData.vendors || []) as Vendor[]);
  const s = stats(vendors);
  const updated = getFileUpdatedAt("crawfish-prices.json") ?? new Date();
  const updatedIso = updated.toISOString();
  const dateLabel = formatAbsolute(updated);
  const byCity = vendors.reduce<Record<string, Vendor[]>>((acc, v) => {
    (acc[v.city] ??= []).push(v);
    return acc;
  }, {});
  const topCities = Object.entries(byCity)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 8);

  const bestDeals = [...vendors]
    .filter((v) => typeof v.boiledPricePerLb === "number" && v.boiledPricePerLb > 0)
    .sort((a, b) => (a.boiledPricePerLb ?? 99) - (b.boiledPricePerLb ?? 99))
    .slice(0, 10);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Crawfish Prices in Acadiana — Week of ${dateLabel}`,
    description: `Live boiled and live crawfish prices from ${s.boiled.count} Acadiana vendors. Average boiled: ${fmt(s.boiled.avg)}/lb, low: ${fmt(s.boiled.low)}/lb.`,
    datePublished: updatedIso,
    dateModified: updatedIso,
    author: { "@type": "Organization", name: "GeauxFind", url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: "GeauxFind",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/og-image.png` },
    },
    mainEntityOfPage: `${SITE_URL}/crawfish/prices`,
    articleSection: "Crawfish Season",
  };

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 pb-16 pt-10">
      <JsonLd data={articleSchema} />

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--moss)]">Weekly price index</p>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-4xl font-serif text-[var(--cajun-red)] text-pretty">
            Crawfish Prices in Acadiana
          </h1>
          <FreshnessBadge file="crawfish-prices.json" label="Live feed" />
        </div>
        <p className="text-[var(--cast-iron)]/90">
          Live boiled and live crawfish pricing from {vendors.length} vendors across Lafayette, Breaux Bridge, Abbeville, Scott, and beyond — pulled from{" "}
          <a className="underline" href={pricesData.sourceLink} target="_blank" rel="noopener noreferrer">
            {pricesData.source}
          </a>
          . This page re-generates every 30 minutes.
        </p>
      </header>

      <section className="grid gap-4 rounded-[16px] border border-[var(--spanish-moss)]/30 bg-white p-5 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold text-[var(--cast-iron)]">Boiled crawfish</h2>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-[10px] bg-[var(--cream-bg)] p-3">
              <dt className="text-xs text-[var(--warm-gray)]">Low</dt>
              <dd className="text-lg font-semibold tabular-nums">{fmt(s.boiled.low)}</dd>
            </div>
            <div className="rounded-[10px] bg-[var(--cream-bg)] p-3">
              <dt className="text-xs text-[var(--warm-gray)]">Avg</dt>
              <dd className="text-lg font-semibold tabular-nums">{fmt(s.boiled.avg)}</dd>
            </div>
            <div className="rounded-[10px] bg-[var(--cream-bg)] p-3">
              <dt className="text-xs text-[var(--warm-gray)]">High</dt>
              <dd className="text-lg font-semibold tabular-nums">{fmt(s.boiled.high)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-[var(--warm-gray)]">Based on {s.boiled.count} vendors reporting.</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[var(--cast-iron)]">Live crawfish</h2>
          <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-[10px] bg-[var(--cream-bg)] p-3">
              <dt className="text-xs text-[var(--warm-gray)]">Low</dt>
              <dd className="text-lg font-semibold tabular-nums">{fmt(s.live.low)}</dd>
            </div>
            <div className="rounded-[10px] bg-[var(--cream-bg)] p-3">
              <dt className="text-xs text-[var(--warm-gray)]">Avg</dt>
              <dd className="text-lg font-semibold tabular-nums">{fmt(s.live.avg)}</dd>
            </div>
            <div className="rounded-[10px] bg-[var(--cream-bg)] p-3">
              <dt className="text-xs text-[var(--warm-gray)]">High</dt>
              <dd className="text-lg font-semibold tabular-nums">{fmt(s.live.high)}</dd>
            </div>
          </dl>
          <p className="mt-2 text-xs text-[var(--warm-gray)]">Based on {s.live.count} vendors reporting.</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-[var(--cajun-red)]">Best boiled prices today</h2>
        <div className="overflow-x-auto rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white">
          <table className="min-w-full divide-y divide-[var(--spanish-moss)]/20 text-sm">
            <thead className="bg-[var(--cream-bg)] text-left">
              <tr>
                <th className="px-3 py-2 font-semibold">Vendor</th>
                <th className="px-3 py-2 font-semibold">City</th>
                <th className="px-3 py-2 font-semibold text-right">Boiled</th>
                <th className="px-3 py-2 font-semibold text-right">Live</th>
                <th className="px-3 py-2 font-semibold">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--spanish-moss)]/15">
              {bestDeals.map((v) => (
                <tr key={`${v.name}-${v.city}`}>
                  <td className="px-3 py-2 font-medium text-[var(--cast-iron)]">{v.name}</td>
                  <td className="px-3 py-2 text-[var(--warm-gray)]">{v.city}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(v.boiledPricePerLb)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{fmt(v.livePricePerLb)}</td>
                  <td className="px-3 py-2 text-[var(--warm-gray)]">{v.phone ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-[var(--cajun-red)]">By city</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {topCities.map(([city, list]) => {
            const prices = list.map((v) => v.boiledPricePerLb).filter((p): p is number => typeof p === "number" && p > 0);
            const low = prices.length ? Math.min(...prices) : null;
            const avg = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : null;
            return (
              <div key={city} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
                <h3 className="font-semibold text-[var(--cast-iron)]">{city}</h3>
                <p className="text-sm text-[var(--warm-gray)]">
                  {list.length} vendor{list.length === 1 ? "" : "s"} • boiled low {fmt(low)} / avg {fmt(avg)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-[12px] border border-dashed border-[var(--spanish-moss)]/40 bg-white p-5">
        <h2 className="text-xl text-[var(--cajun-red)]">Why these prices move</h2>
        <p className="mt-2 text-sm text-[var(--cast-iron)]/90">
          Crawfish season in Louisiana typically runs January through June. Prices are highest early-season (January–March), lowest mid-season (April–May), and start climbing again as the season winds down. Weather, water temperature, and fuel costs all drive weekly swings. For live updates between publications, check the individual vendor on our <Link href="/crawfish" className="underline">main crawfish guide</Link>.
        </p>
      </section>

      <RelatedLinks
        title="More Acadiana crawfish guides"
        links={[
          { href: "/crawfish", label: "Crawfish Season Hub", description: "Boils, festivals, and spot finder" },
          { href: "/best/crawfish-etouffee-lafayette", label: "Best Crawfish Étouffée", description: "Restaurants that smother it best" },
          { href: "/events?q=crawfish", label: "Upcoming Crawfish Events", description: "Cook-offs + boils + festivals" },
          { href: "/tonight", label: "Tonight in Acadiana", description: "Today's full guide" },
        ]}
      />
    </main>
  );
}
