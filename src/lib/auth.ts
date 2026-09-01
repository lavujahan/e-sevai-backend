import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiKey } from "@/lib/crypto";

export class ApiAuthError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export interface AuthenticatedStaff {
  staffId: string;
  centerId: string;
  role: string;
}

/** Authenticates /api/* requests from the Android app / Chrome extension via a per-staff
 * bearer API key -- deliberately separate from Supabase Auth, which only gates /admin/*.
 * Throws ApiAuthError on failure; callers should catch it and return apiAuthErrorResponse(e). */
export async function requireStaffAuth(request: Request): Promise<AuthenticatedStaff> {
  const header = request.headers.get("authorization") ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new ApiAuthError(401, "Missing or malformed Authorization header");
  }

  const supabase = createAdminClient();
  const { data: staff, error } = await supabase
    .from("staff")
    .select("id, center_id, role")
    .eq("api_key_hash", hashApiKey(token))
    .maybeSingle();

  if (error || !staff) {
    throw new ApiAuthError(401, "Invalid API key");
  }

  return { staffId: staff.id, centerId: staff.center_id, role: staff.role };
}

export function apiAuthErrorResponse(error: unknown): NextResponse {
  if (error instanceof ApiAuthError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  return NextResponse.json({ error: "Internal error" }, { status: 500 });
}
