import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Plan Your Acadiana Adventure — AI-Powered Day & Weekend Planner | GeauxFind",
  description: "Build Cajun Country day plans, weekend itineraries, and vibe-based adventures with GeauxFind's AI planner.",
  path: "/plan",
});

export default function PlanLayout({ children }: { children: React.ReactNode }) {
  return children;
}
