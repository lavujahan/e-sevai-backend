import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAuth, apiAuthErrorResponse } from "@/lib/auth";

/** Android's DocumentTypeRepository.syncFromBackend() calls this on app start / manual refresh and
 * caches the result in Room, so staff can keep scanning offline between syncs. */
export async function GET(request: Request) {
  try {
    await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const supabase = createAdminClient();
  const [typesResult, fieldsResult] = await Promise.all([
    supabase
      .from("document_types")
      .select("type_key, display_label")
      .eq("is_active", true)
      .order("display_label"),
    supabase
      .from("document_type_fields")
      .select("type_key, field_key, display_label, sort_order")
      .order("sort_order"),
  ]);

  if (typesResult.error) {
    return NextResponse.json({ error: typesResult.error.message }, { status: 500 });
  }
  if (fieldsResult.error) {
    return NextResponse.json({ error: fieldsResult.error.message }, { status: 500 });
  }

  const fieldsByType = new Map<string, typeof fieldsResult.data>();
  for (const field of fieldsResult.data ?? []) {
    const list = fieldsByType.get(field.type_key) ?? [];
    list.push(field);
    fieldsByType.set(field.type_key, list);
  }

  return NextResponse.json({
    types: (typesResult.data ?? []).map((type) => ({
      typeKey: type.type_key,
      displayLabel: type.display_label,
      fields: (fieldsByType.get(type.type_key) ?? []).map((field) => ({
        fieldKey: field.field_key,
        displayLabel: field.display_label,
      })),
    })),
  });
}
