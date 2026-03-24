import Link from "next/link";

const categories = [
  ["Food & Drink 🍽️", "/food"],
  ["Events & Festivals 🎪", "/events"],
  ["Music & Nightlife 🎵", "/music"],
  ["Recipes 🧑‍🍳", "/recipes"],
  ["Local Finds 📍", "/finds"]
];

export function CategoryNav() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      {categories.map(([label, href]) => (
        <Link
          key={href}
          href={href}
          className="rounded-2xl border border-[var(--cajun-red)]/20 bg-[var(--cream-bg)] p-4 text-center font-medium text-[var(--cast-iron)] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[var(--cajun-red)]/40 hover:bg-white hover:shadow-md"
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
