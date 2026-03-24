import Link from "next/link";
import { House, Search, MessageCircleQuestion, Calendar, UtensilsCrossed } from "lucide-react";

const items = [
  { href: "/", icon: House, label: "Home" },
  { href: "/search", icon: Search, label: "Search" },
  { href: "/this-weekend", icon: Calendar, label: "Weekend" },
  { href: "/food", icon: UtensilsCrossed, label: "Food" },
  { href: "/ask", icon: MessageCircleQuestion, label: "Ask" }
];

export function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--warm-gray)]/20 bg-[var(--cream-bg)]/95 px-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <ul className="grid grid-cols-5">
        {items.map(({ href, icon: Icon, label }) => (
          <li key={href}>
            <Link href={href} className="flex min-h-12 flex-col items-center justify-center rounded-xl py-1 text-xs text-[var(--warm-gray)] transition hover:bg-white/70 hover:text-[var(--cajun-red)]">
              <Icon className="mb-1 h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
