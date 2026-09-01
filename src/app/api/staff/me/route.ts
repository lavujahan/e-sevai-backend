import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAuth, apiAuthErrorResponse } from "@/lib/auth";

/** Resolves the real center/staff identity behind a bearer key -- the Android app's Staff Setup
 * screen calls this once (right after the key is entered) so staff never have to type a Center ID
 * or Staff ID by hand; there isn't one in this schema, only these UUIDs and free-text names. */
export async function GET(request: Request) {
  let staff;
  try {
    staff = await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const supabase = createAdminClient();
  const [staffResult, centerResult] = await Promise.all([
    supabase.from("staff").select("name").eq("id", staff.staffId).single(),
    supabase.from("centers").select("name").eq("id", staff.centerId).single(),
  ]);

  if (staffResult.error) {
    return NextResponse.json({ error: staffResult.error.message }, { status: 500 });
  }
  if (centerResult.error) {
    return NextResponse.json({ error: centerResult.error.message }, { status: 500 });
  }

  return NextResponse.json({
    staffId: staff.staffId,
    staffName: staffResult.data.name,
    centerId: staff.centerId,
    centerName: centerResult.data.name,
    role: staff.role,
  });
}
