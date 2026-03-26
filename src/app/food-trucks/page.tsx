import { buildMetadata } from "@/lib/seo";
import data from "../../../data/food-trucks.json";
import { FoodTrucksDirectory } from "@/components/food-guides/FoodTrucksDirectory";

export const metadata = buildMetadata({
  title: "Food Trucks in Lafayette & Acadiana | GeauxFind",
  description: "Track Acadiana food trucks, cuisine types, and where they usually pop up.",
  path: "/food-trucks",
});

export default function FoodTrucksPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🚚</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Food Trucks</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">A live-ish map of Acadiana&apos;s mobile kitchens and where to catch them.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <FoodTrucksDirectory />
    </main>
  );
}
