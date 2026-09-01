import { createAdminClient } from "@/lib/supabase/admin";
import type { AppSettingsRow } from "@/lib/types";

const DEFAULTS: AppSettingsRow = {
  id: 1,
  confidence_threshold: 0.7,
  session_code_expiry_minutes: 10,
  feature_flags: {},
  updated_at: new Date(0).toISOString(),
};

/** Reads the singleton app_settings row, falling back to defaults if the seed row is somehow
 * missing (e.g. a fresh DB before the schema.sql insert ran). */
export async function getAppSettings(): Promise<AppSettingsRow> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
  return (data as AppSettingsRow | null) ?? DEFAULTS;
}
