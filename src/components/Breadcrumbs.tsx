"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/seo";

const labels: Record<string, string> = {
  "": "Home",
  explore: "Explore",
  plan: "Plan",
  ask: "Ask Geaux",
  crawfish: "Crawfish",
  community: "Community",
  "whos-got-it": "Who's Got It",
  trending: "Trending",
  "whats-new": "What's New",
  "this-weekend": "This Weekend",
  events: "Events",
  food: "Food",
  music: "Music",
  finds: "Finds",
  recipes: "Recipes",
  about: "About",
  search: "Search",
  claim: "Claim",
  alerts: "Alerts",
  place: "Place",
  event: "Event",
  recipe: "Recipe",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;

  const parts = pathname.split("/").filter(Boolean);
  const crumbs = [{ name: "Home", path: "/" }, ...parts.map((p, i) => ({ name: labels[p] || p.replace(/-/g, " "), path: `/${parts.slice(0, i + 1).join("/")}` }))];

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path}`,
    })),
  };

  return (
    <>
      <JsonLd data={schema} />
      <nav aria-label="Breadcrumb" className="mx-auto max-w-6xl px-4 pt-4 text-sm text-[var(--warm-gray)]">
        <ol className="flex flex-wrap items-center gap-2">
          {crumbs.map((crumb, i) => (
            <li key={crumb.path} className="flex items-center gap-2">
              {i < crumbs.length - 1 ? <Link href={crumb.path} className="hover:underline">{crumb.name}</Link> : <span aria-current="page" className="font-semibold text-[var(--cast-iron)]">{crumb.name}</span>}
              {i < crumbs.length - 1 ? <span>/</span> : null}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
