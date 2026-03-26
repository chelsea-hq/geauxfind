import { buildMetadata } from "@/lib/seo";
import data from "../../../data/outdoor.json";
import { OutdoorDirectory } from "@/components/food-guides/OutdoorDirectory";

export const metadata = buildMetadata({
  title: "Outdoor Adventures in Acadiana | GeauxFind",
  description: "Swamp tours, trails, kayaking, fishing, and nature parks across Acadiana.",
  path: "/outdoor",
});

export default function OutdoorPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🌿</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Outdoor Adventures</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">Explore bayous, trails, parks, and family-friendly outdoor experiences.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <OutdoorDirectory />
    </main>
  );
}
