import Link from "next/link";

export function CulturalTraditionsCallout() {
  return (
    <aside
      aria-label="Cajun, Creole, and Zydeco musical traditions explained"
      className="rounded-[12px] border border-[var(--spanish-moss)]/30 bg-[var(--cream-bg)] p-5"
    >
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--moss)]">Know the difference</p>
      <h2 className="mt-1 text-xl font-serif text-[var(--cast-iron)]">Cajun, Creole, Zydeco — not the same thing</h2>
      <p className="mt-2 text-sm text-[var(--cast-iron)]/85">
        In Acadiana these traditions share rhythms and dance floors, but they come from different people and sound different
        once you know what to listen for. Most guides blur them into &ldquo;Cajun music&rdquo; — we don&apos;t.
      </p>
      <dl className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-[10px] border border-[var(--spanish-moss)]/25 bg-white p-3">
          <dt className="text-sm font-semibold text-[var(--cajun-red)]">Cajun</dt>
          <dd className="mt-1 text-xs text-[var(--cast-iron)]/85">
            Fiddle-and-accordion music from exiled Acadians. French lyrics, two-step and waltz, Saturday night dance halls.
          </dd>
          <Link href="/live-music/tonight" className="mt-2 inline-block text-xs font-semibold text-[var(--cajun-red)] underline">
            Cajun shows tonight →
          </Link>
        </div>
        <div className="rounded-[10px] border border-[var(--spanish-moss)]/25 bg-white p-3">
          <dt className="text-sm font-semibold text-[var(--cajun-red)]">Creole</dt>
          <dd className="mt-1 text-xs text-[var(--cast-iron)]/85">
            Louisiana Creoles of color — music rooted in Afro-Caribbean rhythms, French &amp; Kouri-Vini lyrics, the source of zydeco.
          </dd>
          <Link href="/cajun-connection" className="mt-2 inline-block text-xs font-semibold text-[var(--cajun-red)] underline">
            Creole culture on GeauxFind →
          </Link>
        </div>
        <div className="rounded-[10px] border border-[var(--spanish-moss)]/25 bg-white p-3">
          <dt className="text-sm font-semibold text-[var(--cajun-red)]">Zydeco</dt>
          <dd className="mt-1 text-xs text-[var(--cast-iron)]/85">
            Creole-rooted, fused with R&amp;B, blues, and soul. Accordion + rubboard, electric, and made for dancing hard.
          </dd>
          <Link href="/live-music/this-weekend" className="mt-2 inline-block text-xs font-semibold text-[var(--cajun-red)] underline">
            Zydeco this weekend →
          </Link>
        </div>
      </dl>
    </aside>
  );
}
