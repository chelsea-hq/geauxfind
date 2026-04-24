import lastUpdatedData from "@/../data/last-updated.json";

type Stamps = {
  generatedAt: string;
  files: Record<string, string | null>;
};

const stamps = lastUpdatedData as Stamps;

export function getFileUpdatedAt(file: string): Date | null {
  const iso = stamps.files?.[file];
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function getGeneratedAt(): Date | null {
  const iso = stamps.generatedAt;
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatRelative(updated: Date | null, now: Date = new Date()): string {
  if (!updated) return "Unknown";
  const diffMs = now.getTime() - updated.getTime();
  const min = Math.round(diffMs / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const days = Math.round(hr / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return `${months} mo ago`;
}

export function getFreshnessTier(updated: Date | null, now: Date = new Date()): "fresh" | "ok" | "stale" {
  if (!updated) return "stale";
  const hours = (now.getTime() - updated.getTime()) / 3_600_000;
  if (hours <= 24) return "fresh";
  if (hours <= 72) return "ok";
  return "stale";
}

export function formatAbsolute(updated: Date | null): string {
  if (!updated) return "Unknown";
  return updated.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
