import Link from "next/link";
import type { Metadata } from "next";
import recsData from "../../../data/community-recs.json";
import type { CommunityRecsData } from "@/lib/dump-parser";
import { buildMetadata } from "@/lib/seo";

const data = recsData as CommunityRecsData;

export const metadata: Metadata = buildMetadata({
  title: "Best of Acadiana — Voted by Locals | GeauxFind",
  description:
    "Crowd-sourced rankings of Acadiana's best food, by the people who eat it. Real recommendations from local Facebook groups, deduped and counted.",
  path: "/best-of",
  ogTitle: "Best of Acadiana, by the people who eat it",
  ogSubtitle: "Crowd-sourced rankings from local Facebook groups",
  ogKicker: "GEAUXFIND · COMMUNITY PICKS",
});

export const revalidate = 3600;

export default function BestOfIndex() {
  const topics = (data.topics || [])
    .filter((t) => t.businessCount > 0)
    .sort((a, b) => (b.totalMentions || 0) - (a.totalMentions || 0));

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--cajun-red)]">
          Community picks
        </p>
        <h1 className="font-serif text-4xl text-[var(--cajun-red)] md:text-5xl">
          Best of Acadiana, voted by the people who eat it
        </h1>
        <p className="max-w-2xl text-[var(--warm-gray)]">
          These rankings come from real Facebook threads — locals asking &ldquo;where can I find the best
          gumbo / chicken salad / sushi&rdquo; and the answers that keep getting repeated. We dedupe, count
          mentions, and show you who&rsquo;s actually winning.
        </p>
      </header>

      {topics.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-dashed border-[var(--spanish-moss)]/40 p-8 text-center text-[var(--warm-gray)]">
          No topics yet — check back soon.
        </p>
      ) : (
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {topics.map((topic) => {
            const top3 = (topic.topBusinesses || []).slice(0, 3);
            return (
              <Link
                key={topic.slug}
                href={`/best-of/${topic.slug}`}
                className="group rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5 transition-colors hover:border-[var(--cajun-red)]/50"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-serif text-2xl text-[var(--cast-iron)] group-hover:text-[var(--cajun-red)]">
                    {topic.name}
                  </h2>
                  <span className="shrink-0 rounded-full bg-[var(--cream)] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-[var(--cajun-red)]">
                    {topic.totalMentions} votes
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--warm-gray)]">
                  {topic.businessCount} contenders
                </p>
                {top3.length > 0 ? (
                  <ol className="mt-4 space-y-1 text-sm">
                    {top3.map((b, i) => (
                      <li key={b.slug} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <span className="font-mono text-xs text-[var(--warm-gray)] tabular-nums">
                            {i + 1}.
                          </span>
                          <span className="text-[var(--cast-iron)]">{b.name}</span>
                        </span>
                        <span className="font-mono text-xs text-[var(--warm-gray)] tabular-nums">
                          {b.mentionCount}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}

      <section className="mt-12 rounded-2xl border border-[var(--spanish-moss)]/30 bg-[var(--cream)] p-6">
        <h2 className="font-serif text-xl text-[var(--cast-iron)]">How this works</h2>
        <p className="mt-2 text-sm text-[var(--warm-gray)]">
          Lafayette has dozens of food Facebook groups where locals ask each other &ldquo;where&rsquo;s
          the best [X]?&rdquo; — and the same names come up over and over. We capture those threads,
          parse out the business names, dedupe by alias (so &ldquo;Chops&rdquo; and &ldquo;Chop&rsquo;s
          Specialty Meats&rdquo; count as one), and count how many distinct people recommended each
          place. The result is the closest thing to an honest crowd-sourced ranking you&rsquo;ll find.
        </p>
      </section>
    </main>
  );
}
