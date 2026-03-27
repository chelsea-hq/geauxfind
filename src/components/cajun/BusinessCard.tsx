"use client";

import Image from "next/image";
import Link from "next/link";
import { Globe, MapPin } from "lucide-react";
import { useState } from "react";
import type { CajunBusiness } from "@/lib/cajun-connection";

export function BusinessCard({ business }: { business: CajunBusiness }) {
  const [imgSrc, setImgSrc] = useState(business.coverPhoto || business.logo || "/placeholder.svg");
  return (
    <article className="card-lift overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-[var(--cream)]">
        <Image src={imgSrc} alt={business.name} fill className="object-contain p-2" onError={() => setImgSrc("/placeholder.svg")} />
        <div className="absolute left-3 top-3 rounded-full bg-[var(--cajun-red)] px-3 py-1 text-xs font-semibold text-white">{business.category}</div>
      </div>
      <div className="space-y-3 p-4">
        <Link href={`/cajun-connection/businesses/${business.slug}`} className="text-xl leading-tight hover:text-[var(--cajun-red)]">{business.name}</Link>
        <p className="line-clamp-2 text-sm text-[var(--cast-iron)]/80">{business.shortDescription}</p>
        <p className="flex items-center text-sm text-[var(--warm-gray)]"><MapPin className="mr-1 h-4 w-4" />{business.location}</p>
        <div className="flex flex-wrap gap-2">
          {business.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-full bg-[var(--cream)] px-2 py-1 text-xs text-[var(--cast-iron)]">{tag}</span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <a href={business.website} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-3 text-sm font-semibold text-white">Visit</a>
          <a href={business.website} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center text-sm text-[var(--moss)]"><Globe className="mr-1 h-4 w-4" />Website</a>
        </div>
      </div>
    </article>
  );
}
