import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Submit a Cajun Recipe | GeauxFind",
  description: "Share your favorite Acadiana recipe with the GeauxFind community cookbook.",
  path: "/recipes/submit",
});

export default function SubmitRecipeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
