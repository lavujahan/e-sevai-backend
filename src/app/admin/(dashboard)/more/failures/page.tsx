import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading, EmptyState, Badge } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { resolveFailure } from "@/lib/actions/failures";
import { formatDateTime, formatPercent } from "@/lib/format";

export default async function FailuresPage() {
  const supabase = createAdminClient();
  const { data: failures } = await supabase
    .from("failure_log")
    .select("*")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(200);

  const groups = new Map<string, { kind: string; count: number; ids: string[]; lastAt: string }>();
  for (const f of failures ?? []) {
    const key = `${f.kind}:${f.doc_type ?? f.url_pattern ?? "unknown"}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
      existing.ids.push(f.id);
      if (f.created_at > existing.lastAt) existing.lastAt = f.created_at;
    } else {
      groups.set(key, {
        kind: f.kind,
        count: 1,
        ids: [f.id],
        lastAt: f.created_at,
      });
    }
  }
  const sorted = Array.from(groups.entries()).sort((a, b) => b[1].count - a[1].count);

  return (
    <>
      <TopBar title="Failure Reports" backHref="/admin/more" />
      <PageShell>
        {sorted.length === 0 ? (
          <EmptyState>No unresolved failures. Nice.</EmptyState>
        ) : (
          <div className="flex flex-col gap-2">
            {sorted.map(([key, group]) => {
              const label = key.split(":")[1];
              const resolveAll = async () => {
                "use server";
                await Promise.all(group.ids.map((id) => resolveFailure(id)));
              };
              return (
                <Card key={key}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-zinc-900 dark:text-zinc-50">{label}</div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Last seen {formatDateTime(group.lastAt)}
                      </div>
                    </div>
                    <Badge tone={group.kind === "extraction" ? "amber" : "blue"}>
                      {group.count} {group.count === 1 ? "occurrence" : "occurrences"}
                    </Badge>
                  </div>
                  <form action={resolveAll} className="mt-2">
                    <SubmitButton variant="secondary">Mark resolved</SubmitButton>
                  </form>
                </Card>
              );
            })}
          </div>
        )}
      </PageShell>
    </>
  );
}
