"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createCenter(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  if (!name) throw new Error("Center name is required");

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("centers")
    .insert({ name, location: location || null })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/admin/centers");
  redirect(`/admin/centers/${data.id}`);
}

export async function updateCenter(centerId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  if (!name) throw new Error("Center name is required");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("centers")
    .update({ name, location: location || null })
    .eq("id", centerId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/centers/${centerId}`);
  revalidatePath("/admin/centers");
}

export async function setCenterStatus(centerId: string, status: "active" | "inactive") {
  const supabase = createAdminClient();
  const { error } = await supabase.from("centers").update({ status }).eq("id", centerId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/centers/${centerId}`);
  revalidatePath("/admin/centers");
}
