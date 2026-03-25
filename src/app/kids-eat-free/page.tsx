import type { Metadata } from "next";
import { KidsEatFreeDirectory } from "@/components/kids/KidsEatFreeDirectory";
import data from "../../../data/kids-eat-free.json";

export const metadata: Metadata = {
  title: "Kids Eat Free in Acadiana | GeauxFind",
  description:
    "Find restaurants in Lafayette, Broussard, Youngsville, and Acadiana where kids eat free or cheap every day of the week.",
};

export default function KidsEatFreePage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🍽️</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Kids Eat Free</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">
          Acadiana restaurants where the little ones eat free (or cheap!) — organized by day of the week.
        </p>
      </div>

      {/* Disclaimer banner */}
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p>
          <strong>Heads up:</strong> {data.disclaimer}
        </p>
      </div>

      <KidsEatFreeDirectory deals={data.deals} lastUpdated={data.lastUpdated} />
    </main>
  );
}
