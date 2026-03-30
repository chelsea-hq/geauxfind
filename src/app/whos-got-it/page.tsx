import { buildMetadata } from "@/lib/seo";
import { GUIDE_BY_CATEGORY } from "@/lib/guide-config";
import WhosGotItPage from "./WhosGotItPage";

const config = GUIDE_BY_CATEGORY["whos-got-it"];

export const metadata = buildMetadata({
  title: `${config.title} in Acadiana | GeauxFind`,
  description: config.description,
  path: config.path,
});

export default function Page() {
  return <WhosGotItPage />;
}
