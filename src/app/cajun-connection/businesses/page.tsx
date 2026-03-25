import { BusinessesDirectory } from "@/components/cajun/BusinessesDirectory";
import { cajunConnectionData } from "@/lib/cajun-connection";

export default function CajunBusinessesPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-10">
      <h1 className="text-4xl text-[var(--cajun-red)]">Cajun Businesses</h1>
      <p className="text-[var(--warm-gray)]">Discover local seasonings, supplies, products, and food vendors across Acadiana.</p>
      <BusinessesDirectory businesses={cajunConnectionData.businesses} />
    </main>
  );
}
