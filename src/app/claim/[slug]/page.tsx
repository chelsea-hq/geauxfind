import Link from "next/link";
import { getPlaceBySlug } from "@/lib/supabase-data";
import { ClaimFlowForm } from "./ClaimFlowForm";

export default async function ClaimFlowPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);

  if (!place) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-8 text-center">
          <h1 className="font-serif text-3xl text-[var(--cajun-red)]">Business not found</h1>
          <p className="mt-2 text-sm text-[var(--warm-gray)]">Try searching your business again from the claim portal.</p>
          <Link href="/claim" className="mt-4 inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white">Back to Claim Search</Link>
        </div>
      </main>
    );
  }

  return <ClaimFlowForm place={place} />;
}
