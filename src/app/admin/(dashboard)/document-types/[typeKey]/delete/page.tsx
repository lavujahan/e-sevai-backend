import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { getDocumentTypeDeleteImpact, deleteDocumentType } from "@/lib/actions/documentTypes";

export default async function DeleteDocumentTypePage({
  params,
}: {
  params: Promise<{ typeKey: string }>;
}) {
  const { typeKey } = await params;
  const supabase = createAdminClient();

  const [{ data: type }, impact] = await Promise.all([
    supabase.from("document_types").select("type_key, display_label").eq("type_key", typeKey).maybeSingle(),
    getDocumentTypeDeleteImpact(typeKey),
  ]);

  if (!type) notFound();

  const deleteWithKey = deleteDocumentType.bind(null, typeKey);

  return (
    <>
      <TopBar title="Delete Document Type" backHref={`/admin/document-types/${typeKey}/edit`} />
      <PageShell>
        <Card className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/30">
          <SectionHeading>
            Permanently delete &quot;{type.display_label}&quot; ({type.type_key})?
          </SectionHeading>
          <p className="mb-3 text-sm text-red-900 dark:text-red-200">
            This cannot be undone. It will:
          </p>
          <ul className="mb-3 flex flex-col gap-1.5 text-sm text-red-900 dark:text-red-200">
            <li>
              • Delete <strong>{impact.templateCount}</strong> learned document template
              {impact.templateCount === 1 ? "" : "s"} for this type
            </li>
            <li>
              • Delete <strong>{impact.failureLogCount}</strong> failure-log entr
              {impact.failureLogCount === 1 ? "y" : "ies"} for this type
            </li>
            <li>
              • Remove this document from <strong>{impact.sessionsToStrip}</strong> session
              {impact.sessionsToStrip === 1 ? "" : "s"} that also contain other document types
              (those sessions are otherwise kept)
            </li>
            <li>
              • Fully delete <strong>{impact.sessionsToDelete}</strong> session
              {impact.sessionsToDelete === 1 ? "" : "s"} that would be left with no documents at all
            </li>
          </ul>
          <p className="text-xs text-red-800 dark:text-red-300">
            {impact.sessionsAffected === 0
              ? "No sessions currently reference this type."
              : `${impact.sessionsAffected} session${impact.sessionsAffected === 1 ? "" : "s"} total reference this type.`}
          </p>
        </Card>

        <form action={deleteWithKey}>
          <SubmitButton variant="danger">Yes, delete permanently</SubmitButton>
        </form>
      </PageShell>
    </>
  );
}
