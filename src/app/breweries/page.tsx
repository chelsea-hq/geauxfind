import { buildMetadata } from "@/lib/seo";
import data from "../../../data/breweries.json";
import { BreweriesDirectory } from "@/components/food-guides/BreweriesDirectory";

export const metadata = buildMetadata({
  title: "Brewery & Distillery Trail in Acadiana | GeauxFind",
  description: "Find craft breweries, distilleries, and taprooms across Lafayette and Acadiana.",
  path: "/breweries",
});

export default function BreweriesPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🍺</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Brewery & Distillery Trail</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">Your guide to craft beer, local spirits, and taprooms across Acadiana.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <BreweriesDirectory />
    </main>
  );
}
