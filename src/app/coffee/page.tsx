import { buildMetadata } from "@/lib/seo";
import data from "../../../data/coffee-shops.json";
import { CoffeeShopsDirectory } from "@/components/food-guides/CoffeeShopsDirectory";

export const metadata = buildMetadata({
  title: "Coffee Shops in Lafayette & Acadiana | GeauxFind",
  description: "Find local coffee roasters, study spots, and neighborhood cafés around Acadiana.",
  path: "/coffee",
});

export default function CoffeePage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">☕</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Coffee Shops</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">Local roasters and cafés for work sessions, quick stops, and weekend hangs.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <CoffeeShopsDirectory />
    </main>
  );
}
