import { createAdminTemplate } from "@/lib/actions/templates";
import { TopBar } from "@/components/TopBar";
import { PageShell, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { DynamicFieldRows } from "@/components/DynamicFieldRows";

export default function NewTemplatePage() {
  return (
    <>
      <TopBar title="Add Template" backHref="/admin/learning/templates" />
      <PageShell>
        <form action={createAdminTemplate} className="flex flex-col gap-4">
          <Field label="Document type key">
            <Input name="doc_type" required placeholder="e.g. DRIVING_LICENSE" />
          </Field>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Seeds a fleet-wide starting template for this document type. Devices fetch it via{" "}
            <code>GET /api/templates/:doc_type</code> and keep learning on top of it.
          </p>
          <DynamicFieldRows />
          <SubmitButton>Save template</SubmitButton>
        </form>
      </PageShell>
    </>
  );
}
