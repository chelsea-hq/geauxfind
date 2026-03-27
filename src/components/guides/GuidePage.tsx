import { GuideDirectory } from "@/components/guides/GuideDirectory";
import type { GuideCategoryConfig } from "@/lib/guide-config";

export function GuidePage({ config }: { config: GuideCategoryConfig }) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-16 pt-10">
      <GuideDirectory
        category={config.category}
        title={config.title}
        description={config.description}
        icon={config.icon}
        grouping={config.grouping}
      />
    </main>
  );
}
