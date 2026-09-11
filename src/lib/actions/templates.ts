"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TemplateField } from "@/lib/types";

/** Parses the repeated field-row inputs from the "New Template" form (field_key[], display
 * fields, etc.) into the TemplateField[] shape stored in document_templates.fields. */
function parseFieldRows(formData: FormData): TemplateField[] {
  const keys = formData.getAll("field_key").map(String);
  const strategies = formData.getAll("position_strategy").map(String);
  const patterns = formData.getAll("pattern_or_selector").map(String);
  const confidences = formData.getAll("confidence").map(String);

  return keys
    .map((key, i) => ({
      field_key: key.trim(),
      position_strategy: strategies[i] || "LABEL_ANCHORED",
      pattern_or_selector: (patterns[i] || "").trim(),
      confidence: Number(confidences[i]) || 1,
    }))
    .filter((f) => f.field_key.length > 0);
}

export async function createAdminTemplate(formData: FormData) {
  const docType = String(formData.get("doc_type") ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (!docType) throw new Error("Document type key is required");

  const side = String(formData.get("side") ?? "FRONT").toUpperCase();

  const fields = parseFieldRows(formData);
  if (fields.length === 0) throw new Error("At least one field is required");

  const supabase = createAdminClient();
  // Admin-seeded templates always start a fresh, unfingerprinted variant group -- there's no
  // device-computed layout fingerprint to compare against for a manually-typed starting template.
  const { data, error } = await supabase
    .rpc("upsert_template_version", {
      p_doc_type: docType,
      p_side: side,
      p_fields: fields,
      p_created_by: "admin",
      p_variant_group_id: null,
      p_layout_fingerprint: null,
    })
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/learning/templates");
  redirect(`/admin/learning/templates/${docType}/${side}/${(data as { variant_group_id: string }).variant_group_id}`);
}

export async function reactivateTemplateVersion(docType: string, versionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("reactivate_template_version", { p_id: versionId });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/learning/templates/${docType}`);
  revalidatePath("/admin/learning/templates");
}
