"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKey, hashApiKey } from "@/lib/crypto";
import type { StaffRole } from "@/lib/types";

const MIN_API_KEY_LENGTH = 6;

/** Admin can type their own API key instead of using the suggested passphrase -- blank falls
 * back to generateApiKey(); a non-blank value just needs a sane minimum length, since anything
 * hashable is valid downstream (hashApiKey/requireStaffAuth are format-agnostic). */
function resolveApiKey(formData: FormData): string {
  const custom = String(formData.get("apiKey") ?? "").trim();
  if (!custom) return generateApiKey();
  if (custom.length < MIN_API_KEY_LENGTH) {
    throw new Error(`API key must be at least ${MIN_API_KEY_LENGTH} characters`);
  }
  return custom;
}

export async function addStaff(centerId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "field_staff") as StaffRole;
  if (!name) throw new Error("Staff name is required");

  const apiKey = resolveApiKey(formData);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("staff")
    .insert({ center_id: centerId, name, role, api_key_hash: hashApiKey(apiKey) })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/centers/${centerId}`);
  redirect(`/admin/centers/${centerId}/staff/${data.id}/edit?newKey=${apiKey}`);
}

export async function updateStaff(centerId: string, staffId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "field_staff") as StaffRole;
  if (!name) throw new Error("Staff name is required");

  const supabase = createAdminClient();
  const { error } = await supabase.from("staff").update({ name, role }).eq("id", staffId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/centers/${centerId}`);
  revalidatePath(`/admin/centers/${centerId}/staff/${staffId}/edit`);
}

export async function resetStaffAccess(centerId: string, staffId: string, formData: FormData) {
  const apiKey = resolveApiKey(formData);
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("staff")
    .update({ api_key_hash: hashApiKey(apiKey), api_key_last_reset_at: new Date().toISOString() })
    .eq("id", staffId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/centers/${centerId}/staff/${staffId}/edit`);
  redirect(`/admin/centers/${centerId}/staff/${staffId}/edit?newKey=${apiKey}`);
}
