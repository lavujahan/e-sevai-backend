import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, Field, Input, Select } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updateStaff, resetStaffAccess } from "@/lib/actions/staff";
import { formatDateTime } from "@/lib/format";

export default async function EditStaffPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; staffId: string }>;
  searchParams: Promise<{ newKey?: string }>;
}) {
  const { id: centerId, staffId } = await params;
  const { newKey } = await searchParams;

  const supabase = createAdminClient();
  const { data: staff } = await supabase.from("staff").select("*").eq("id", staffId).maybeSingle();
  if (!staff) notFound();

  const updateStaffWithIds = updateStaff.bind(null, centerId, staffId);
  const resetAccessWithIds = resetStaffAccess.bind(null, centerId, staffId);

  return (
    <>
      <TopBar title="Edit Staff" backHref={`/admin/centers/${centerId}`} />
      <PageShell>
        {newKey && (
          <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30">
            <p className="mb-1 text-sm font-semibold text-amber-900 dark:text-amber-200">
              New API key — copy it now
            </p>
            <p className="mb-2 break-all rounded bg-white px-2 py-1.5 font-mono text-sm text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
              {newKey}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              This won&apos;t be shown again. Enter it in the Android app&apos;s Settings screen for
              this staff member&apos;s device.
            </p>
          </Card>
        )}

        <Card>
          <form action={updateStaffWithIds} className="flex flex-col gap-3">
            <Field label="Name">
              <Input name="name" defaultValue={staff.name} required />
            </Field>
            <Field label="Role">
              <Select name="role" defaultValue={staff.role}>
                <option value="field_staff">Field staff</option>
                <option value="center_admin">Center admin</option>
              </Select>
            </Field>
            <SubmitButton variant="secondary">Save changes</SubmitButton>
          </form>
        </Card>

        <Card>
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            Key last reset {formatDateTime(staff.api_key_last_reset_at)}
          </p>
          <form action={resetAccessWithIds}>
            <SubmitButton variant="danger">Reset access (new API key)</SubmitButton>
          </form>
        </Card>
      </PageShell>
    </>
  );
}
