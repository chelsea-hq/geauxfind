"use client";

import dynamic from "next/dynamic";
import type { Place } from "@/types";

const InteractiveMap = dynamic(() => import("./InteractiveMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[350px] place-items-center rounded-2xl border border-dashed border-[var(--spanish-moss)]/30 bg-[var(--cream-bg)] md:h-[420px]">
      <p className="text-sm text-[var(--warm-gray)]">🗺️ Loading map…</p>
    </div>
  ),
});

export function MapWrapper({ places, className }: { places: Place[]; className?: string }) {
  return <InteractiveMap places={places} className={className} />;
}
