import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Coming Soon | GeauxFind",
  description: "This GeauxFind feature is coming soon. Stay tuned, cher.",
  path: "/coming-soon",
});

export default function ComingSoonPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-5xl text-[var(--cajun-red)]">Coming Soon ⚜️</h1>
      <p className="mt-4 text-[var(--warm-gray)]">This feature is simmering like a good gumbo. Check back real soon, cher.</p>
    </main>
  );
}
