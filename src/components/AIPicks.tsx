"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Pick = {
  slug: string;
  name: string;
  city: string;
  category: string;
  image: string;
  rating: number;
  why: string;
};

export function AIPicks() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [vibe, setVibe] = useState("Fresh local picks");

  useEffect(() => {
    fetch("/api/ai-picks", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        setPicks(Array.isArray(data?.picks) ? data.picks : []);
        setVibe(data?.vibe || "Fresh local picks");
      })
      .catch(() => setPicks([]));
  }, []);

  return (
    <section className="mx-auto mt-16 max-w-6xl px-4">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-[var(--cajun-red)]">🤖 AI Picks For You</h2>
          <p className="text-sm text-[var(--warm-gray)]">{vibe}</p>
        </div>
      </div>

      <div className="-mx-1 flex snap-x gap-4 overflow-x-auto px-1 pb-2">
        {picks.map((pick) => (
          <article key={pick.slug} className="w-[86%] shrink-0 snap-start overflow-hidden rounded-2xl border bg-white shadow-sm sm:w-[340px]">
            <Link href={`/place/${pick.slug}`} className="block">
              <div className="relative h-44 w-full bg-[var(--cream-bg)]">
                <Image
                  src={pick.image || "/placeholder.svg"}
                  alt={pick.name}
                  fill
                  sizes="(max-width: 640px) 86vw, 340px"
                  className="object-cover"
                />
              </div>
              <div className="space-y-2 p-4">
                <h3 className="font-serif text-xl">{pick.name}</h3>
                <p className="text-sm text-[var(--warm-gray)]">{pick.city} · {pick.category} · ⭐ {pick.rating.toFixed(1)}</p>
                <p className="text-sm text-[var(--cast-iron)]/85">{pick.why}</p>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
