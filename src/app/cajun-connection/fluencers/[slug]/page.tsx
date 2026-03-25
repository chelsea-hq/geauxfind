import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { cajunConnectionData, formatFollowers } from "@/lib/cajun-connection";

export async function generateStaticParams() {
  return cajunConnectionData.influencers.map((fluencer) => ({ slug: fluencer.slug }));
}

export default async function FluencerProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fluencer = cajunConnectionData.influencers.find((item) => item.slug === slug);
  if (!fluencer) return notFound();

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 pb-16 pt-10">
      <div className="rounded-[14px] border border-[var(--spanish-moss)]/30 bg-white p-5">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full"><Image src={fluencer.profilePhoto || "/placeholder.svg"} alt={fluencer.name} fill className="object-cover" /></div>
          <div>
            <h1 className="text-4xl text-[var(--cajun-red)]">{fluencer.name}</h1>
            <p className="mt-1 flex items-center text-sm text-[var(--moss)]"><BadgeCheck className="mr-1 h-4 w-4" />Validated Cajun Fluencer</p>
          </div>
        </div>
        <p className="mt-4">{fluencer.bio}</p>

        <h2 className="mt-5 text-2xl">Socials</h2>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          {Object.entries(fluencer.socials).map(([platform, value]) => value ? (
            <a key={platform} href={value.url} target="_blank" rel="noreferrer" className="rounded-[10px] bg-[var(--cream)] px-3 py-2 text-sm">{platform}: {formatFollowers(value.followers)} followers</a>
          ) : null)}
        </div>

        <h2 className="mt-5 text-2xl">Featured Content</h2>
        <div className="mt-2 space-y-2">{fluencer.featuredContent.map((content) => <a key={content.title} href={content.url} target="_blank" rel="noreferrer" className="block rounded-[10px] bg-[var(--cream)] px-3 py-2 text-sm hover:text-[var(--cajun-red)]">{content.title}</a>)}</div>

        <h2 className="mt-5 text-2xl">Specialties</h2>
        <div className="mt-2 flex flex-wrap gap-2">{fluencer.specialtyTags.map((tag) => <span key={tag} className="rounded-full bg-[var(--cream)] px-3 py-1 text-sm">{tag}</span>)}</div>
      </div>

      <Link href="/cajun-connection/fluencers" className="gf-link text-sm">← Back to fluencers</Link>
    </main>
  );
}
