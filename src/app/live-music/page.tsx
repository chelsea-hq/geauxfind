import { buildMetadata } from "@/lib/seo";
import { GUIDE_BY_CATEGORY } from "@/lib/guide-config";
import { GuidePage } from "@/components/guides/GuidePage";

const config = GUIDE_BY_CATEGORY["live-music"];

export const metadata = buildMetadata({
  title: `${config.title} in Acadiana | GeauxFind`,
  description: config.description,
  path: config.path,
});

export default function Page() {
  return <GuidePage config={config} />;
}
