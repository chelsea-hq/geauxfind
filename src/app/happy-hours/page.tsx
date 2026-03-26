import { buildMetadata } from "@/lib/seo";
import data from "../../../data/happy-hours.json";
import { HappyHoursDirectory } from "@/components/food-guides/HappyHoursDirectory";

export const metadata = buildMetadata({
  title: "Happy Hours in Lafayette & Acadiana | GeauxFind",
  description: "Find happy hour deals across Lafayette, Broussard, Youngsville, Scott, and Breaux Bridge.",
  path: "/happy-hours",
});

export default function HappyHoursPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🍻</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Happy Hours</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">The most complete happy hour lineup in Acadiana — filtered by day and area.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <HappyHoursDirectory />
    </main>
  );
}
