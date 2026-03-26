import { buildMetadata } from "@/lib/seo";
import data from "../../../data/dance-halls.json";
import { DanceHallsDirectory } from "@/components/food-guides/DanceHallsDirectory";

export const metadata = buildMetadata({
  title: "Cajun & Zydeco Dance Halls | GeauxFind",
  description: "Historic and active Cajun and zydeco dance halls across Lafayette and Acadiana.",
  path: "/dance-halls",
});

export default function DanceHallsPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">💃</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Cajun & Zydeco Dance Halls</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">Where to two-step, waltz, and zydeco dance in the heart of Cajun Country.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <DanceHallsDirectory />
    </main>
  );
}
