import { addStaff } from "@/lib/actions/staff";
import { TopBar } from "@/components/TopBar";
import { PageShell, Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: centerId } = await params;
  const addStaffToCenter = addStaff.bind(null, centerId);

  return (
    <>
      <TopBar title="Add Staff" backHref={`/admin/centers/${centerId}`} />
      <PageShell>
        <form action={addStaffToCenter} className="flex flex-col gap-4">
          <Field label="Name">
            <Input name="name" required placeholder="Staff member's name" />
          </Field>
          <Field label="Role">
            <Select name="role" defaultValue="field_staff">
              <option value="field_staff">Field staff</option>
              <option value="center_admin">Center admin</option>
            </Select>
          </Field>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            An API key will be generated on the next screen — shown once, for entry into the
            Android app's Settings screen.
          </p>
          <SubmitButton>Add staff &amp; generate key</SubmitButton>
        </form>
      </PageShell>
    </>
  );
}
