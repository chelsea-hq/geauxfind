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

export default function FreshnessBadge({ file, label = "Updated", className = "", showAbsolute = false }: Props) {
  const updated = getFileUpdatedAt(file);
  const tier = getFreshnessTier(updated);
  const rel = formatRelative(updated);
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
