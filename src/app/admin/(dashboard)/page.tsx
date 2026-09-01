import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, StatCard, SectionHeading, EmptyState, Card, Badge } from "@/components/ui";
import { formatCurrencyUsd, formatDateTime } from "@/lib/format";

function startOfTodayIso() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function startOfMonthIso() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function DashboardPage() {
  const supabase = createAdminClient();

  const [{ count: todaySessions }, { count: activeCenters }, { count: pendingFailures }, { data: usageRows }, { data: recentFailures }] =
    await Promise.all([
      supabase
        .from("sessions")
        .select("session_id", { count: "exact", head: true })
        .gte("created_at", startOfTodayIso()),
      supabase
        .from("centers")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("failure_log")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false),
      supabase
        .from("ai_usage_log")
        .select("estimated_cost")
        .gte("created_at", startOfMonthIso()),
      supabase
        .from("failure_log")
        .select("id, kind, doc_type, url_pattern, field_key, confidence, created_at")
        .eq("resolved", false)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  const monthCost = (usageRows ?? []).reduce((sum, r) => sum + (r.estimated_cost ?? 0), 0);
  const hasCostData = (usageRows ?? []).some((r) => r.estimated_cost !== null);

  return (
    <>
      <TopBar title="Dashboard" />
      <PageShell>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Sessions today" value={todaySessions ?? 0} href="/admin/sessions" />
          <StatCard label="Active centers" value={activeCenters ?? 0} href="/admin/centers" />
          <StatCard
            label="Needs attention"
            value={pendingFailures ?? 0}
            href="/admin/more/failures"
          />
          <StatCard
            label="AI cost (month)"
            value={hasCostData ? formatCurrencyUsd(monthCost) : "—"}
            href="/admin/more/ai-usage"
          />
        </div>

        <div>
          <SectionHeading action={<Link href="/admin/more/failures" className="text-xs font-semibold text-blue-600 dark:text-blue-400">View all</Link>}>
            Needs attention
          </SectionHeading>
          {!recentFailures || recentFailures.length === 0 ? (
            <EmptyState>Nothing flagged right now.</EmptyState>
          ) : (
            <div className="flex flex-col gap-2">
              {recentFailures.map((f) => (
                <Card key={f.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {f.doc_type ?? f.url_pattern ?? f.field_key ?? "Unknown"}
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(f.created_at)}
                    </div>
                  </div>
                  <Badge tone={f.kind === "extraction" ? "amber" : "blue"}>{f.kind}</Badge>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageShell>
    </>
  );
}
