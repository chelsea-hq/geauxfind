"use client";

import { useState } from "react";

type Props = {
  slug: string;
  placeName: string;
};

type Status = "idle" | "open" | "submitting" | "sent" | "error";

export function ReportClosedButton({ slug, placeName }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [reason, setReason] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/report-closed", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, placeName, reason, email }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setStatus("sent");
      setMessage(
        data.willAutoDemote
          ? "Thanks — this place has been flagged by multiple people. We'll hide it from listings while we verify."
          : "Thanks — we've logged your report. We check against Google Places and community reports weekly.",
      );
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again in a moment.");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" aria-live="polite" className="mt-4 rounded-[10px] border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-900">
        {message}
      </div>
    );
  }

  if (status === "idle") {
    return (
      <button
        type="button"
        onClick={() => setStatus("open")}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--warm-gray)]/30 bg-white px-3 py-1.5 text-xs font-medium text-[var(--warm-gray)] transition hover:border-rose-400 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        <span aria-hidden="true">⚠️</span> Is this place closed or moved?
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 rounded-[12px] border border-[var(--warm-gray)]/25 bg-white p-4 text-sm">
      <p className="font-semibold text-[var(--cast-iron)]">Report {placeName} as closed</p>
      <p className="mt-1 text-xs text-[var(--warm-gray)]">
        Thank you — this helps us avoid stale listings. We check each report against Google Places and community reports weekly.
      </p>
      <label className="mt-3 block">
        <span className="text-xs font-medium text-[var(--cast-iron)]">What happened? (optional)</span>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value.slice(0, 500))}
          rows={2}
          placeholder="e.g. drove by last week, sign is down, doors locked…"
          className="mt-1 w-full rounded-[8px] border border-[var(--warm-gray)]/30 bg-white p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cajun-red)]"
        />
      </label>
      <label className="mt-3 block">
        <span className="text-xs font-medium text-[var(--cast-iron)]">Your email (optional — so we can follow up)</span>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value.slice(0, 120))}
          placeholder="you@example.com"
          className="mt-1 w-full rounded-[8px] border border-[var(--warm-gray)]/30 bg-white p-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--cajun-red)]"
        />
      </label>
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="inline-flex min-h-10 items-center rounded-[8px] bg-rose-600 px-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Reporting…" : "Report as closed"}
        </button>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="inline-flex min-h-10 items-center rounded-[8px] border border-[var(--warm-gray)]/30 bg-white px-3 text-sm text-[var(--cast-iron)]"
        >
          Cancel
        </button>
      </div>
      {status === "error" ? (
        <p className="mt-2 text-xs text-rose-700" role="alert">{message}</p>
      ) : null}
    </form>
  );
}
