"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(text: string): string {
  const slug = text
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "TYPE";
}

export async function createDocumentType(formData: FormData) {
  const displayLabel = String(formData.get("display_label") ?? "").trim();
  if (!displayLabel) throw new Error("Display name is required");

  const fieldLabels = formData
    .getAll("field_label")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const supabase = createAdminClient();

  const baseKey = slugify(displayLabel);
  let typeKey = baseKey;
  let suffix = 2;
  while (true) {
    const { data } = await supabase
      .from("document_types")
      .select("type_key")
      .eq("type_key", typeKey)
      .maybeSingle();
    if (!data) break;
    typeKey = `${baseKey}_${suffix++}`;
  }

  const { error: insertTypeError } = await supabase
    .from("document_types")
    .insert({ type_key: typeKey, display_label: displayLabel });
  if (insertTypeError) throw new Error(insertTypeError.message);

  if (fieldLabels.length > 0) {
    const { error: insertFieldsError } = await supabase.from("document_type_fields").insert(
      fieldLabels.map((label, index) => ({
        type_key: typeKey,
        field_key: slugify(label),
        display_label: label,
        sort_order: index,
      })),
    );
    if (insertFieldsError) throw new Error(insertFieldsError.message);
  }

  revalidatePath("/admin/more/document-types");
  redirect("/admin/more/document-types");
}

export async function setDocumentTypeActive(typeKey: string, isActive: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("document_types")
    .update({ is_active: isActive })
    .eq("type_key", typeKey);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/more/document-types");
}
