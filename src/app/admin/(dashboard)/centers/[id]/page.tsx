import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, CardLink, SectionHeading, EmptyState, Badge, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { updateCenter, setCenterStatus } from "@/lib/actions/centers";
import { formatDate } from "@/lib/format";

export default async function CenterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createAdminClient();

  const [{ data: center }, { data: staff }, { count: totalSessions }] = await Promise.all([
    supabase.from("centers").select("*").eq("id", id).maybeSingle(),
    supabase.from("staff").select("*").eq("center_id", id).order("name"),
    supabase.from("sessions").select("session_id", { count: "exact", head: true }).eq("center_id", id),
  ]);

  if (!center) notFound();

  const updateCenterWithId = updateCenter.bind(null, id);
  const activate = setCenterStatus.bind(null, id, "active");
  const deactivate = setCenterStatus.bind(null, id, "inactive");

  return (
    <>
      <TopBar title={center.name} backHref="/admin/centers" />
      <PageShell>
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <SectionHeading>Center info</SectionHeading>
            <Badge tone={center.status === "active" ? "green" : "zinc"}>{center.status}</Badge>
          </div>
          <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">ID: {center.id}</p>
          <form action={updateCenterWithId} className="flex flex-col gap-3">
            <Field label="Name">
              <Input name="name" defaultValue={center.name} required />
            </Field>
            <Field label="Location">
              <Input name="location" defaultValue={center.location ?? ""} />
            </Field>
            <SubmitButton variant="secondary">Save changes</SubmitButton>
          </form>
          <form action={center.status === "active" ? deactivate : activate} className="mt-2">
            <SubmitButton variant={center.status === "active" ? "danger" : "primary"}>
              {center.status === "active" ? "Deactivate center" : "Reactivate center"}
            </SubmitButton>
          </form>
        </Card>

        <Card>
          <SectionHeading>Activity</SectionHeading>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {totalSessions ?? 0} total sessions synced &middot; created {formatDate(center.created_at)}
          </p>
        </Card>

        <div>
          <SectionHeading
            action={
              <Link
                href={`/admin/centers/${id}/staff/new`}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400"
              >
                + Add staff
              </Link>
            }
          >
            Staff
          </SectionHeading>
          {!staff || staff.length === 0 ? (
            <EmptyState>No staff added yet.</EmptyState>
          ) : (
            <div className="flex flex-col gap-2">
              {staff.map((s) => (
                <CardLink key={s.id} href={`/admin/centers/${id}/staff/${s.id}/edit`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-zinc-900 dark:text-zinc-50">{s.name}</span>
                    <Badge tone={s.role === "center_admin" ? "blue" : "zinc"}>{s.role.replace("_", " ")}</Badge>
                  </div>
                  <div className="truncate text-xs text-zinc-400 dark:text-zinc-500">ID: {s.id}</div>
                </CardLink>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}
