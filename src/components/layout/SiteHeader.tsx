"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  ["/food", "Food"],
  ["/events", "Events"],
  ["/music", "Music"],
  ["/crawfish", "Crawfish 🦞"],
  ["/whats-new", "What’s New"],
  ["/recipes", "Recipes"],
  ["/explore", "Explore"],
  ["/ask", "Ask Acadiana"],
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--warm-gray)]/15 bg-[var(--cream-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="GeauxFind home" className="inline-flex items-center">
          <Image src="/logo-icon.svg" alt="GeauxFind" width={38} height={38} className="md:hidden" priority />
          <Image src="/logo.svg" alt="GeauxFind" width={180} height={44} className="hidden md:block" priority />
        </Link>

        <nav className="hidden gap-5 text-sm md:flex">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`border-b-2 pb-1 ${pathname.startsWith(href) ? "border-[var(--cajun-red)] font-semibold" : "border-transparent hover:border-[var(--bayou-gold)]"}`}>{label}</Link>
          ))}
        </nav>

        <button aria-label="Open menu" onClick={() => setOpen((v) => !v)} className="min-h-11 min-w-11 rounded-lg border bg-white md:hidden">
          <Menu className="mx-auto h-5 w-5" />
        </button>
      </div>

      {open && (
        <nav className="border-t bg-white p-3 md:hidden">
          <div className="grid gap-2">
            {links.map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setOpen(false)} className={`min-h-11 rounded-lg px-3 py-2 ${pathname.startsWith(href) ? "bg-[var(--cream-bg)] font-semibold" : "hover:bg-[var(--cream-bg)]"}`}>{label}</Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
