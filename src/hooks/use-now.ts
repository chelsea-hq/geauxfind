"use client";

import { useEffect, useState } from "react";

// Returns the current Date — null on SSR/initial render, then a real
// Date after hydration. Use this anywhere you'd otherwise call
// `new Date()` inside a "use client" component to avoid React error
// #418 (hydration mismatch) on time-boundary crossings (today/yesterday,
// weekend/weekday, month change, etc.).
//
// Usage:
//   const now = useNow();
//   if (!now) return <Skeleton />;
//   const today = now.toDateString();
//
// Optional `tickMs` makes it re-render on a schedule (e.g. 60_000 for
// "5 min ago" labels that should keep updating while the page is open).
export function useNow(tickMs?: number): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    if (!tickMs) return;
    const t = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(t);
  }, [tickMs]);

  return now;
}
