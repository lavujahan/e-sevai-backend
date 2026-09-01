import Link from "next/link";

export function LearningTabs({ active }: { active: "templates" | "form-mappings" }) {
  const tabs = [
    { key: "templates", label: "Templates", href: "/admin/learning/templates" },
    { key: "form-mappings", label: "Form Mappings", href: "/admin/learning/form-mappings" },
  ] as const;

  return (
    <div className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={tab.href}
          className={`flex-1 rounded-md py-1.5 text-center text-sm font-medium transition ${
            active === tab.key
              ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
