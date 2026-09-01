import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading, Badge } from "@/components/ui";
import { formatDateTime, formatPercent } from "@/lib/format";
import type { SessionDocument } from "@/lib/types";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from("sessions")
    .select("*, centers(name), staff(name)")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const documents = (session.documents ?? []) as SessionDocument[];
  const syncStatus = !session.code
    ? { label: "Retrieved by extension", tone: "green" as const }
    : session.code_expires_at && new Date(session.code_expires_at) < new Date()
      ? { label: "Code expired, unread", tone: "zinc" as const }
      : { label: "Awaiting pickup", tone: "amber" as const };

  return (
    <>
      <TopBar title="Session" backHref="/admin/sessions" />
      <PageShell>
        <Card>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold text-zinc-900 dark:text-zinc-50">
                {session.citizen_display_name || "(unnamed session)"}
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                {(session.centers as { name: string } | null)?.name ?? "Unknown center"} &middot;{" "}
                {(session.staff as { name: string } | null)?.name ?? "Unknown staff"}
              </div>
            </div>
            <Badge tone={syncStatus.tone}>{syncStatus.label}</Badge>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Session ID: <span className="font-mono">{session.session_id}</span> &middot; synced{" "}
            {formatDateTime(session.created_at)}
          </p>
        </Card>

        <div>
          <SectionHeading>Documents ({documents.length})</SectionHeading>
          <div className="flex flex-col gap-2">
            {documents.map((doc) => (
              <Card key={doc.documentId}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                    {doc.documentTypeKey}
                  </span>
                  <Badge tone={doc.extractionSource === "AI" ? "blue" : "zinc"}>
                    {doc.extractionSource}
                  </Badge>
                </div>
                <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                  {doc.fields.map((f) => (
                    <div key={f.fieldKey} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="text-zinc-500 dark:text-zinc-400">{f.fieldKey}</span>
                      <span className="truncate text-right text-zinc-900 dark:text-zinc-50">
                        {f.displayValue || "—"}
                      </span>
                      <span className="w-12 shrink-0 text-right text-xs text-zinc-400">
                        {formatPercent(f.confidence)}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </PageShell>
    </>
  );
}
