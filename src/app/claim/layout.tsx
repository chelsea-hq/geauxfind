import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Claim Your Acadiana Business Listing | GeauxFind",
  description: "Own a local business? Claim your GeauxFind listing to verify your profile and post specials.",
  path: "/claim",
});

export default function ClaimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
