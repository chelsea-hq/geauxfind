import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Acadiana Alerts — Custom Food, Event & Crawfish Updates | GeauxFind",
  description: "Set custom alerts for new restaurants, live music, crawfish prices, and local events across Acadiana.",
  path: "/alerts",
});

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
