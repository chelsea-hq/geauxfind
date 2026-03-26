import { buildMetadata } from "@/lib/seo";
import data from "../../../data/photo-spots.json";
import { PhotoSpotsDirectory } from "@/components/food-guides/PhotoSpotsDirectory";

export const metadata = buildMetadata({
  title: "Instagram-Worthy Spots in Acadiana | GeauxFind",
  description: "The most photogenic murals, landmarks, and nature scenes across Lafayette and Acadiana.",
  path: "/photo-spots",
});

export default function PhotoSpotsPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">📸</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Instagram-Worthy Spots</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">Your shot list for murals, architecture, bayou scenes, and iconic Acadiana backgrounds.</p>
      </div>
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">⚠️</span>
        <p><strong>Heads up:</strong> {data.disclaimer}</p>
      </div>
      <PhotoSpotsDirectory />
    </main>
  );
}
