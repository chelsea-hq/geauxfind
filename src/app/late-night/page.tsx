import { buildMetadata } from "@/lib/seo";
import data from "../../../data/late-night.json";
import { LateNightDirectory } from "@/components/food-guides/LateNightDirectory";

export const metadata = buildMetadata({
  title: "Late Night Eats in Lafayette & Acadiana | GeauxFind",
  description: "Find restaurants and quick bites open past 10 PM across Acadiana.",
  path: "/late-night",
});

export default function LateNightPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌙</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Late Night Eats</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">Your after-10PM food map for Lafayette and nearby Acadiana towns.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <LateNightDirectory />
    </main>
  );
}
