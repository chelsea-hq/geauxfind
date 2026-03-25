import Link from "next/link";

export type RelatedLink = { href: string; label: string; description?: string };

export function RelatedLinks({ title = "You might also like", links }: { title?: string; links: RelatedLink[] }) {
  if (!links.length) return null;

  return (
    <section className="mt-10 rounded-2xl border border-[var(--spanish-moss)]/25 bg-white p-5">
      <h2 className="text-2xl text-[var(--cajun-red)]">{title}</h2>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="block rounded-xl border border-[var(--warm-gray)]/20 bg-[var(--cream-bg)] p-3 hover:border-[var(--cajun-red)]/40">
              <p className="font-semibold">{link.label}</p>
              {link.description ? <p className="text-sm text-[var(--warm-gray)]">{link.description}</p> : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
