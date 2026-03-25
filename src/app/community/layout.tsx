import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Acadiana Community — Local Tips, Reviews & Hidden Gems | GeauxFind",
  description: "See tips, photos, and reviews shared by locals across Acadiana and join the GeauxFind community.",
  path: "/community",
});

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
