import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, EmptyState, Badge } from "@/components/ui";
import { setDocumentTypeActive } from "@/lib/actions/documentTypes";

export default async function DocumentTypesPage() {
  const supabase = createAdminClient();
  const { data: types } = await supabase
    .from("document_types")
    .select("type_key, display_label, is_active, document_type_fields(count)")
    .order("display_label");

  return (
    <>
      <TopBar title="Document Types" />
      <PageShell>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          What staff can tag a scan as, and the fields the app should learn per type. Synced to every
          staff device via GET /api/document-types.
        </p>

        <Link
          href="/admin/document-types/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add document type
        </Link>

        {!types || types.length === 0 ? (
          <EmptyState>No document types yet — add one to let staff start tagging scans.</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {types.map((t) => {
              const fieldCount = Array.isArray(t.document_type_fields)
                ? (t.document_type_fields[0]?.count ?? 0)
                : 0;
              const toggle = setDocumentTypeActive.bind(null, t.type_key, !t.is_active);
              return (
                <Card key={t.type_key}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {t.display_label}
                      </div>
                      <div className="truncate text-xs text-zinc-400 dark:text-zinc-500">
                        {t.type_key} &middot; {fieldCount} field{fieldCount === 1 ? "" : "s"}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={t.is_active ? "green" : "zinc"}>{t.is_active ? "active" : "inactive"}</Badge>
                      <form action={toggle}>
                        <button type="submit" className="text-xs font-medium text-blue-600 dark:text-blue-400">
                          {t.is_active ? "Deactivate" : "Reactivate"}
                        </button>
                      </form>
                    </div>
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
