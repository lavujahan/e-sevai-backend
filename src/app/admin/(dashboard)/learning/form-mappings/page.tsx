import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, CardLink, EmptyState, Badge, Field, Input } from "@/components/ui";
import { LearningTabs } from "@/components/LearningTabs";
import { formatDate, formatPercent } from "@/lib/format";
import type { FormMappingRow } from "@/lib/types";

function avgConfidence(mapping: Pick<FormMappingRow, "fields">) {
  if (!mapping.fields || mapping.fields.length === 0) return 0;
  return mapping.fields.reduce((sum, f) => sum + f.confidence, 0) / mapping.fields.length;
}

export default async function FormMappingsListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase.from("form_mappings").select("*").eq("is_current", true).order("url_pattern");
  if (q) query = query.ilike("url_pattern", `%${q}%`);
  const { data: mappings } = await query;

  return (
    <>
      <TopBar title="Learning Data" />
      <PageShell>
        <LearningTabs active="form-mappings" />

        <form method="get">
          <Field label="Search by URL">
            <Input name="q" defaultValue={q} placeholder="e.g. incometax.gov.in" />
          </Field>
        </form>

        {!mappings || mappings.length === 0 ? (
          <EmptyState>No crowd-sourced form mappings yet.</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {mappings.map((m) => {
              const conf = avgConfidence(m);
              return (
                <CardLink key={m.id} href={`/admin/learning/form-mappings/${m.url_hash}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {m.url_pattern}
                      </div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        v{m.version} &middot; {m.fields.length} fields &middot; verified{" "}
                        {formatDate(m.last_verified)}
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
        )}
      </PageShell>
    </>
  );
}
