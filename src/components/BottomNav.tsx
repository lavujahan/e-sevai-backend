"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Dashboard", match: (p: string) => p === "/admin", icon: HomeIcon },
  { href: "/admin/centers", label: "Centers", match: (p: string) => p.startsWith("/admin/centers"), icon: BuildingIcon },
  { href: "/admin/sessions", label: "Sessions", match: (p: string) => p.startsWith("/admin/sessions"), icon: FileIcon },
  { href: "/admin/learning/templates", label: "Learning", match: (p: string) => p.startsWith("/admin/learning"), icon: BrainIcon },
  { href: "/admin/document-types", label: "Doc Types", match: (p: string) => p.startsWith("/admin/document-types"), icon: TagIcon },
  { href: "/admin/more", label: "More", match: (p: string) => p.startsWith("/admin/more"), icon: DotsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-zinc-800 dark:bg-zinc-950/95">
      <ul className="grid grid-cols-6">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                  active ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                <Icon active={active} />
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

type IconProps = { active: boolean };

function HomeIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BuildingIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="4" y="3" width="10" height="18" rx="1" />
      <rect x="14" y="9" width="6" height="12" rx="1" />
      <path d="M7 7h1M7 11h1M7 15h1M10 7h1M10 11h1M10 15h1" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path d="M14 3v4h4" strokeLinejoin="round" />
      <path d="M8 12h8M8 16h8" strokeLinecap="round" />
    </svg>
  );
}

function BrainIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M9 4a3 3 0 0 0-3 3v.3A3 3 0 0 0 4 10v1a3 3 0 0 0 1.5 2.6A3 3 0 0 0 8 18h1V4H9Z" strokeLinejoin="round" />
      <path d="M15 4a3 3 0 0 1 3 3v.3A3 3 0 0 1 20 10v1a3 3 0 0 1-1.5 2.6A3 3 0 0 1 16 18h-1V4h0Z" strokeLinejoin="round" />
      <path d="M9 4h6M9 18h6" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M11.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v6.5a1.5 1.5 0 0 0 .44 1.06l8 8a1.5 1.5 0 0 0 2.12 0l6.5-6.5a1.5 1.5 0 0 0 0-2.12l-8-8a1.5 1.5 0 0 0-1.06-.44Z" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DotsIcon({ active }: IconProps) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
