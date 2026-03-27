import Link from "next/link";

export default function ClaimConfirmationPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <section className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-8 text-center">
        <p className="text-5xl">✅</p>
        <h1 className="mt-3 font-serif text-3xl text-[var(--cajun-red)]">Claim submitted!</h1>
        <p className="mt-3 text-[var(--cast-iron)]">We&apos;ll review your claim within 24 hours and follow up by email.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link href="/claim" className="min-h-11 rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white">Back to Claim Search</Link>
          <Link href="/explore" className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/40 px-4 py-2 text-sm">Keep Exploring</Link>
        </div>
      </section>
    </main>
  );
}
