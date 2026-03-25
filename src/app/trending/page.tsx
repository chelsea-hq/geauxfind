import { getSeasonalSignals, getTrending } from "@/lib/trends";

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1">
      {values.map((v, i) => (
        <span key={i} className="w-2 rounded-sm bg-[var(--cajun-red)]/70" style={{ height: `${Math.max(6, (v / max) * 28)}px` }} />
      ))}
    </div>
  );
}

export default function TrendingPage() {
  const trends = getTrending(30);
  const seasonal = getSeasonalSignals();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-4xl text-[var(--cajun-red)]">Trending in Acadiana</h1>
      <p className="mt-2 text-[var(--warm-gray)]">What folks are searching right now — plus seasonal swings all year long.</p>

      <div className="mt-6 grid gap-3">
        {trends.map((item, i) => (
          <article key={item.query} className="flex items-center justify-between rounded-xl border border-[var(--spanish-moss)]/25 bg-white p-4">
            <div>
              <p className="font-semibold">#{i + 1} {item.query} {item.count >= 3 ? "🔥" : ""}</p>
              <p className="text-xs text-[var(--warm-gray)]">{item.count} recent searches</p>
            </div>
            <Sparkline values={item.spark.map((s) => s.count)} />
          </article>
        ))}
      </div>

      <section className="mt-10 rounded-2xl border border-[var(--sunset-gold)]/35 bg-[var(--cream)] p-5">
        <h2 className="text-2xl">Seasonal Pattern Watch</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {seasonal.map((s) => <li key={s.term}><strong>{s.term}</strong> ({s.season}) — {s.reason}</li>)}
        </ul>
      </section>
    </main>
  );
}
