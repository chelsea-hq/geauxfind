import { buildMetadata } from "@/lib/seo";
import data from "../../../data/date-night.json";
import { DateNightDirectory } from "@/components/food-guides/DateNightDirectory";

export const metadata = buildMetadata({
  title: "Date Night Ideas in Lafayette & Acadiana | GeauxFind",
  description: "Curated date-night ideas by vibe: romantic, adventurous, casual, and budget-friendly.",
  path: "/date-night",
});

export default function DateNightPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">❤️</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Date Night</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">Curated Lafayette + Acadiana nights out for every mood and budget.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <DateNightDirectory />
    </main>
  );
}
