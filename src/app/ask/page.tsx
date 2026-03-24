export default function AskPage() {
  const suggestions = ["Best boudin near Lafayette?", "Kid-friendly festivals this month", "Where to hear live accordion tonight?"];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-serif text-4xl text-[var(--cajun-red)]">Ask Acadiana</h1>
      <div className="mt-6 rounded-2xl border border-[var(--warm-gray)]/20 bg-white p-5">
        <div className="mb-4 rounded-xl bg-[var(--cream-bg)] p-3 text-sm">👋 Hey! Ask anything about Acadiana food, events, and local culture.</div>
        <div className="space-y-2">
          {suggestions.map((s) => (
            <button
              key={s}
              className="mr-2 rounded-full border border-[var(--bayou-gold)]/40 bg-[var(--bayou-gold)]/20 px-3 py-1 text-sm transition hover:-translate-y-0.5 hover:bg-[var(--bayou-gold)]/35 hover:shadow-sm"
            >
              {s}
            </button>
          ))}
        </div>
        <form className="mt-4 flex gap-2">
          <input placeholder="Ask anything about Acadiana" className="w-full rounded-full border border-[var(--warm-gray)]/30 px-4 py-3" />
          <button className="rounded-full bg-[var(--cajun-red)] px-4 py-2 text-white">Send</button>
        </form>
      </div>
    </main>
  );
}
