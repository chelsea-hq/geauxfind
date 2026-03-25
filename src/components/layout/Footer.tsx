import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-[var(--spanish-moss)]/30 bg-[var(--cast-iron)] text-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-10 grid gap-8 md:grid-cols-[1.1fr_1fr_1fr_1.2fr]">
          <div>
            <p className="text-3xl text-[var(--sunset-gold)]">GeauxFind ⚜</p>
            <p className="mt-3 max-w-xs text-sm text-white/75">A warm guide to Acadiana’s food, music, culture, and hidden local magic.</p>
            <p className="mt-4 text-xs tracking-[0.18em] text-white/60">Made with 🐊 in Acadiana</p>
          </div>

          <div>
            <p className="text-sm tracking-[0.18em] text-[var(--sunset-gold)]">DISCOVER</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/explore" className="gf-link">Explore</Link><br />
              <Link href="/food" className="gf-link">Food</Link><br />
              <Link href="/events" className="gf-link">Events</Link>
            </div>
          </div>

          <div>
            <p className="text-sm tracking-[0.18em] text-[var(--sunset-gold)]">FEATURES</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link href="/crawfish" className="gf-link">Crawfish Guide</Link><br />
              <Link href="/vibe" className="gf-link">Vibe Match</Link><br />
              <Link href="/weekend" className="gf-link">Weekend Planner</Link>
            </div>
          </div>

          <div>
            <p className="text-sm tracking-[0.18em] text-[var(--sunset-gold)]">THE WEEKLY GEAUX</p>
            <label htmlFor="footer-newsletter" className="mt-3 block text-sm text-white/75">Get local picks in your inbox</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input id="footer-newsletter" type="email" placeholder="you@example.com" className="min-h-11 w-full rounded-[10px] border border-white/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sunset-gold)]" />
              <button type="button" className="min-h-11 w-full rounded-[10px] bg-[var(--cajun-red)] px-4 text-sm font-semibold transition-transform hover:-translate-y-0.5 active:scale-[0.98] sm:w-auto">Join</button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-white/80">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] px-3">Instagram</a>
              <a href="https://facebook.com" target="_blank" rel="noreferrer" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] px-3">Facebook</a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[10px] px-3">TikTok</a>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4 text-xs text-white/55">
          <p>© {new Date().getFullYear()} GeauxFind</p>
          <p>⚜ Laissez les bons temps rouler ⚜</p>
        </div>
      </div>
    </footer>
  );
}
