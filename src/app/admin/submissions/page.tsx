import { headers } from "next/headers";
import { readJsonFile } from "@/lib/community-data";
import { buildMetadata } from "@/lib/seo";
import type {
  AlertSubscription,
  BusinessClaim,
  CommunitySubmission,
} from "@/types";

export const metadata = {
  ...buildMetadata({
    title: "Submissions (Admin) | GeauxFind",
    description: "Moderation view for community submissions.",
    path: "/admin/submissions",
  }),
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type PhotoRecord = { id: string; slug: string; url: string; caption?: string; createdAt: string; placeName?: string };
type RecipeSubmission = { id: string; title: string; authorName: string; createdAt: string; summary?: string };
type CajunSubmission = { id: string; businessName: string; ownerName: string; category: string; createdAt: string };

function ok(provided: string | null): boolean {
  const secret = process.env.ADMIN_TOKEN;
  if (!secret) return false;
  return provided === secret;
}

function Unauthorized() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-3xl text-[var(--cajun-red)]">Admin — Submissions</h1>
      <p className="mt-3 text-sm text-[var(--warm-gray)]">
        Append <code className="rounded bg-[var(--cream-bg)] px-2 py-1 text-xs">?token=ADMIN_TOKEN</code> to the URL to view moderation queues. Set <code>ADMIN_TOKEN</code> in your env.
      </p>
    </main>
  );
}

function Table({ rows, columns }: { rows: Array<Record<string, unknown>>; columns: string[] }) {
  if (rows.length === 0) return <p className="text-sm text-[var(--warm-gray)]">No records.</p>;
  return (
    <div className="overflow-x-auto rounded-[12px] border border-[var(--spanish-moss)]/30 bg-white">
      <table className="min-w-full divide-y divide-[var(--spanish-moss)]/20 text-sm">
        <thead className="bg-[var(--cream-bg)] text-left">
          <tr>
            {columns.map((c) => (
              <th key={c} className="px-3 py-2 font-semibold text-[var(--cast-iron)]">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--spanish-moss)]/15">
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} className="px-3 py-2 align-top text-[var(--cast-iron)]/90">
                  {String((r as Record<string, unknown>)[c] ?? "—").slice(0, 240)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AdminSubmissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // Require either ?token=... or an X-Admin-Token header matching ADMIN_TOKEN.
  const { token } = await searchParams;
  const h = await headers();
  const headerToken = h.get("x-admin-token");
  const authorized = ok(token ?? null) || ok(headerToken);
  if (!authorized) return <Unauthorized />;

  type ClosedReport = {
    id: string;
    slug: string;
    placeName: string;
    reason: string;
    reporterEmail?: string;
    createdAt: string;
    status: "pending" | "confirmed" | "dismissed";
  };

  const [community, recipes, photos, businessClaims, cajun, alerts, closed] = await Promise.all([
    readJsonFile<CommunitySubmission[]>("community-submissions.json", []),
    readJsonFile<RecipeSubmission[]>("recipe-submissions.json", []),
    readJsonFile<PhotoRecord[]>("photo-submissions.json", []),
    readJsonFile<BusinessClaim[]>("business-claims.json", []),
    readJsonFile<CajunSubmission[]>("cajun-connection-submissions.json", []),
    readJsonFile<AlertSubscription[]>("alert-subscriptions.json", []),
    readJsonFile<ClosedReport[]>("closed-reports.json", []),
  ]);

  // Aggregate closed reports by slug so moderators see counts at a glance
  const closedAggregated = closed.reduce<Record<string, { slug: string; placeName: string; count: number; lastReportedAt: string }>>((acc, r) => {
    if (r.status === "dismissed") return acc;
    const existing = acc[r.slug];
    if (existing) {
      existing.count += 1;
      if (r.createdAt > existing.lastReportedAt) existing.lastReportedAt = r.createdAt;
    } else {
      acc[r.slug] = { slug: r.slug, placeName: r.placeName, count: 1, lastReportedAt: r.createdAt };
    }
    return acc;
  }, {});
  const closedRows = Object.values(closedAggregated)
    .sort((a, b) => b.count - a.count || b.lastReportedAt.localeCompare(a.lastReportedAt))
    .slice(0, 50);

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 pb-16 pt-10">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--moss)]">Admin</p>
        <h1 className="text-4xl font-serif text-[var(--cajun-red)]">Submissions</h1>
        <p className="text-sm text-[var(--warm-gray)]">
          All community-submitted content. Approve on disk by editing the matching JSON in <code>data/</code>, or rebuild this into a write flow behind Supabase auth later.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <a href="/api/og-healthcheck" target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--warm-gray)]/30 bg-white px-3 py-1 text-[var(--cast-iron)] hover:border-[var(--cajun-red)]">
            OG health check →
          </a>
          <a href="/api/og?title=Test&subtitle=Preview&v=test" target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--warm-gray)]/30 bg-white px-3 py-1 text-[var(--cast-iron)] hover:border-[var(--cajun-red)]">
            Preview OG card →
          </a>
          <a href="https://developers.facebook.com/tools/debug/" target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--warm-gray)]/30 bg-white px-3 py-1 text-[var(--cast-iron)] hover:border-[var(--cajun-red)]">
            FB scraper debug →
          </a>
          <a href="https://cards-dev.twitter.com/validator" target="_blank" rel="noopener noreferrer" className="rounded-full border border-[var(--warm-gray)]/30 bg-white px-3 py-1 text-[var(--cast-iron)] hover:border-[var(--cajun-red)]">
            X/Twitter validator →
          </a>
        </div>
      </header>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-2xl text-[var(--cajun-red)]">Closed-place reports ({closed.length})</h2>
          <p className="text-xs text-[var(--warm-gray)]">Aggregated by place, top {closedRows.length}</p>
        </div>
        <Table
          rows={closedRows as unknown as Array<Record<string, unknown>>}
          columns={["slug", "placeName", "count", "lastReportedAt"]}
        />
        <p className="mt-2 text-xs text-[var(--warm-gray)]">
          To confirm a closure: add the slug to <code>data/closed-businesses.json</code> entries array (with reason + source), commit, and redeploy. It will instantly disappear from every list, map, and sitemap.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-[var(--cajun-red)]">Community tips ({community.length})</h2>
        <Table
          rows={community.slice(-50).reverse() as unknown as Array<Record<string, unknown>>}
          columns={["createdAt", "type", "placeName", "authorName", "text", "moderation"]}
        />
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-[var(--cajun-red)]">Photo submissions ({photos.length})</h2>
        <Table
          rows={photos.slice(-50).reverse() as unknown as Array<Record<string, unknown>>}
          columns={["createdAt", "slug", "placeName", "caption", "url"]}
        />
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-[var(--cajun-red)]">Recipe submissions ({recipes.length})</h2>
        <Table
          rows={recipes.slice(-50).reverse() as unknown as Array<Record<string, unknown>>}
          columns={["createdAt", "title", "authorName", "summary"]}
        />
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-[var(--cajun-red)]">Business claims ({businessClaims.length})</h2>
        <Table
          rows={businessClaims.slice(-50).reverse() as unknown as Array<Record<string, unknown>>}
          columns={["createdAt", "businessName", "claimantName", "email", "role", "status"]}
        />
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-[var(--cajun-red)]">Cajun Connection submissions ({cajun.length})</h2>
        <Table
          rows={cajun.slice(-50).reverse() as unknown as Array<Record<string, unknown>>}
          columns={["createdAt", "businessName", "ownerName", "category"]}
        />
      </section>

      <section>
        <h2 className="mb-3 text-2xl text-[var(--cajun-red)]">Alert subscribers ({alerts.length})</h2>
        <Table
          rows={alerts.slice(-50).reverse() as unknown as Array<Record<string, unknown>>}
          columns={["createdAt", "email", "types"]}
        />
      </section>
    </main>
  );
}
