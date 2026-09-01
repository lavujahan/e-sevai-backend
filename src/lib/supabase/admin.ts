import { createClient } from "@supabase/supabase-js";

/** Service-role client -- bypasses RLS. Used server-side only: by /api/* route handlers (which
 * authenticate the caller themselves via the staff bearer key, see lib/auth.ts) and by admin
 * Server Components/Server Actions (gated by middleware.ts + Supabase Auth first). Never import
 * this from a Client Component -- the service role key must never reach the browser. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
