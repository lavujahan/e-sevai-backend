import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading, Field, Input, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { DocTypeFieldRows } from "@/components/DocTypeFieldRows";
import { updateDocumentType, setDocumentTypeActive } from "@/lib/actions/documentTypes";

export default async function EditDocumentTypePage({
  params,
}: {
  params: Promise<{ typeKey: string }>;
}) {
  const { typeKey } = await params;
  const supabase = createAdminClient();

  const [{ data: type }, { data: fields }] = await Promise.all([
    supabase.from("document_types").select("*").eq("type_key", typeKey).maybeSingle(),
    supabase
      .from("document_type_fields")
      .select("id, display_label, description, format_regex, sensitive")
      .eq("type_key", typeKey)
      .order("sort_order"),
  ]);

  if (!type) notFound();

  const updateWithKey = updateDocumentType.bind(null, typeKey);
  const toggleActive = setDocumentTypeActive.bind(null, typeKey, !type.is_active);

  return (
    <>
      <TopBar title="Edit Document Type" backHref="/admin/document-types" />
      <PageShell>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionHeading>Type info</SectionHeading>
            <Badge tone={type.is_active ? "green" : "zinc"}>{type.is_active ? "active" : "inactive"}</Badge>
          </div>
          <form action={updateWithKey} className="flex flex-col gap-3">
            <Field label="Display name">
              <Input name="display_label" defaultValue={type.display_label} required />
            </Field>
            <div>
              <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Type key</p>
              <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                {type.type_key}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Fixed once created — templates and synced sessions already reference this key.
              </p>
            </div>
            <Field label="Expected fields">
              <DocTypeFieldRows initialFields={fields ?? []} />
            </Field>
            <SubmitButton>Save changes</SubmitButton>
          </form>
        </Card>

        <Card>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            {type.is_active
              ? "Staff devices can currently tag scans with this type."
              : "Hidden from staff devices — existing data referencing it is unaffected."}
          </p>
          <form action={toggleActive}>
            <SubmitButton variant="secondary">{type.is_active ? "Deactivate" : "Reactivate"}</SubmitButton>
          </form>
        </Card>

        <Card>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            Permanently deletes this type, its learned templates, and cleans up any sessions that
            reference it. Shows exactly what will be affected before anything is removed.
          </p>
          <Link
            href={`/admin/document-types/${typeKey}/delete`}
            className="block w-full rounded-lg bg-red-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-red-700"
          >
            Delete permanently
          </Link>
        </Card>
      </PageShell>
    </>
  );
}
