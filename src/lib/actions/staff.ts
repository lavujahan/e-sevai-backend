"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKey, hashApiKey } from "@/lib/crypto";
import type { StaffRole } from "@/lib/types";

export async function addStaff(centerId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "field_staff") as StaffRole;
  if (!name) throw new Error("Staff name is required");

  const apiKey = generateApiKey();
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

export async function resetStaffAccess(centerId: string, staffId: string) {
  const apiKey = generateApiKey();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("staff")
    .update({ api_key_hash: hashApiKey(apiKey), api_key_last_reset_at: new Date().toISOString() })
    .eq("id", staffId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/centers/${centerId}/staff/${staffId}/edit`);
  redirect(`/admin/centers/${centerId}/staff/${staffId}/edit?newKey=${apiKey}`);
}
