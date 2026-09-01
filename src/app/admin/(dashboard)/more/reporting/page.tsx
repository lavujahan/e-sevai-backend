import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading, StatCard, EmptyState } from "@/components/ui";
import { BarRow } from "@/components/BarRow";
import { formatDate } from "@/lib/format";
import type { SessionDocument } from "@/lib/types";

const DAYS = 14;

export default async function ReportingPage() {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - DAYS);
  since.setHours(0, 0, 0, 0);

  const [{ data: sessions }, { data: centers }] = await Promise.all([
    supabase
      .from("sessions")
      .select("session_id, center_id, documents, created_at")
      .gte("created_at", since.toISOString()),
    supabase.from("centers").select("id, name"),
  ]);

  const byDay = new Map<string, number>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toDateString(), 0);
  }

  const byCenter = new Map<string, number>();
  let totalDocuments = 0;

  for (const s of sessions ?? []) {
    const key = new Date(s.created_at).toDateString();
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
    byCenter.set(s.center_id, (byCenter.get(s.center_id) ?? 0) + 1);
    totalDocuments += ((s.documents ?? []) as SessionDocument[]).length;
  }

  const days = Array.from(byDay.entries());
  const maxDay = Math.max(1, ...days.map(([, v]) => v));

  const centerNameById = new Map((centers ?? []).map((c) => [c.id, c.name]));
  const centerRows = Array.from(byCenter.entries())
    .map(([id, count]) => ({ name: centerNameById.get(id) ?? "Unknown", count }))
    .sort((a, b) => b.count - a.count);
  const maxCenter = Math.max(1, ...centerRows.map((c) => c.count));

  return (
    <>
      <TopBar title="Reporting / Adoption" backHref="/admin/more" />
      <PageShell>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label={`Sessions (${DAYS}d)`} value={sessions?.length ?? 0} />
          <StatCard label="Documents scanned" value={totalDocuments} />
        </div>

        <Card>
          <SectionHeading>Sessions per day</SectionHeading>
          <div className="flex flex-col gap-1.5">
            {days.map(([day, count]) => (
              <BarRow key={day} label={formatDate(day)} value={count} max={maxDay} />
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading>Adoption by center ({DAYS}d)</SectionHeading>
          {centerRows.length === 0 ? (
            <EmptyState>No sessions synced in this window.</EmptyState>
          ) : (
            <div className="flex flex-col gap-1.5">
              {centerRows.map((c) => (
                <BarRow key={c.name} label={c.name} value={c.count} max={maxCenter} tone="amber" />
              ))}
            </div>
          )}
        </Card>
      </PageShell>
    </>
  );
}
