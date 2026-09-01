import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAuth, apiAuthErrorResponse } from "@/lib/auth";

export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const { code } = await params;
  const supabase = createAdminClient();

  // Single UPDATE ... WHERE ... RETURNING is atomic at the row level -- this is what makes
  // "read the code once" safe without a separate TTL store (Postgres, not Redis).
  const { data, error } = await supabase
    .from("sessions")
    .update({ code: null, code_expires_at: null })
    .eq("code", code)
    .gt("code_expires_at", new Date().toISOString())
    .select("session_id, citizen_display_name, documents, field_index, created_at")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Code not found or expired" }, { status: 404 });
  }

  return NextResponse.json(data);
}
