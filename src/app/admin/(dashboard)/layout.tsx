import type { ReactNode } from "react";
import { BottomNav } from "@/components/BottomNav";

// Every page under this layout reads live, per-request data behind Supabase Auth -- never
// statically prerenderable, and static generation would also require Supabase env vars to be
// present at build time, which isn't guaranteed in every deploy pipeline.
export const dynamic = "force-dynamic";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {children}
      <BottomNav />
    </div>
  );
}
