"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveFailure(failureId: string) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("failure_log")
    .update({ resolved: true })
    .eq("id", failureId);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/more/failures");
}
