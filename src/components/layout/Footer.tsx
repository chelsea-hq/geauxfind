import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--bayou-gold)]/25 bg-[color:rgba(46,33,29,0.95)] text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <h3 className="font-serif text-2xl text-[var(--bayou-gold)]">GeauxFind ⚜️</h3>
          <p className="mt-2 text-sm text-white/70">AI-curated local discovery for Acadiana.</p>
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-white/50">Laissez les bons temps rouler</p>
        </div>
        <div className="space-y-2 text-sm text-white/90">
          <Link href="/about" className="hover:text-[var(--bayou-gold)]">About</Link>
          <br />
          <Link href="/this-weekend" className="hover:text-[var(--bayou-gold)]">This Weekend</Link>
          <br />
          <Link href="/ask" className="hover:text-[var(--bayou-gold)]">Ask Acadiana</Link>
        </div>
        <div className="text-sm text-white/75">
          <p className="font-semibold text-white">The Weekly Geaux</p>
          <p className="mt-2">Your Friday hit of Acadiana food, music, events, and local gems.</p>
          <p className="mt-4 text-xs text-white/50">© {new Date().getFullYear()} GeauxFind. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
