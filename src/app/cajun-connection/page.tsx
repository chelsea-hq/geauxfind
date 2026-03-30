import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { BusinessCard } from "@/components/cajun/BusinessCard";
import { FluencerCard } from "@/components/cajun/FluencerCard";
import { cajunCategories, cajunConnectionData } from "@/lib/cajun-connection";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Cajun Connection — Louisiana Businesses & Food Creators | GeauxFind",
  description: "Discover Cajun-owned businesses, local food vendors, and Louisiana creators across Acadiana in one curated directory.",
  path: "/cajun-connection",
  images: ["/og-image.png"],
});

const groups = [
  { name: "Where Acadiana Eats", url: "https://www.facebook.com/" },
  { name: "What Up Acadiana", url: "https://www.facebook.com/" },
  { name: "Foodies of Lafayette", url: "https://www.facebook.com/" },
  { name: "Cajun Cooking on the Bayou", url: "https://www.facebook.com/" },
  { name: "Cajun & Creole Market", url: "https://www.facebook.com/" },
];

export default function CajunConnectionPage() {
  const featuredBusinesses = cajunConnectionData.businesses.filter((b) => b.featured);

  return (
    <main className="mx-auto max-w-6xl space-y-12 px-4 pb-16 pt-10">
      <section className="relative overflow-hidden rounded-[16px] bg-[linear-gradient(130deg,var(--cajun-red),#8f1429)] px-6 py-10 text-white">
        <div className="absolute right-6 top-4 text-6xl opacity-20">⚜</div>
        <p className="text-xs tracking-[0.2em] text-white/70">CAJUN CONNECTION</p>
        <h1 className="mt-3 text-4xl md:text-5xl">Discover Louisiana&apos;s Finest</h1>
        <p className="mt-3 max-w-2xl text-white/85">A curated Acadiana directory for Cajun businesses and featured food creators.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/cajun-connection/submit" className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--sunset-gold)] px-4 font-semibold text-[var(--cast-iron)]">Submit Your Business</Link>
          <Link href="/cajun-connection/submit" className="inline-flex min-h-11 items-center rounded-[10px] border border-white/40 px-4 font-semibold">Become a Featured Fluencer</Link>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-3xl text-[var(--cajun-red)]">Featured Spotlight</h2>
        <div className="grid gap-4 md:grid-cols-2">{featuredBusinesses.map((b) => <BusinessCard key={b.slug} business={b} />)}</div>
      </section>

      <section className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4">
        <h3 className="text-xl">Filter by category</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {cajunCategories.map((category) => <span key={category} className="rounded-full bg-[var(--cream)] px-3 py-1 text-sm">{category}</span>)}
        </div>
        <div className="mt-4 inline-flex min-h-11 items-center rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 text-sm text-[var(--warm-gray)]"><Search className="mr-2 h-4 w-4" />Search businesses on the directory page</div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl text-[var(--cajun-red)]">Cajun Businesses</h2>
          <Link href="/cajun-connection/businesses" className="gf-link text-sm">View all</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cajunConnectionData.businesses.slice(0, 3).map((b) => <BusinessCard key={b.slug} business={b} />)}</div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl text-[var(--cajun-red)]">Cajun Fluencers</h2>
          <Link href="/cajun-connection/fluencers" className="gf-link text-sm">View all</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cajunConnectionData.influencers.map((f) => <FluencerCard key={f.slug} fluencer={f} />)}</div>
      </section>

      <section className="space-y-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
        <h2 className="text-2xl text-[var(--cajun-red)]">Community Groups</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {groups.map((group) => (
            <a key={group.name} href={group.url} target="_blank" rel="noreferrer" className="rounded-[10px] bg-[var(--cream)] px-3 py-2 text-sm hover:text-[var(--cajun-red)]">{group.name}</a>
          ))}
        </div>
      </section>
    </main>
  );
}
