import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Business Dashboard | GeauxFind",
  description: "Manage your Acadiana business profile on GeauxFind.",
  path: "/business",
});

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return children;
}
