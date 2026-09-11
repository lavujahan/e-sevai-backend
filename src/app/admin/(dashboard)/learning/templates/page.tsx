import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, CardLink, Card, EmptyState, Badge } from "@/components/ui";
import { LearningTabs } from "@/components/LearningTabs";
import { formatDate, formatPercent } from "@/lib/format";
import type { DocumentTemplateRow } from "@/lib/types";

function avgConfidence(template: Pick<DocumentTemplateRow, "fields">) {
  if (!template.fields || template.fields.length === 0) return 0;
  return template.fields.reduce((sum, f) => sum + f.confidence, 0) / template.fields.length;
}

export default async function TemplatesListPage() {
  const supabase = createAdminClient();
  const { data: templates } = await supabase
    .from("document_templates")
    .select("*")
    .eq("is_current", true)
    .order("doc_type")
    .order("side")
    .order("created_at");

  // Group by (doc_type, side) -- a doc type's front/back can each now have more than one learned
  // variant (different physical layouts) coexisting fleet-wide, not just one "current" row.
  const groups = new Map<string, DocumentTemplateRow[]>();
  for (const t of (templates as DocumentTemplateRow[] | null) ?? []) {
    const key = `${t.doc_type}::${t.side}`;
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }

  return (
    <>
      <TopBar title="Learning Data" />
      <PageShell>
        <LearningTabs active="templates" />

        <Link
          href="/admin/learning/templates/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add template
        </Link>

        {groups.size === 0 ? (
          <EmptyState>No learned templates yet.</EmptyState>
        ) : (
          <div className="flex flex-col gap-3">
            {Array.from(groups.entries()).map(([key, variants]) => {
              const [docType, side] = key.split("::");
              return (
                <Card key={key}>
                  <div className="mb-2 flex items-center gap-2">
                    <div className="font-medium text-zinc-900 dark:text-zinc-50">{docType}</div>
                    <Badge tone={side === "FRONT" ? "blue" : "zinc"}>{side}</Badge>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {variants.map((t, i) => {
                      const conf = avgConfidence(t);
                      return (
                        <CardLink
                          key={t.id}
                          href={`/admin/learning/templates/${docType}/${side}/${t.variant_group_id}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                Variant {i + 1}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                                v{t.layout_version} &middot; {t.fields.length} fields &middot; verified{" "}
                                {formatDate(t.last_verified)}
                              </div>
                            </div>
                            <Badge tone={conf >= 0.7 ? "green" : conf >= 0.4 ? "amber" : "red"}>
                              {formatPercent(conf)}
                            </Badge>
                          </div>
                        </CardLink>
                      );
                    })}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </PageShell>
    </>
  );
}
