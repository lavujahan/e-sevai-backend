"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

const FEATURE_FLAGS = ["admin_template_creation_enabled", "form_mapping_ingestion_enabled"] as const;

export async function updateSettings(formData: FormData) {
  const confidenceThreshold = Number(formData.get("confidence_threshold"));
  const sessionCodeExpiryMinutes = Number(formData.get("session_code_expiry_minutes"));

  const featureFlags = Object.fromEntries(
    FEATURE_FLAGS.map((flag) => [flag, formData.get(flag) === "on"]),
  );

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("app_settings")
    .update({
      confidence_threshold: Number.isFinite(confidenceThreshold) ? confidenceThreshold : 0.7,
      session_code_expiry_minutes: Number.isFinite(sessionCodeExpiryMinutes)
        ? sessionCodeExpiryMinutes
        : 10,
      feature_flags: featureFlags,
      updated_at: new Date().toISOString(),
    })
    .eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/more/settings");
}
