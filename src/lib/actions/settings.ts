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

  const groqApiKey = String(formData.get("groq_api_key") ?? "").trim();

  const update: Record<string, unknown> = {
    confidence_threshold: Number.isFinite(confidenceThreshold) ? confidenceThreshold : 0.7,
    session_code_expiry_minutes: Number.isFinite(sessionCodeExpiryMinutes)
      ? sessionCodeExpiryMinutes
      : 10,
    feature_flags: featureFlags,
    updated_at: new Date().toISOString(),
  };
  // Left blank means "keep the current key" -- the field is never pre-filled with the real value,
  // so an accidental blank submit must not wipe an already-configured key.
  if (groqApiKey.length > 0) update.groq_api_key = groqApiKey;

  const supabase = createAdminClient();
  const { error } = await supabase.from("app_settings").update(update).eq("id", 1);

  if (error) throw new Error(error.message);

  revalidatePath("/admin/more/settings");
}
