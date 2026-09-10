"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppSettings } from "@/lib/settings";
import { deriveFieldRegex, type FieldRegexSuggestion } from "@/lib/groq";
import { buildFieldIndex } from "@/lib/fieldIndex";
import type { SessionDocument } from "@/lib/types";

function slugify(text: string): string {
  const slug = text
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return slug || "TYPE";
}

/** Called directly from the "Suggest regex" button in DocTypeFieldRows (a Server Action invoked
 * as a plain async call, not a form submit) -- the caller always shows the result for the admin to
 * review/edit before it ever reaches a form field, per the plan's "AI-derived regex is
 * admin-reviewed, never auto-applied" decision. */
export async function suggestFieldRegex(
  label: string,
  description: string,
): Promise<FieldRegexSuggestion | { error: string }> {
  const settings = await getAppSettings();
  const apiKey = settings.groq_api_key ?? process.env.GROQ_API_KEY;
  if (!apiKey) return { error: "Groq API key is not configured" };
  try {
    return await deriveFieldRegex(label, description, apiKey);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Regex suggestion failed" };
  }
}

export async function createDocumentType(formData: FormData) {
  const displayLabel = String(formData.get("display_label") ?? "").trim();
  if (!displayLabel) throw new Error("Display name is required");

  const fieldLabels = formData.getAll("field_label").map((v) => String(v).trim());
  const fieldDescriptions = formData.getAll("field_description").map((v) => String(v).trim());
  const fieldRegexes = formData.getAll("field_regex").map((v) => String(v).trim());
  const fieldSensitive = formData.getAll("field_sensitive").map((v) => String(v) === "true");

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

  const fieldsToInsert = fieldLabels
    .map((label, index) => ({
      type_key: typeKey,
      field_key: slugify(label),
      display_label: label,
      description: fieldDescriptions[index] || null,
      format_regex: fieldRegexes[index] || null,
      sensitive: fieldSensitive[index] ?? false,
      sort_order: index,
    }))
    .filter((f) => f.display_label.length > 0);

  if (fieldsToInsert.length > 0) {
    const { error: insertFieldsError } = await supabase.from("document_type_fields").insert(fieldsToInsert);
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
 * rows, session field_index entries). Only display_label and the field set are editable here.
 *
 * No document type is built-in -- every type goes through this same path, fully admin-managed. */
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
  const fieldDescriptions = formData.getAll("field_description").map((v) => String(v).trim());
  const fieldRegexes = formData.getAll("field_regex").map((v) => String(v).trim());
  const fieldSensitive = formData.getAll("field_sensitive").map((v) => String(v) === "true");

  const keptIds: string[] = [];
  const newFields: { label: string; description: string; regex: string; sensitive: boolean; sortOrder: number }[] = [];
  const updates: { id: string; label: string; description: string; regex: string; sensitive: boolean; sortOrder: number }[] = [];

  fieldLabels.forEach((label, index) => {
    if (!label) return;
    const id = fieldIds[index];
    const description = fieldDescriptions[index] ?? "";
    const regex = fieldRegexes[index] ?? "";
    const sensitive = fieldSensitive[index] ?? false;
    if (id) {
      keptIds.push(id);
      updates.push({ id, label, description, regex, sensitive, sortOrder: index });
    } else {
      newFields.push({ label, description, regex, sensitive, sortOrder: index });
    }
  });

  for (const u of updates) {
    const { error } = await supabase
      .from("document_type_fields")
      .update({
        display_label: u.label,
        description: u.description || null,
        format_regex: u.regex || null,
        sensitive: u.sensitive,
        sort_order: u.sortOrder,
      })
      .eq("id", u.id);
    if (error) throw new Error(error.message);
  }

  if (newFields.length > 0) {
    const { error } = await supabase.from("document_type_fields").insert(
      newFields.map((f) => ({
        type_key: typeKey,
        field_key: slugify(f.label),
        display_label: f.label,
        description: f.description || null,
        format_regex: f.regex || null,
        sensitive: f.sensitive,
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

export interface DocumentTypeDeleteImpact {
  templateCount: number;
  sessionsAffected: number;
  sessionsToDelete: number;
  sessionsToStrip: number;
  failureLogCount: number;
}

async function findAffectedSessions(supabase: ReturnType<typeof createAdminClient>, typeKey: string) {
  // .contains() doesn't serialize a jsonb-array-of-objects filter correctly here -- passing the
  // same containment value as an explicit JSON string via .filter(...,'cs',...) is what PostgREST
  // expects for a jsonb column.
  const { data, error } = await supabase
    .from("sessions")
    .select("session_id, documents, field_index")
    .filter("documents", "cs", JSON.stringify([{ documentTypeKey: typeKey }]));
  if (error) throw new Error(error.message);
  return (data ?? []) as { session_id: string; documents: SessionDocument[]; field_index: unknown }[];
}

/** Read-only preview for the delete confirmation page -- computed the same way the actual cascade
 * in deleteDocumentType classifies sessions, so the counts shown match what will actually happen. */
export async function getDocumentTypeDeleteImpact(typeKey: string): Promise<DocumentTypeDeleteImpact> {
  const supabase = createAdminClient();

  const [{ count: templateCount }, { count: failureLogCount }, affectedSessions] = await Promise.all([
    supabase.from("document_templates").select("id", { count: "exact", head: true }).eq("doc_type", typeKey),
    supabase.from("failure_log").select("id", { count: "exact", head: true }).eq("doc_type", typeKey),
    findAffectedSessions(supabase, typeKey),
  ]);

  const sessionsToDelete = affectedSessions.filter((s) =>
    s.documents.every((d) => d.documentTypeKey === typeKey),
  ).length;

  return {
    templateCount: templateCount ?? 0,
    sessionsAffected: affectedSessions.length,
    sessionsToDelete,
    sessionsToStrip: affectedSessions.length - sessionsToDelete,
    failureLogCount: failureLogCount ?? 0,
  };
}

/**
 * Deleting a type cascades: its learned templates and type-level failure-log rows are removed
 * outright; sessions that reference it are trimmed (only the matching document is stripped, the
 * rest of the session survives) unless that was its only document, in which case the whole
 * session is removed. failure_log.session_id has no ON DELETE action, so any failure-log rows for
 * a session being fully removed must be cleared first or the delete violates that FK.
 */
export async function deleteDocumentType(typeKey: string) {
  const supabase = createAdminClient();

  const { error: templatesError } = await supabase
    .from("document_templates")
    .delete()
    .eq("doc_type", typeKey);
  if (templatesError) throw new Error(templatesError.message);

  const { error: failureError } = await supabase.from("failure_log").delete().eq("doc_type", typeKey);
  if (failureError) throw new Error(failureError.message);

  const affectedSessions = await findAffectedSessions(supabase, typeKey);

  const sessionIdsToDelete: string[] = [];
  const sessionsToUpdate: { session_id: string; documents: SessionDocument[] }[] = [];

  for (const s of affectedSessions) {
    const remainingDocs = s.documents.filter((d) => d.documentTypeKey !== typeKey);
    if (remainingDocs.length === 0) {
      sessionIdsToDelete.push(s.session_id);
    } else {
      sessionsToUpdate.push({ session_id: s.session_id, documents: remainingDocs });
    }
  }

  if (sessionIdsToDelete.length > 0) {
    const { error: sessionFailureError } = await supabase
      .from("failure_log")
      .delete()
      .in("session_id", sessionIdsToDelete);
    if (sessionFailureError) throw new Error(sessionFailureError.message);

    const { error: sessionDeleteError } = await supabase
      .from("sessions")
      .delete()
      .in("session_id", sessionIdsToDelete);
    if (sessionDeleteError) throw new Error(sessionDeleteError.message);
  }

  for (const s of sessionsToUpdate) {
    const { error } = await supabase
      .from("sessions")
      .update({ documents: s.documents, field_index: buildFieldIndex(s.documents) })
      .eq("session_id", s.session_id);
    if (error) throw new Error(error.message);
  }

  const { error } = await supabase.from("document_types").delete().eq("type_key", typeKey);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/document-types");
  revalidatePath("/admin/sessions");
  redirect("/admin/document-types");
}
