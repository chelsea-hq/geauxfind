"use client";

import { useEffect, useState } from "react";
import type { Place } from "@/types";

export function usePlace(slug?: string) {
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(Boolean(slug));

  useEffect(() => {
    if (!slug) {
      setPlace(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/place/${slug}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPlace(data?.place ?? null))
      .catch(() => setPlace(null))
      .finally(() => setLoading(false));
  }, [slug]);

  return { place, loading };
}
