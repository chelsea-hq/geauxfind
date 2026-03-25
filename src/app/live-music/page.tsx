import type { Metadata } from "next";
import { LiveMusicDirectory } from "@/components/music/LiveMusicDirectory";
import data from "../../../data/live-music.json";

export const metadata: Metadata = {
  title: "Live Music in Acadiana | GeauxFind",
  description:
    "Find live music venues in Lafayette, Breaux Bridge, Eunice, Opelousas, and across Acadiana — Cajun, zydeco, blues, and more every night of the week.",
};

export default function LiveMusicPage() {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 pb-16 pt-10">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">🎵</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">Live Music</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">
          Cajun, zydeco, blues, and beyond — find live music across Acadiana every night of the week.
        </p>
      </div>

      {/* Disclaimer banner */}
      <div className="flex gap-3 rounded-[12px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        <span className="mt-0.5 shrink-0 text-base">🎶</span>
        <p>
          <strong>Heads up:</strong> {data.disclaimer}
        </p>
      </div>

      <LiveMusicDirectory venues={data.venues} lastUpdated={data.lastUpdated} />
    </main>
  );
}
