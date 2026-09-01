import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { reactivateFormMappingVersion, invalidateCurrentFormMapping } from "@/lib/actions/formMappings";
import { formatDateTime, formatPercent } from "@/lib/format";

export default async function FormMappingDetailPage({
  params,
}: {
  params: Promise<{ urlHash: string }>;
}) {
  const { urlHash } = await params;
  const supabase = createAdminClient();

  const { data: versions } = await supabase
    .from("form_mappings")
    .select("*")
    .eq("url_hash", urlHash)
    .order("version", { ascending: false });

  if (!versions || versions.length === 0) notFound();

  const current = versions.find((v) => v.is_current);
  const latest = current ?? versions[0];
  const invalidate = invalidateCurrentFormMapping.bind(null, urlHash);

  return (
    <>
      <TopBar title="Form Mapping" backHref="/admin/learning/form-mappings" />
      <PageShell>
        <Card>
          <SectionHeading>{latest.url_pattern}</SectionHeading>
          <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
            {current ? `Current version v${current.version}` : "No current version -- invalidated"}
          </p>
          {current && (
            <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {current.fields.map((f: { field_key: string; label_selector: string; data_key: string; confidence: number }) => (
                <div key={f.field_key} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                      {f.label_selector}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">→ {f.data_key}</div>
                  </div>
                  <Badge tone={f.confidence >= 0.7 ? "green" : f.confidence >= 0.4 ? "amber" : "red"}>
                    {formatPercent(f.confidence)}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {current && (
            <form action={invalidate} className="mt-3">
              <SubmitButton variant="danger">Invalidate current mapping</SubmitButton>
            </form>
          )}
        </Card>

        <div>
          <SectionHeading>Version history</SectionHeading>
          <div className="flex flex-col gap-2">
            {versions.map((v) => {
              const reactivate = reactivateFormMappingVersion.bind(null, urlHash, v.id);
              return (
                <Card key={v.id} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      v{v.version} {v.is_current && <span className="text-emerald-600 dark:text-emerald-400">(current)</span>}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(v.created_at)} &middot; {v.fields.length} fields
                    </div>
                  </div>
                  {!v.is_current && (
                    <form action={reactivate}>
                      <SubmitButton variant="secondary">Restore</SubmitButton>
                    </form>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </PageShell>
    </>
  );
}
