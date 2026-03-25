import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BusinessCard } from "@/components/cajun/BusinessCard";
import { cajunConnectionData } from "@/lib/cajun-connection";

export async function generateStaticParams() {
  return cajunConnectionData.businesses.map((business) => ({ slug: business.slug }));
}

export default async function BusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = cajunConnectionData.businesses.find((item) => item.slug === slug);
  if (!business) return notFound();

  const related = cajunConnectionData.businesses.filter((item) => item.slug !== business.slug && item.category === business.category).slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-10">
      <div className="relative overflow-hidden rounded-[14px] border border-[var(--spanish-moss)]/30 bg-white">
        <div className="relative h-56"><Image src={business.coverPhoto || "/placeholder.svg"} alt={business.name} fill className="object-cover" /></div>
        <div className="space-y-3 p-5">
          <h1 className="text-4xl text-[var(--cajun-red)]">{business.name}</h1>
          <p>{business.description}</p>
          <div className="flex flex-wrap gap-2">{business.tags.map((tag) => <span key={tag} className="rounded-full bg-[var(--cream)] px-3 py-1 text-sm">{tag}</span>)}</div>
          <h2 className="pt-2 text-2xl">Products & Offerings</h2>
          <ul className="list-disc space-y-1 pl-5">{business.offerings.map((offering) => <li key={offering}>{offering}</li>)}</ul>
          <a href={business.website} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-4 font-semibold text-white">Visit Website</a>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-2xl text-[var(--cajun-red)]">Related Businesses</h3>
          <Link href="/cajun-connection/businesses" className="gf-link text-sm">Back to directory</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{related.map((item) => <BusinessCard key={item.slug} business={item} />)}</div>
      </section>
    </main>
  );
}
