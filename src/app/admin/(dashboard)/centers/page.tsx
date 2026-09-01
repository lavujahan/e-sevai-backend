import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, CardLink, EmptyState, Badge } from "@/components/ui";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function CentersPage() {
  const supabase = createAdminClient();

  const [{ data: centers }, { data: todaySessions }] = await Promise.all([
    supabase
      .from("centers")
      .select("id, name, location, status, staff(count)")
      .order("name"),
    supabase.from("sessions").select("center_id").gte("created_at", startOfTodayIso()),
  ]);

  const todayCountByCenter = new Map<string, number>();
  for (const row of todaySessions ?? []) {
    todayCountByCenter.set(row.center_id, (todayCountByCenter.get(row.center_id) ?? 0) + 1);
  }

  return (
    <>
      <TopBar title="Centers" />
      <PageShell>
        <Link
          href="/admin/centers/new"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add center
        </Link>

        {!centers || centers.length === 0 ? (
          <EmptyState>No centers yet.</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {centers.map((c) => {
              const staffCount = Array.isArray(c.staff) ? (c.staff[0]?.count ?? 0) : 0;
              return (
                <CardLink key={c.id} href={`/admin/centers/${c.id}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">{c.name}</div>
                      {c.location && (
                        <div className="truncate text-sm text-zinc-500 dark:text-zinc-400">{c.location}</div>
                      )}
                      <div className="truncate text-xs text-zinc-400 dark:text-zinc-500">ID: {c.id}</div>
                    </div>
                    <Badge tone={c.status === "active" ? "green" : "zinc"}>{c.status}</Badge>
                  </div>
                  <div className="mt-2 flex gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                    <span>{staffCount} staff</span>
                    <span>{todayCountByCenter.get(c.id) ?? 0} sessions today</span>
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
