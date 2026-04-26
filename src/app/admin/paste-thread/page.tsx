"use client";

import { useState } from "react";

type ParseResult = {
  topic: {
    slug: string;
    name: string;
    category: string;
    businessCount: number;
    totalMentions: number;
    topBusinesses: Array<{ slug: string; name: string; mentionCount: number }>;
  };
  placesFound: number;
  newMentions: number;
  absoluteMentions: number;
  committed: boolean;
  viewUrl: string;
};

export default function PasteThreadAdmin() {
  const [token, setToken] = useState("");
  const [topic, setTopic] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [error, setError] = useState("");

  async function run(commit: boolean) {
    if (!token) {
      setError("Paste your ADMIN_TOKEN first.");
      return;
    }
    if (!topic.trim()) {
      setError("Topic is required (e.g. 'best bread pudding').");
      return;
    }
    if (content.trim().length < 30) {
      setError("Paste the full thread — at least a few replies.");
      return;
    }

    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/parse-thread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
        },
        body: JSON.stringify({ topic, content, commit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `Request failed (${res.status})`);
        return;
      }
      setResult(data as ParseResult);
      if (commit) setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-serif text-3xl text-[var(--cajun-red)]">Paste FB Thread → Community Recs</h1>
      <p className="mt-2 text-sm text-[var(--warm-gray)]">
        Copy a Facebook thread (post + replies) from a group you&apos;re a member of, paste it below, and the parser will
        extract business mentions, dedupe against existing data, and update <code className="rounded bg-[var(--cream)] px-1">community-recs.json</code>.
        Use <strong>Preview</strong> first to dry-run before committing.
      </p>

      <div className="mt-6 grid gap-4">
        <label className="text-sm">
          <span className="text-[var(--warm-gray)]">Admin token</span>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="ADMIN_TOKEN from .env"
            autoComplete="off"
            spellCheck={false}
            className="mt-1 w-full rounded-lg border border-[var(--spanish-moss)]/40 px-3 py-2 text-sm"
          />
        </label>

        <label className="text-sm">
          <span className="text-[var(--warm-gray)]">Topic</span>
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. best bread pudding, where to get fresh boudin, best crawfish boil"
            className="mt-1 w-full rounded-lg border border-[var(--spanish-moss)]/40 px-3 py-2 text-sm"
          />
          <span className="mt-1 block text-xs text-[var(--warm-gray)]">
            Will become a topic slug like <code>best-bread-pudding-in-acadiana</code>.
          </span>
        </label>

        <label className="text-sm">
          <span className="text-[var(--warm-gray)]">Thread content</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Paste the full thread — original post and all comments. The parser handles FB UI noise (Like, Reply, Edited, timestamps, etc.) automatically."}
            spellCheck={false}
            className="mt-1 min-h-72 w-full rounded-lg border border-[var(--spanish-moss)]/40 px-3 py-2 font-mono text-xs"
          />
          <span className="mt-1 block text-xs text-[var(--warm-gray)]">
            {content.length.toLocaleString()} characters
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => run(false)}
            disabled={busy}
            className="min-h-11 rounded-xl border border-[var(--cajun-red)] bg-white px-5 py-2.5 text-sm font-semibold text-[var(--cajun-red)] disabled:opacity-60"
          >
            {busy ? "Working…" : "Preview (dry-run)"}
          </button>
          <button
            type="button"
            onClick={() => run(true)}
            disabled={busy}
            className="min-h-11 rounded-xl bg-[var(--cajun-red)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving…" : "Parse & Save"}
          </button>
          {error ? <p role="alert" className="text-sm text-red-600">{error}</p> : null}
        </div>
      </div>

      {result ? (
        <section className="mt-10 rounded-2xl border border-[var(--spanish-moss)]/30 bg-white p-5">
          <header className="flex items-baseline justify-between gap-3">
            <div>
              <h2 className="font-serif text-2xl text-[var(--cast-iron)]">{result.topic.name}</h2>
              <p className="mt-1 text-xs text-[var(--warm-gray)]">
                {result.committed ? "Saved to community-recs.json" : "Preview only — not saved"} · slug{" "}
                <code className="rounded bg-[var(--cream)] px-1">{result.topic.slug}</code>
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="text-2xl font-bold text-[var(--cajun-red)] tabular-nums">{result.placesFound}</p>
              <p className="text-xs text-[var(--warm-gray)]">businesses found</p>
            </div>
          </header>

          <p className="mt-3 text-sm text-[var(--warm-gray)]">
            {result.absoluteMentions} total mentions
            {result.newMentions > 0 ? ` · ${result.newMentions} new from this paste` : ""}
          </p>

          <ol className="mt-5 grid gap-2">
            {result.topic.topBusinesses.map((b, i) => (
              <li key={b.slug} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--spanish-moss)]/20 bg-[var(--cream)] px-3 py-2">
                <span className="flex items-center gap-3">
                  <span className="w-6 text-right font-mono text-xs text-[var(--warm-gray)] tabular-nums">{i + 1}.</span>
                  <span className="font-medium text-[var(--cast-iron)]">{b.name}</span>
                </span>
                <span className="font-mono text-xs text-[var(--warm-gray)] tabular-nums">{b.mentionCount} mentions</span>
              </li>
            ))}
          </ol>

          {result.topic.topBusinesses.length === 0 ? (
            <p className="mt-4 rounded-lg bg-[var(--cream)] p-4 text-sm text-[var(--warm-gray)]">
              No business mentions detected. Try pasting more replies, or check that business names are reasonably clean
              (capitalized, not buried in long sentences).
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="mt-10 rounded-2xl border border-dashed border-[var(--spanish-moss)]/40 p-5 text-sm text-[var(--warm-gray)]">
        <h3 className="font-semibold text-[var(--cast-iron)]">Tips for clean parses</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Paste the full thread including the original post — context helps categorization.</li>
          <li>The parser ignores: Like / Reply / Edited / timestamps / image alt text / auto-translate prompts.</li>
          <li>It flags as &ldquo;new business&rdquo; only when a name is mentioned 2+ times — protects against typos.</li>
          <li>Same topic can be pasted multiple times — mention counts will refresh, not accumulate.</li>
          <li>Aliases (e.g. &ldquo;Chops&rdquo; → &ldquo;Chop&rsquo;s Specialty Meats&rdquo;) are matched automatically.</li>
        </ul>
      </section>
    </main>
  );
}
