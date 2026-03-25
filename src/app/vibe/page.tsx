import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Vibe Match Redirect | GeauxFind",
  description: "Jump into GeauxFind's AI vibe match planner.",
  path: "/vibe",
});

export default function VibePage() {
  redirect("/plan?tab=vibe");
}
