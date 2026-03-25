import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star } from "lucide-react";
import { formatFollowers, isFeaturedFluencer, totalFollowers, type CajunFluencer } from "@/lib/cajun-connection";

const checks = [
  "1K+ followers on at least one platform",
  "50%+ Cajun/Louisiana food content",
  "Active within last 30 days",
  "Louisiana connection",
  "Legitimate account",
];

export function FluencerCard({ fluencer }: { fluencer: CajunFluencer }) {
  const featured = isFeaturedFluencer(fluencer);

  return (
    <article className="card-lift overflow-hidden rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white shadow-sm">
      <div className="relative aspect-[16/9] bg-[var(--cream)]">
        <Image src={fluencer.profilePhoto || "/placeholder.svg"} alt={fluencer.name} fill className="object-cover" />
        <div className="absolute left-3 top-3 flex items-center gap-2">
          {fluencer.verified ? <span className="inline-flex items-center rounded-full bg-[var(--moss)] px-2 py-1 text-xs font-semibold text-white"><BadgeCheck className="mr-1 h-3 w-3" />Verified</span> : null}
          {featured ? <span className="inline-flex items-center rounded-full bg-[var(--sunset-gold)] px-2 py-1 text-xs font-semibold text-[var(--cast-iron)]"><Star className="mr-1 h-3 w-3" />Gold</span> : null}
        </div>
      </div>
      <div className="space-y-2 p-4">
        <Link href={`/cajun-connection/fluencers/${fluencer.slug}`} className="text-xl leading-tight hover:text-[var(--cajun-red)]">{fluencer.name}</Link>
        <p className="text-sm text-[var(--warm-gray)]">{fluencer.specialty} • {formatFollowers(totalFollowers(fluencer))} followers</p>
        <p className="line-clamp-2 text-sm text-[var(--cast-iron)]/80">{fluencer.bio}</p>
        <ul className="space-y-1 text-xs text-[var(--cast-iron)]/75">
          {checks.map((item) => <li key={item}>✅ {item}</li>)}
        </ul>
      </div>
    </article>
  );
}
