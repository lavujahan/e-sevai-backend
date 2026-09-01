"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function reactivateFormMappingVersion(urlHash: string, versionId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase.rpc("reactivate_form_mapping_version", { p_id: versionId });
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/learning/form-mappings/${urlHash}`);
  revalidatePath("/admin/learning/form-mappings");
}

/** "Invalidate" the current mapping without promoting an older one -- the URL simply has no
 * current mapping until a device/extension learns a fresh one via POST /api/form-mappings. */
export async function invalidateCurrentFormMapping(urlHash: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("form_mappings")
    .update({ is_current: false })
    .eq("url_hash", urlHash)
    .eq("is_current", true);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/learning/form-mappings/${urlHash}`);
  revalidatePath("/admin/learning/form-mappings");
}
