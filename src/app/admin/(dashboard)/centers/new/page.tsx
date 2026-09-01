import { createCenter } from "@/lib/actions/centers";
import { TopBar } from "@/components/TopBar";
import { PageShell, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default function NewCenterPage() {
  return (
    <>
      <TopBar title="Add Center" backHref="/admin/centers" />
      <PageShell>
        <form action={createCenter} className="flex flex-col gap-4">
          <Field label="Center name">
            <Input name="name" required placeholder="e.g. Ranchi CSC #4" />
          </Field>
          <Field label="Location">
            <Input name="location" placeholder="e.g. Ranchi, Jharkhand" />
          </Field>
          <SubmitButton>Create center</SubmitButton>
        </form>
      </PageShell>
    </>
  );
}
