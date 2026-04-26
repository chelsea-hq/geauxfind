"use client";

import { useEffect, useState } from "react";
import { formatAbsolute, formatRelative, getFileUpdatedAt, getFreshnessTier } from "@/lib/freshness";

type Props = {
  file: string;
  label?: string;
  className?: string;
  showAbsolute?: boolean;
};

const tierClass: Record<string, string> = {
  fresh: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ok: "bg-amber-50 text-amber-900 ring-amber-200",
  stale: "bg-rose-50 text-rose-900 ring-rose-200",
};

const tierDot: Record<string, string> = {
  fresh: "bg-emerald-500",
  ok: "bg-amber-500",
  stale: "bg-rose-500",
};

// "Updated 5 min ago" depends on Date.now(), which differs between server
// SSR and client hydration. Computing it eagerly on first render causes
// React error #418 (hydration mismatch) — that was the source of the
// "Application error: client-side exception" overlay.
//
// Fix: render a stable neutral state on server + first client paint,
// then upgrade to real relative time after mount via useEffect. Re-ticks
// every minute so the badge stays accurate while the page is open.
export default function FreshnessBadge({ file, label = "Updated", className = "", showAbsolute = false }: Props) {
  const updated = getFileUpdatedAt(file);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  if (!now) {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 ${className}`}
        suppressHydrationWarning
      >
        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" aria-hidden="true" />
        <span>{label}</span>
      </span>
    );
  }

  const tier = getFreshnessTier(updated, now);
  const rel = formatRelative(updated, now);
  const abs = formatAbsolute(updated);

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ${tierClass[tier]} ${className}`}
      title={`Last refreshed ${abs}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${tierDot[tier]}`} aria-hidden="true" />
      <span>
        {label}&nbsp;{showAbsolute ? abs : rel}
      </span>
    </span>
  );
}
