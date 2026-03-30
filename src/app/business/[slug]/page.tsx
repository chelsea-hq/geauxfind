import Link from "next/link";

export default function BusinessDashboardPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-16">
      <div className="rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-8">
        <h1 className="text-3xl text-[var(--cajun-red)] md:text-4xl">Business Dashboard — Coming Soon</h1>
        <p className="mt-3 text-[var(--warm-gray)]">
          Claim your business to get notified when analytics go live.
        </p>
        <Link href="/claim" className="mt-5 inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 font-semibold text-white">
          Claim Your Business
        </Link>
      </div>
    </main>
  );
}
