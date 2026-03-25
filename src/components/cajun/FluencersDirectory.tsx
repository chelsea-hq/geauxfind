"use client";

import { useMemo, useState } from "react";
import { FluencerCard } from "@/components/cajun/FluencerCard";
import { type CajunFluencer } from "@/lib/cajun-connection";

const platforms = ["all", "facebook", "instagram", "tiktok", "youtube"] as const;

export function FluencersDirectory({ influencers }: { influencers: CajunFluencer[] }) {
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("all");
  const [specialty, setSpecialty] = useState("all");

  const specialties = useMemo(() => ["all", ...Array.from(new Set(influencers.map((f) => f.specialty)))], [influencers]);

  const filtered = useMemo(() => {
    return influencers.filter((f) => {
      const platformMatch = platform === "all" || Boolean(f.socials[platform]);
      const specialtyMatch = specialty === "all" || f.specialty === specialty;
      return platformMatch && specialtyMatch;
    });
  }, [influencers, platform, specialty]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:grid-cols-2">
        <select value={platform} onChange={(e) => setPlatform(e.target.value as (typeof platforms)[number])} className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3">
          {platforms.map((p) => <option key={p} value={p}>{p === "all" ? "All platforms" : p}</option>)}
        </select>
        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="min-h-11 rounded-[10px] border border-[var(--spanish-moss)]/30 px-3">
          {specialties.map((s) => <option key={s}>{s === "all" ? "All specialties" : s}</option>)}
        </select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((fluencer) => <FluencerCard key={fluencer.slug} fluencer={fluencer} />)}
      </div>
    </div>
  );
}
