import { getHotSignals } from "@/lib/hot-signals";
import { getSeasonalSignals, getTrending } from "@/lib/trends";
import { buildMetadata } from "@/lib/seo";
import type { HotSignal, SignalSource } from "@/lib/hot-signals";

export const metadata = buildMetadata({
  title: "What's Hot Right Now in Acadiana | GeauxFind",
  description: "Real-time pulse of what's trending in Acadiana — crawfish prices, events, community recs, Reddit, and search spikes.",
  path: "/trending",
});

export const revalidate = 300; // revalidate every 5 minutes

const SOURCE_CONFIG: Record<SignalSource, { label: string; color: string; bg: string }> = {
  search:    { label: "Search Spike",   color: "text-[var(--cajun-red)]",   bg: "bg-[var(--cajun-red)]/10" },
  event:     { label: "New Event",      color: "text-[var(--moss)]",        bg: "bg-[var(--moss)]/10" },
  crawfish:  { label: "Crawfish",       color: "text-orange-600",           bg: "bg-orange-50" },
  community: { label: "Community",      color: "text-[var(--sunset-gold)]", bg: "bg-[var(--sunset-gold)]/10" },
  reddit:    { label: "Reddit",         color: "text-orange-500",           bg: "bg-orange-50" },
  facebook:  { label: "Facebook",       color: "text-blue-600",             bg: "bg-blue-50" },
};

function HeatBar({ heat }: { heat: 1 | 2 | 3 | 4 | 5 }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Heat level ${heat} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={`h-2 w-2 rounded-full ${n <= heat ? "bg-[var(--cajun-red)]" : "bg-[var(--spanish-moss)]/25"}`}
        />
      ))}
    </div>
  );
}

function timeAgo(ts: string) {
  const diffMs = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function SignalCard({ signal }: { signal: HotSignal }) {
  const cfg = SOURCE_CONFIG[signal.type];
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${cfg.bg} ${cfg.color}`}>
          {cfg.label}
        </span>
        <div className="flex flex-col items-end gap-1">
          <HeatBar heat={signal.heat} />
          <time className="text-xs text-[var(--warm-gray)]">{timeAgo(signal.timestamp)}</time>
        </div>
      </div>
      <div>
        {signal.sourceUrl ? (
          <a href={signal.sourceUrl} className="font-semibold text-[var(--cast-iron)] hover:text-[var(--cajun-red)]">
            {signal.title}
          </a>
        ) : (
          <p className="font-semibold text-[var(--cast-iron)]">{signal.title}</p>
        )}
        <p className="mt-1 text-sm text-[var(--warm-gray)]">{signal.description}</p>
      </div>
      <p className="text-xs text-[var(--warm-gray)]">via {signal.source}</p>
    </article>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1">
      {values.map((v, i) => (
        <span
          key={i}
          className="w-2 rounded-sm bg-[var(--cajun-red)]/70"
          style={{ height: `${Math.max(6, (v / max) * 28)}px` }}
        />
      ))}
    </div>
  );
}

export default async function TrendingPage() {
  const [signals, seasonal] = await Promise.all([
    getHotSignals(),
    Promise.resolve(getSeasonalSignals()),
  ]);
  const trendingSearches = getTrending(10);

  const topSignals = signals.slice(0, 3);
  const restSignals = signals.slice(3);

  return (
    <main className="pb-16">
      {/* Hero */}
      <section className="border-b border-[var(--spanish-moss)]/20 bg-[var(--cream)] px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--cajun-red)]">Live Pulse</p>
          <h1 className="mt-2 text-4xl text-[var(--cast-iron)] md:text-5xl">What&apos;s Hot Right Now</h1>
          <p className="mt-2 text-[var(--warm-gray)]">
            Real-time signals from search spikes, events, crawfish prices, community recs, and more — updated every 5 minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
              <span key={key} className={`rounded-full px-3 py-1 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                {cfg.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {/* Top 3 signals - featured */}
        {topSignals.length > 0 ? (
          <section className="mt-8">
            <h2 className="sr-only">Top signals</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {topSignals.map((s) => <SignalCard key={s.id} signal={s} />)}
            </div>
          </section>
        ) : null}

        {/* Feed */}
        {restSignals.length > 0 ? (
          <section className="mt-6">
            <h2 className="mb-4 text-xl font-semibold text-[var(--cast-iron)]">All Signals</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {restSignals.map((s) => <SignalCard key={s.id} signal={s} />)}
            </div>
          </section>
        ) : null}

        {signals.length === 0 ? (
          <section className="mt-12 rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-10 text-center">
            <p className="text-2xl">🔥</p>
            <p className="mt-2 font-semibold text-[var(--cast-iron)]">Heating up…</p>
            <p className="mt-1 text-sm text-[var(--warm-gray)]">Signals will appear as activity picks up. Check back soon.</p>
          </section>
        ) : null}

        {/* Trending searches */}
        {trendingSearches.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-3xl text-[var(--cajun-red)]">Trending Searches</h2>
            <p className="mt-1 text-sm text-[var(--warm-gray)]">What Acadiana folks are searching on GeauxFind right now.</p>
            <div className="mt-5 grid gap-3">
              {trendingSearches.map((item, i) => (
                <article
                  key={item.query}
                  className="flex items-center justify-between rounded-xl border border-[var(--spanish-moss)]/25 bg-white p-4"
                >
                  <div>
                    <p className="font-semibold">
                      #{i + 1} {item.query} {item.count >= 3 ? "🔥" : ""}
                    </p>
                    <p className="text-xs text-[var(--warm-gray)]">{item.count} recent searches</p>
                  </div>
                  <Sparkline values={item.spark.map((s) => s.count)} />
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {/* Seasonal */}
        <section className="mt-10 rounded-2xl border border-[var(--sunset-gold)]/35 bg-[var(--cream)] p-5">
          <h2 className="text-2xl text-[var(--cast-iron)]">Seasonal Pattern Watch</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {seasonal.map((s) => (
              <li key={s.term}>
                <strong>{s.term}</strong> ({s.season}) — {s.reason}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
