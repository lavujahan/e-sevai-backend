import { createDocumentType } from "@/lib/actions/documentTypes";
import { TopBar } from "@/components/TopBar";
import { PageShell, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { DocTypeFieldRows } from "@/components/DocTypeFieldRows";

export default function NewDocumentTypePage() {
  return (
    <>
      <TopBar title="Add Document Type" backHref="/admin/more/document-types" />
      <PageShell>
        <form action={createDocumentType} className="flex flex-col gap-4">
          <Field label="Display name">
            <Input name="display_label" required placeholder="e.g. Driving License" />
          </Field>
          <Field label="Expected fields">
            <DocTypeFieldRows />
          </Field>
          <SubmitButton>Create document type</SubmitButton>
        </form>
      </PageShell>
    </>
  );
}
