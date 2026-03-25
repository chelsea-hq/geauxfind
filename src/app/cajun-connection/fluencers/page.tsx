import { FluencersDirectory } from "@/components/cajun/FluencersDirectory";
import { cajunConnectionData } from "@/lib/cajun-connection";

export default function CajunFluencersPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 pb-16 pt-10">
      <h1 className="text-4xl text-[var(--cajun-red)]">Cajun Fluencers</h1>
      <p className="text-[var(--warm-gray)]">Featured Louisiana creators sharing Cajun recipes, products, and food culture.</p>
      <FluencersDirectory influencers={cajunConnectionData.influencers} />
    </main>
  );
}
