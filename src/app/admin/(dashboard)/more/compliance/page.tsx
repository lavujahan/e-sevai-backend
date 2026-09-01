import { createAdminClient } from "@/lib/supabase/admin";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading, Badge } from "@/components/ui";
import { looksLikeRawAadhaar } from "@/lib/aadhaar";
import type { SessionDocument } from "@/lib/types";

export default async function CompliancePage() {
  const supabase = createAdminClient();

  const { data: sessions } = await supabase
    .from("sessions")
    .select("session_id, documents")
    .limit(5000);

  let violations = 0;
  for (const s of sessions ?? []) {
    const docs = (s.documents ?? []) as SessionDocument[];
    for (const doc of docs) {
      for (const field of doc.fields ?? []) {
        if (looksLikeRawAadhaar(field.displayValue)) violations++;
      }
    }
  }

  const now = new Date().toISOString();
  const [{ count: live }, { count: expired }, { count: retrieved }] = await Promise.all([
    supabase
      .from("sessions")
      .select("session_id", { count: "exact", head: true })
      .not("code", "is", null)
      .gt("code_expires_at", now),
    supabase
      .from("sessions")
      .select("session_id", { count: "exact", head: true })
      .not("code", "is", null)
      .lte("code_expires_at", now),
    supabase.from("sessions").select("session_id", { count: "exact", head: true }).is("code", null),
  ]);

  return (
    <>
      <TopBar title="Compliance & Audit" backHref="/admin/more" />
      <PageShell>
        <Card>
          <SectionHeading>Raw Aadhaar scan</SectionHeading>
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Scanned {sessions?.length ?? 0} sessions for unmasked 12-digit Aadhaar values.
            </p>
            <Badge tone={violations === 0 ? "green" : "red"}>
              {violations === 0 ? "Clean" : `${violations} found`}
            </Badge>
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Phase 1 masks Aadhaar numbers on-device before sync, and{" "}
            <code>POST /api/sessions</code> rejects any unmasked value server-side as
            defense-in-depth. This count should always read zero.
          </p>
        </Card>

        <Card>
          <SectionHeading>Session code retention</SectionHeading>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-semibold text-amber-600 dark:text-amber-400">{live ?? 0}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Live, unread</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-zinc-500">{expired ?? 0}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Expired, unread</div>
            </div>
            <div>
              <div className="text-xl font-semibold text-emerald-600 dark:text-emerald-400">{retrieved ?? 0}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Retrieved</div>
            </div>
          </div>
        </Card>
      </PageShell>
    </>
  );
}
