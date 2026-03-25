import Link from "next/link";
import { CategoryPage } from "@/components/sections/CategoryPage";

export default function Page() {
  return (
    <>
      <div className="mx-auto mt-6 max-w-6xl px-4">
        <Link href="/recipes/submit" className="inline-flex rounded-full bg-[var(--bayou-green)] px-5 py-2 text-sm font-semibold text-white">
          Submit a Recipe
        </Link>
      </div>
      <CategoryPage type="recipes" title="Recipes" />
    </>
  );
}
