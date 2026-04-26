"use client";

import { useCallback, useMemo, useState } from "react";
import guides from "../../../data/guides.json";
import type { GuideGrouping } from "@/lib/guide-config";
import { filterOperational } from "@/lib/place-status";

type Guide = {
  name: string;
  slug: string;
  category: string;
  group: "food-drink" | "things-to-do";
  description: string;
  address: string;
  city: string;
  phone?: string;
  website?: string;
  hours?: Record<string, unknown>;
  priceRange?: string;
  tags: string[];
  features: string[];
  imageUrl?: string;
  rating?: number;
  featured: boolean;
  meta?: Record<string, unknown>;
};

function MetaDetails({ meta, category }: { meta: Record<string, unknown>; category: string }) {
  // Filter out internal fields
  const skip = new Set(["source", "lastUpdated", "category", "dayIndex"]);
  const entries = Object.entries(meta).filter(([k]) => !skip.has(k));
  if (entries.length === 0) return null;

  return (
    <div className="mt-3 space-y-2 rounded-[10px] bg-[var(--cream)] p-3">
      {entries.map(([key, value]) => (
        <MetaField key={key} label={key} value={value} category={category} />
      ))}
    </div>
  );
}

function MetaField({ label, value }: { label: string; value: unknown; category: string }) {
  const prettyLabel = label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  // Arrays of strings → pill tags
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return (
      <div>
        <span className="text-xs font-semibold text-[var(--cajun-red)]">{prettyLabel}</span>
        <div className="mt-1 flex flex-wrap gap-1">
          {(value as string[]).map((v) => (
            <span key={v} className="rounded-full bg-white px-2 py-0.5 text-xs text-[var(--cast-iron)]">{v}</span>
          ))}
        </div>
      </div>
    );
  }

  // Arrays of objects (specials, happyHours, musicNights, danceNights, contenders, etc.)
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "object") {
    return (
      <div>
        <span className="text-xs font-semibold text-[var(--cajun-red)]">{prettyLabel}</span>
        <div className="mt-1 space-y-2">
          {(value as Record<string, unknown>[]).map((obj, i) => (
            <div key={i} className="rounded-lg bg-white p-2 text-xs text-[var(--cast-iron)]">
              {Object.entries(obj).map(([k, v]) => {
                const fieldLabel = k.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase()).trim();
                if (Array.isArray(v)) return <p key={k}><strong>{fieldLabel}:</strong> {(v as string[]).join(", ")}</p>;
                if (typeof v === "object" && v !== null) return <p key={k}><strong>{fieldLabel}:</strong> {JSON.stringify(v)}</p>;
                return <p key={k}><strong>{fieldLabel}:</strong> {String(v)}</p>;
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Booleans
  if (typeof value === "boolean") {
    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="font-semibold text-[var(--cajun-red)]">{prettyLabel}</span>
        <span>{value ? "✅ Yes" : "❌ No"}</span>
      </div>
    );
  }

  // Simple strings/numbers
  if (typeof value === "string" || typeof value === "number") {
    // URLs get linked
    if (typeof value === "string" && value.startsWith("http")) {
      return (
        <div className="text-xs">
          <span className="font-semibold text-[var(--cajun-red)]">{prettyLabel}: </span>
          <a href={value} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)] underline">{value}</a>
        </div>
      );
    }
    return (
      <div className="text-xs">
        <span className="font-semibold text-[var(--cajun-red)]">{prettyLabel}: </span>
        <span className="text-[var(--cast-iron)]">{String(value)}</span>
      </div>
    );
  }

  // Objects (socials, etc.)
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return (
      <div>
        <span className="text-xs font-semibold text-[var(--cajun-red)]">{prettyLabel}</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <span key={k} className="rounded-full bg-white px-2 py-0.5 text-xs text-[var(--cast-iron)]">
              {typeof v === "string" && v.startsWith("http") ? (
                <a href={v} target="_blank" rel="noreferrer" className="text-[var(--cajun-red)] underline">{k}</a>
              ) : (
                <>{k}: {String(v)}</>
              )}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

export function GuideDirectory({
  category,
  title,
  description,
  icon,
  grouping = "none",
}: {
  category: string;
  title: string;
  description: string;
  icon: string;
  grouping?: GuideGrouping;
}) {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("All");

  const items = useMemo(
    () => filterOperational((guides as Guide[]).filter((item) => item.category === category)),
    [category],
  );

  const groupKeyLabel = useMemo(() => {
    if (grouping === "day") return "Day";
    if (grouping === "month") return "Month";
    if (grouping === "city") return "City";
    return "Group";
  }, [grouping]);

  const getGroupValue = useCallback((item: Guide) => {
    if (grouping === "day") {
      const dayFromMeta = (item.meta?.day as string | undefined) || (item.meta?.days as string[] | undefined)?.[0] || (item.meta?.brunchDays as string[] | undefined)?.[0] || (item.meta?.musicNights as { day?: string }[] | undefined)?.[0]?.day || (item.meta?.happyHours as { days?: string[] }[] | undefined)?.[0]?.days?.[0];
      return dayFromMeta || "Other";
    }
    if (grouping === "month") {
      return (item.meta?.month as string | undefined) || "Other";
    }
    if (grouping === "city") {
      return item.city || "Lafayette";
    }
    return "All";
  }, [grouping]);

  const groupOptions = useMemo(() => {
    if (grouping === "none") return ["All"];
    return ["All", ...Array.from(new Set(items.map((item) => getGroupValue(item)))).sort()];
  }, [items, grouping, getGroupValue]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.tags.some((tag) => tag.toLowerCase().includes(q));

      const matchesGroup = groupFilter === "All" || getGroupValue(item) === groupFilter;

      return matchesQuery && matchesGroup;
    });
  }, [items, query, groupFilter, getGroupValue]);

  return (
    <section className="space-y-5">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{icon}</span>
          <h1 className="text-4xl text-[var(--cajun-red)]">{title}</h1>
        </div>
        <p className="text-lg text-[var(--warm-gray)]">{description}</p>
      </div>

      <div className="grid gap-3 rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-4 md:grid-cols-2">
        <label className="text-sm text-[var(--warm-gray)]">
          Search
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${title.toLowerCase()}...`}
            className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2"
          />
        </label>

        {grouping !== "none" ? (
          <label className="text-sm text-[var(--warm-gray)]">
            {groupKeyLabel}
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="mt-1 w-full rounded-[10px] border border-[var(--spanish-moss)]/35 px-3 py-2"
            >
              {groupOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <div className="flex items-end text-sm text-[var(--warm-gray)]">Browse all entries in this guide.</div>
        )}
      </div>

      <p className="text-sm text-[var(--warm-gray)]">{filtered.length} results</p>

      {filtered.length === 0 ? (
        <div className="rounded-[12px] border border-dashed border-[var(--spanish-moss)]/40 py-12 text-center text-[var(--warm-gray)]">
          <p className="text-4xl mb-2">{icon}</p>
          <p className="font-medium">No results found</p>
          <p className="text-sm mt-1">Try a different search or filter.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((item) => (
            <article key={`${item.category}-${item.slug}`} className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl text-[var(--cajun-red)]">{item.name}</h2>
                  <p className="text-sm text-[var(--warm-gray)]">
                    {item.city}
                    {item.priceRange ? ` • ${item.priceRange}` : ""}
                  </p>
                </div>
                {item.website ? (
                  <a href={item.website} target="_blank" rel="noreferrer" className="text-sm text-[var(--cajun-red)]">
                    Website
                  </a>
                ) : null}
              </div>

              <p className="mt-2 text-sm text-[var(--cast-iron)]/85">{item.description}</p>

              {item.features.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.features.slice(0, 5).map((feature) => (
                    <span key={feature} className="rounded-full bg-[var(--cream)] px-2.5 py-1 text-xs text-[var(--cast-iron)]">
                      {feature}
                    </span>
                  ))}
                </div>
              ) : null}

              {item.meta ? <MetaDetails meta={item.meta} category={item.category} /> : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
