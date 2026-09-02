import { addStaff } from "@/lib/actions/staff";
import { TopBar } from "@/components/TopBar";
import { PageShell, Field, Input, Select, Label } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { SuggestKeyButton } from "@/components/SuggestKeyButton";

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
          <div>
            <div className="mb-1 flex items-center justify-between">
              <Label>API key</Label>
              <SuggestKeyButton inputId="apiKey-new" />
            </div>
            <Input id="apiKey-new" name="apiKey" placeholder="Leave blank to auto-generate a passphrase" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Shown once on the next screen — enter it in the Android app's Settings screen for
            this staff member's device.
          </p>
          <SubmitButton>Add staff</SubmitButton>
        </form>
      </PageShell>
    </>
  );
}
