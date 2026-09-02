import { getAppSettings } from "@/lib/settings";
import { updateSettings } from "@/lib/actions/settings";
import { TopBar } from "@/components/TopBar";
import { PageShell, Card, SectionHeading, Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";

function maskKey(key: string | undefined) {
  if (!key) return null;
  return `${"•".repeat(Math.max(key.length - 4, 4))}${key.slice(-4)}`;
}

export default async function SettingsPage() {
  const settings = await getAppSettings();
  const groqKey = maskKey(settings.groq_api_key ?? undefined);

  return (
    <>
      <TopBar title="System Settings" backHref="/admin/more" />
      <PageShell>
        <form action={updateSettings}>
          <Card className="mb-6 flex flex-col gap-4">
            <SectionHeading>Groq API key</SectionHeading>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Shared by every staff device for AI-assisted extraction -- pulled at login and
              cleared from the device on logout, so staff never enter or see it themselves.
            </p>
            <Field label={groqKey ? `Currently set (${groqKey})` : "Not configured"}>
              <Input name="groq_api_key" type="password" placeholder="Leave blank to keep the current key" />
            </Field>

            <SectionHeading>Thresholds</SectionHeading>
            <Field label="Confidence threshold (0-1)">
              <Input
                name="confidence_threshold"
                type="number"
                step="0.05"
                min="0"
                max="1"
                defaultValue={settings.confidence_threshold}
              />
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Extractions/matches below this confidence are logged to Failure Reports.
              </p>
            </Field>
            <Field label="Session code expiry (minutes)">
              <Input
                name="session_code_expiry_minutes"
                type="number"
                min="1"
                max="120"
                defaultValue={settings.session_code_expiry_minutes}
              />
            </Field>

            <SectionHeading>Feature flags</SectionHeading>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="admin_template_creation_enabled"
                defaultChecked={settings.feature_flags.admin_template_creation_enabled ?? true}
              />
              Allow admin-authored templates
            </label>
            <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                name="form_mapping_ingestion_enabled"
                defaultChecked={settings.feature_flags.form_mapping_ingestion_enabled ?? true}
              />
              Accept form-mapping submissions (Phase 3)
            </label>

            <SubmitButton>Save settings</SubmitButton>
          </Card>
        </form>
      </PageShell>
    </>
  );
}
