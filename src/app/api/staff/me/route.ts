import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireStaffAuth, apiAuthErrorResponse } from "@/lib/auth";
import { getAppSettings } from "@/lib/settings";

/** Resolves the real center/staff identity behind a bearer key -- the Android app's Staff Setup
 * screen calls this once (right after the key is entered) so staff never have to type a Center ID
 * or Staff ID by hand; there isn't one in this schema, only these UUIDs and free-text names. Also
 * doubles as how the admin-managed Groq key reaches devices -- pulled here at login/key-rotation
 * and cached locally only for that session (see the Android app's StaffProfileRepository). */
export async function GET(request: Request) {
  let staff;
  try {
    staff = await requireStaffAuth(request);
  } catch (e) {
    return apiAuthErrorResponse(e);
  }

  const supabase = createAdminClient();
  const [staffResult, centerResult, settings] = await Promise.all([
    supabase.from("staff").select("name").eq("id", staff.staffId).single(),
    supabase.from("centers").select("name").eq("id", staff.centerId).single(),
    getAppSettings(),
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
    groqApiKey: settings.groq_api_key,
  });
}
