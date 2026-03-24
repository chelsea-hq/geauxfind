import { Search } from "lucide-react";
import Link from "next/link";

export function SearchBar() {
  return (
    <form action="/search" className="mx-auto flex max-w-3xl items-center gap-2 rounded-full bg-white p-2 shadow-xl ring-1 ring-black/5">
      <Search className="ml-3 h-5 w-5 text-[var(--warm-gray)]" />
      <input
        name="q"
        aria-label="Search Acadiana"
        placeholder="What are you looking for in Acadiana?"
        className="h-12 flex-1 bg-transparent px-2 text-[15px] outline-none"
      />
      <Link href="/search" className="rounded-full bg-[var(--cajun-red)] px-5 py-3 font-medium text-white">Geaux</Link>
    </form>
  );
}
