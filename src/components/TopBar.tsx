import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";

export function TopBar({
  title,
  backHref,
}: {
  title: string;
  backHref?: string;
}) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="flex items-center gap-2 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="shrink-0 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
            aria-label="Back"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
        <h1 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
      </div>
      <SignOutButton />
    </header>
  );
}
