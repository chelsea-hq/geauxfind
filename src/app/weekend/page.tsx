import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Weekend Planner Redirect | GeauxFind",
  description: "Jump into GeauxFind's Acadiana weekend planner.",
  path: "/weekend",
});

export default function WeekendPage() {
  redirect("/plan?tab=weekend");
}
