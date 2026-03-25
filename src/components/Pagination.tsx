"use client";

import Link from "next/link";

export function Pagination({
  page,
  pageSize,
  total,
  pathname,
  params,
}: {
  page: number;
  pageSize: number;
  total: number;
  pathname: string;
  params: URLSearchParams;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), Math.min(totalPages, page + 2));

  const hrefFor = (nextPage: number) => {
    const nextParams = new URLSearchParams(params.toString());
    nextParams.set("page", String(nextPage));
    return `${pathname}?${nextParams.toString()}`;
  };

  return (
    <div className="mt-8 flex flex-col items-center gap-4">
      <p className="text-sm text-[var(--warm-gray)]">Showing {start}-{end} of {total}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link aria-label="Previous page" href={hrefFor(Math.max(1, page - 1))} className={`min-h-11 min-w-11 rounded-lg border px-3 py-2 text-sm ${page === 1 ? "pointer-events-none opacity-40" : "hover:bg-[var(--cream-bg)]"}`}>
          Prev
        </Link>
        {pages.map((p) => (
          <Link key={p} href={hrefFor(p)} className={`min-h-11 min-w-11 rounded-lg border px-3 py-2 text-center text-sm ${p === page ? "bg-[var(--cajun-red)] text-white" : "bg-white hover:bg-[var(--cream-bg)]"}`}>
            {p}
          </Link>
        ))}
        <Link aria-label="Next page" href={hrefFor(Math.min(totalPages, page + 1))} className={`min-h-11 min-w-11 rounded-lg border px-3 py-2 text-sm ${page === totalPages ? "pointer-events-none opacity-40" : "hover:bg-[var(--cream-bg)]"}`}>
          Next
        </Link>
      </div>
    </div>
  );
}
