"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client (anon key) -- used only by the login page for
 * supabase.auth.signInWithPassword / signOut. */
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
