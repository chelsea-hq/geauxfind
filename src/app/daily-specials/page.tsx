import { buildMetadata } from "@/lib/seo";
import data from "../../../data/daily-specials.json";
import { DailySpecialsDirectory } from "@/components/food-guides/DailySpecialsDirectory";

export const metadata = buildMetadata({
  title: "Daily Specials & Plate Lunches in Acadiana | GeauxFind",
  description: "Find lunch specials, plate lunches, and daily food deals across Lafayette and Acadiana.",
  path: "/daily-specials",
});

export default function DailySpecialsPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🍛</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Daily Specials</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">Plate lunch culture is alive and well — track specials by day and meal type.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <DailySpecialsDirectory />
    </main>
  );
}
