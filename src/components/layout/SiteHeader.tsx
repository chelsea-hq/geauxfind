"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

const coreLinks = [
  ["/", "Home"],
  ["/plan", "Plan"],
  ["/community", "Community"],
  ["/cajun-connection", "Cajun Connection"],
] as const;

const exploreLinks = [
  ["/explore", "Explore"],
  ["/trending", "What's Hot"],
  ["/deals", "Deals & Offers"],
  ["/whos-got-it", "Who's Got It"],
  ["/kids-eat-free", "Kids Eat Free"],
  ["/live-music", "Live Music"],
  ["/weekend-brunch", "Brunch"],
  ["/crawfish", "Crawfish"],
] as const;

const mobileLinks = [
  ["/", "Home"],
  ["/explore", "Explore"],
  ["/trending", "What's Hot"],
  ["/deals", "Deals & Offers"],
  ["/plan", "Plan"],
  ["/whos-got-it", "Who's Got It"],
  ["/community", "Community"],
  ["/cajun-connection", "Cajun Connection"],
  ["/kids-eat-free", "Kids Eat Free"],
  ["/live-music", "Live Music"],
  ["/weekend-brunch", "Brunch"],
  ["/crawfish", "Crawfish"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
    setExploreOpen(false);
  }, [pathname]);

  const isExploreActive = exploreLinks.some(([href]) => pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--spanish-moss)]/25 bg-[rgba(250,247,242,0.76)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="GeauxFind home" className="inline-flex items-center">
          <Image src="/logo.svg" alt="GeauxFind" width={176} height={42} className="h-auto w-[146px] md:w-[176px]" priority />
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          <Link
            href="/"
            className={`gf-link py-2 ${pathname === "/" ? "text-[var(--cajun-red)]" : "text-[var(--cast-iron)] hover:text-[var(--cajun-red)]"}`}
          >
            Home
          </Link>

          <div className="relative" onMouseEnter={() => setExploreOpen(true)} onMouseLeave={() => setExploreOpen(false)}>
            <button
              type="button"
              onClick={() => setExploreOpen((v) => !v)}
              className={`gf-link inline-flex items-center gap-1 py-2 ${isExploreActive ? "text-[var(--cajun-red)]" : "text-[var(--cast-iron)] hover:text-[var(--cajun-red)]"}`}
              aria-expanded={exploreOpen}
              aria-haspopup="menu"
            >
              Explore
              <ChevronDown className={`h-4 w-4 transition-transform ${exploreOpen ? "rotate-180" : ""}`} />
            </button>

            {exploreOpen ? (
              <div className="absolute left-0 top-full z-50 mt-2 min-w-52 rounded-[10px] border border-[var(--spanish-moss)]/35 bg-white p-2 shadow-lg" role="menu">
                {exploreLinks.map(([href, label]) => {
                  const isActive = pathname.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      className={`block rounded-[8px] px-3 py-2 text-sm ${isActive ? "bg-[var(--cajun-red)] text-white" : "text-[var(--cast-iron)] hover:bg-[var(--sunset-gold)]/20"}`}
                    >
                      {label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </div>

          {coreLinks.slice(1).map(([href, label]) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`gf-link py-2 ${isActive ? "text-[var(--cajun-red)]" : "text-[var(--cast-iron)] hover:text-[var(--cajun-red)]"}`}>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:block">
          <Link href="/ask" className="inline-flex min-h-11 items-center rounded-[10px] bg-[var(--cajun-red)] px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sunset-gold)]">Ask Geaux</Link>
        </div>

        <button aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((v) => !v)} className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] border border-[var(--spanish-moss)]/35 bg-white/80 md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sunset-gold)]">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className={`md:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}>
        <div className={`absolute inset-x-0 top-full border-b border-[var(--spanish-moss)]/25 bg-[rgba(250,247,242,0.98)] px-4 py-4 backdrop-blur-md transition-transform duration-300 ${open ? "translate-y-0" : "-translate-y-3 opacity-0"}`}>
          <nav className="grid gap-2">
            {mobileLinks.map(([href, label]) => {
              const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link key={href} href={href} onClick={() => setOpen(false)} className={`inline-flex min-h-11 items-center rounded-[10px] px-3 py-2 ${isActive ? "bg-[var(--cajun-red)] text-white" : "bg-white text-[var(--cast-iron)]"}`}>
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
