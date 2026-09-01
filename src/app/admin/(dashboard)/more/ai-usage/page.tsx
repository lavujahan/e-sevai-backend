import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, StatCard, SectionHeading, EmptyState } from "@/components/ui";
import { BarRow } from "@/components/BarRow";
import { formatCurrencyUsd, formatDate } from "@/lib/format";

const DAYS = 14;

export default async function AiUsagePage() {
  const supabase = createAdminClient();
  const since = new Date();
  since.setDate(since.getDate() - DAYS);
  since.setHours(0, 0, 0, 0);

  const { data: rows } = await supabase
    .from("ai_usage_log")
    .select("type, tokens_used, estimated_cost, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at");

  const byDay = new Map<string, { parse: number; match: number }>();
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    byDay.set(d.toDateString(), { parse: 0, match: 0 });
  }

  let totalParse = 0;
  let totalMatch = 0;
  let totalTokens = 0;
  let totalCost = 0;
  let hasCost = false;

  for (const row of rows ?? []) {
    const key = new Date(row.created_at).toDateString();
    const bucket = byDay.get(key);
    if (bucket) bucket[row.type as "parse" | "match"]++;
    if (row.type === "parse") totalParse++;
    else totalMatch++;
    if (row.tokens_used) totalTokens += row.tokens_used;
    if (row.estimated_cost !== null) {
      hasCost = true;
      totalCost += row.estimated_cost;
    }
  }

  const days = Array.from(byDay.entries());
  const maxCount = Math.max(1, ...days.map(([, v]) => v.parse + v.match));

  return (
    <>
      <TopBar title="AI Usage & Cost" backHref="/admin/more" />
      <PageShell>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Parse calls" value={totalParse} />
          <StatCard label="Match calls" value={totalMatch} />
          <StatCard label="Tokens (match)" value={totalTokens || "—"} />
          <StatCard label="Est. cost" value={hasCost ? formatCurrencyUsd(totalCost) : "—"} />
        </div>

        <Card>
          <SectionHeading>Last {DAYS} days</SectionHeading>
          {days.every(([, v]) => v.parse + v.match === 0) ? (
            <EmptyState>No AI calls logged yet.</EmptyState>
          ) : (
            <div className="flex flex-col gap-1.5">
              {days.map(([day, v]) => (
                <BarRow key={day} label={formatDate(day)} value={v.parse + v.match} max={maxCount} />
              ))}
            </div>
          )}
        </Card>

        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Parse calls happen on-device (Phase 1) and are logged approximately when a session
          syncs; exact token/cost accounting for parse isn&apos;t available yet. Match calls run
          server-side and are logged with real token counts from Groq&apos;s response.
        </p>
      </PageShell>
    </>
  );
}
