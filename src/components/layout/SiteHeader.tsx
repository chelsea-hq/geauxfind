import Image from "next/image";
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--warm-gray)]/15 bg-[var(--cream-bg)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" aria-label="GeauxFind home" className="inline-flex items-center">
          <Image src="/logo-icon.svg" alt="GeauxFind" width={38} height={38} className="md:hidden" priority />
          <Image src="/logo.svg" alt="GeauxFind" width={180} height={44} className="hidden md:block" priority />
        </Link>
        <nav className="hidden gap-5 text-sm md:flex">
          <Link href="/food">Food</Link>
          <Link href="/events">Events</Link>
          <Link href="/music">Music</Link>
          <Link href="/whats-new">What&apos;s New</Link>
          <Link href="/recipes">Recipes</Link>
          <Link href="/ask">Ask Acadiana</Link>
        </nav>
      </div>
    </header>
  );
}
