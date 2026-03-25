import type { Metadata } from "next";
import { WeekendBrunchDirectory } from "@/components/brunch/WeekendBrunchDirectory";
import data from "../../../data/weekend-brunch.json";

export const metadata: Metadata = {
  title: "Weekend Brunch in Acadiana | GeauxFind",
  description:
    "The best Saturday and Sunday brunch spots in Lafayette, Broussard, Youngsville, and across Acadiana — from bottomless mimosas to Cajun Benedict.",
};

export default function WeekendBrunchPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🥂</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Weekend Brunch</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">
          Saturday and Sunday brunch across Acadiana — mimosas, Cajun classics, and good vibes.
        </p>
      </div>

      {/* Disclaimer banner */}
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">☀️</span>
        <p>
          <strong>Heads up:</strong> {data.disclaimer}
        </p>
      </div>

      <WeekendBrunchDirectory spots={data.spots} lastUpdated={data.lastUpdated} />
    </main>
  );
}
