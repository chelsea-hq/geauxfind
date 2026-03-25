import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "About GeauxFind — Acadiana's AI Local Discovery Hub",
  description: "Learn how GeauxFind helps locals and visitors discover the best food, events, and culture across Acadiana.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">About GeauxFind</h1>
      <p className="mt-4 text-[var(--warm-gray)]">
        GeauxFind exists to connect Acadiana through the places, events, recipes, and traditions that make this region feel like home.
      </p>

      <section className="mt-6 rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-6">
        <h2 className="font-serif text-2xl">Our Mission</h2>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">
          We help locals and visitors discover the best of Cajun Country — from hidden plate-lunch gems to festival weekends that bring whole communities together.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-6">
        <h2 className="font-serif text-2xl">How GeauxFind Works</h2>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">
          GeauxFind blends community knowledge with AI guidance. Local reviews, neighborhood tips, and cultural context are paired with smart discovery tools so recommendations feel personal and authentic.
        </p>
        <ul className="mt-3 list-disc pl-5 text-sm text-[var(--warm-gray)]">
          <li>Community voices spotlight what matters right now.</li>
          <li>AI helps organize, personalize, and surface the best options faster.</li>
          <li>Everything stays grounded in local Acadiana culture.</li>
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-6">
        <h2 className="font-serif text-2xl">Built for Home</h2>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">Built with love in Broussard, Louisiana.</p>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">GeauxFind is a CH Tech Ventures project focused on connecting people to the best of Acadiana.</p>
      </section>
    </main>
  );
}
