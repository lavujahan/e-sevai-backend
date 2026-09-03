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

  revalidatePath("/admin/document-types");
  redirect("/admin/document-types");
}

export async function setDocumentTypeActive(typeKey: string, isActive: boolean) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("document_types")
    .update({ is_active: isActive })
    .eq("type_key", typeKey);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/document-types");
}

/** `type_key` and each field's `field_key` are immutable (slugified once at creation) -- changing
 * either would silently orphan historical data keyed by those strings (learned document_templates
 * rows, session field_index entries). Only display_label and the field set are editable here. */
export async function updateDocumentType(typeKey: string, formData: FormData) {
  const displayLabel = String(formData.get("display_label") ?? "").trim();
  if (!displayLabel) throw new Error("Display name is required");

  const supabase = createAdminClient();

  const { error: updateTypeError } = await supabase
    .from("document_types")
    .update({ display_label: displayLabel })
    .eq("type_key", typeKey);
  if (updateTypeError) throw new Error(updateTypeError.message);

  const { data: existingFields, error: existingError } = await supabase
    .from("document_type_fields")
    .select("id")
    .eq("type_key", typeKey);
  if (existingError) throw new Error(existingError.message);
  const existingIds = (existingFields ?? []).map((f) => f.id as string);

  const fieldIds = formData.getAll("field_id").map((v) => String(v));
  const fieldLabels = formData.getAll("field_label").map((v) => String(v).trim());

  const keptIds: string[] = [];
  const newLabels: { label: string; sortOrder: number }[] = [];
  const updates: { id: string; label: string; sortOrder: number }[] = [];

  fieldLabels.forEach((label, index) => {
    if (!label) return;
    const id = fieldIds[index];
    if (id) {
      keptIds.push(id);
      updates.push({ id, label, sortOrder: index });
    } else {
      newLabels.push({ label, sortOrder: index });
    }
  });

  for (const u of updates) {
    const { error } = await supabase
      .from("document_type_fields")
      .update({ display_label: u.label, sort_order: u.sortOrder })
      .eq("id", u.id);
    if (error) throw new Error(error.message);
  }

  if (newLabels.length > 0) {
    const { error } = await supabase.from("document_type_fields").insert(
      newLabels.map((f) => ({
        type_key: typeKey,
        field_key: slugify(f.label),
        display_label: f.label,
        sort_order: f.sortOrder,
      })),
    );
    if (error) throw new Error(error.message);
  }

  // Diff against the pre-update snapshot (existingIds), not the newly-inserted rows above --
  // otherwise a brand-new field's fresh id (never in keptIds, since keptIds only tracks
  // resubmitted *existing* ids) would be deleted the instant after it was inserted.
  const idsToDelete = existingIds.filter((id) => !keptIds.includes(id));
  if (idsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("document_type_fields")
      .delete()
      .in("id", idsToDelete);
    if (deleteError) throw new Error(deleteError.message);
  }

  revalidatePath("/admin/document-types");
  revalidatePath(`/admin/document-types/${typeKey}/edit`);
}

export async function deleteDocumentType(typeKey: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.from("document_types").delete().eq("type_key", typeKey);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/document-types");
  redirect("/admin/document-types");
}
