"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  ["/", "Home"],
  ["/explore", "Explore"],
  ["/plan", "Plan"],
  ["/whos-got-it", "Who's Got It"],
  ["/community", "Community"],
  ["/cajun-connection", "Cajun Connection"],
  ["/crawfish", "Crawfish 🦞"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--spanish-moss)]/25 bg-[rgba(250,247,242,0.76)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="GeauxFind home" className="inline-flex items-center">
          <Image src="/logo.svg" alt="GeauxFind" width={176} height={42} className="h-auto w-[146px] md:w-[176px]" priority />
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          {links.map(([href, label]) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
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
            {links.map(([href, label]) => {
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
