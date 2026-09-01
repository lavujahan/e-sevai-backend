import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, CardLink, EmptyState, Badge, Field, Input, Select } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import type { SessionRow, Center } from "@/lib/types";

function sessionStatus(session: Pick<SessionRow, "code" | "code_expires_at">) {
  if (!session.code) return { label: "Retrieved", tone: "green" as const };
  if (session.code_expires_at && new Date(session.code_expires_at) < new Date()) {
    return { label: "Expired", tone: "zinc" as const };
  }
  return { label: "Pending pickup", tone: "amber" as const };
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ center?: string; date?: string; status?: string; q?: string }>;
}) {
  const { center = "", date = "", status = "", q = "" } = await searchParams;
  const supabase = createAdminClient();

  const { data: centers } = await supabase.from("centers").select("id, name").order("name");

  let query = supabase
    .from("sessions")
    .select("session_id, citizen_display_name, center_id, code, code_expires_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (center) query = query.eq("center_id", center);
  if (date) {
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(`${date}T23:59:59.999`);
    query = query.gte("created_at", start.toISOString()).lte("created_at", end.toISOString());
  }
  if (q) query = query.or(`citizen_display_name.ilike.%${q}%,session_id.ilike.%${q}%`);

  const { data: sessions } = await query;
  const centerNameById = new Map((centers ?? []).map((c: Pick<Center, "id" | "name">) => [c.id, c.name]));

  const filtered = (sessions ?? []).filter((s) => {
    if (!status) return true;
    return sessionStatus(s).label.toLowerCase().replace(" ", "-") === status;
  });

  return (
    <>
      <TopBar title="Sessions" />
      <PageShell>
        <form method="get" className="flex flex-col gap-3">
          <Field label="Search (citizen name or session ID)">
            <Input name="q" defaultValue={q} placeholder="Search…" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Center">
              <Select name="center" defaultValue={center}>
                <option value="">All centers</option>
                {(centers ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" name="date" defaultValue={date} />
            </Field>
          </div>
          <Field label="Status">
            <Select name="status" defaultValue={status}>
              <option value="">All statuses</option>
              <option value="pending-pickup">Pending pickup</option>
              <option value="retrieved">Retrieved</option>
              <option value="expired">Expired</option>
            </Select>
          </Field>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Apply filters
          </button>
        </form>

        {filtered.length === 0 ? (
          <EmptyState>No sessions match these filters.</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((s) => {
              const st = sessionStatus(s);
              return (
                <CardLink key={s.session_id} href={`/admin/sessions/${s.session_id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">
                        {s.citizen_display_name || "(unnamed session)"}
                      </div>
                      <div className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {centerNameById.get(s.center_id) ?? "Unknown center"} &middot;{" "}
                        {formatDateTime(s.created_at)}
                      </div>
                    </div>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>
                </CardLink>
              );
            })}
          </div>
        )}
      </PageShell>
    </>
  );
}
