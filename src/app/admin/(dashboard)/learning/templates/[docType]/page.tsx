import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { reactivateTemplateVersion } from "@/lib/actions/templates";
import { formatDateTime, formatPercent } from "@/lib/format";

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { docType } = await params;
  const supabase = createAdminClient();

  const { data: versions } = await supabase
    .from("document_templates")
    .select("*")
    .eq("doc_type", docType)
    .order("layout_version", { ascending: false });

  if (!versions || versions.length === 0) notFound();

  const current = versions.find((v) => v.is_current) ?? versions[0];

  return (
    <>
      <TopBar title={docType} backHref="/admin/learning/templates" />
      <PageShell>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionHeading>Current version (v{current.layout_version})</SectionHeading>
            <Badge tone={current.created_by === "admin" ? "blue" : "zinc"}>{current.created_by}</Badge>
          </div>
          <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {current.fields.map((f: { field_key: string; position_strategy: string; confidence: number }) => (
              <div key={f.field_key} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div>
                  <div className="font-medium text-zinc-900 dark:text-zinc-50">{f.field_key}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">{f.position_strategy}</div>
                </div>
                <Badge tone={f.confidence >= 0.7 ? "green" : f.confidence >= 0.4 ? "amber" : "red"}>
                  {formatPercent(f.confidence)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <div>
          <SectionHeading>Version history</SectionHeading>
          <div className="flex flex-col gap-2">
            {versions.map((v) => {
              const reactivate = reactivateTemplateVersion.bind(null, docType, v.id);
              return (
                <Card key={v.id} className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      v{v.layout_version} {v.is_current && <span className="text-emerald-600 dark:text-emerald-400">(current)</span>}
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
