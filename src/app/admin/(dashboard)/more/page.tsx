import { TopBar } from "@/components/TopBar";
import { PageShell, CardLink } from "@/components/ui";

const ITEMS = [
  { href: "/admin/more/ai-usage", label: "AI Usage & Cost", desc: "Groq call volume, cost, parse vs match" },
  { href: "/admin/more/failures", label: "Failure Reports", desc: "Documents/forms needing manual correction" },
  { href: "/admin/more/compliance", label: "Compliance & Audit", desc: "Aadhaar storage check, code retention" },
  { href: "/admin/more/settings", label: "System Settings", desc: "Thresholds, code expiry, feature flags" },
  { href: "/admin/more/reporting", label: "Reporting / Adoption", desc: "Sessions/day, documents scanned, trend" },
];

export default function MorePage() {
  return (
    <>
      <TopBar title="More" />
      <PageShell>
        <div className="flex flex-col gap-2">
          {ITEMS.map((item) => (
            <CardLink key={item.href} href={item.href}>
              <div className="font-medium text-zinc-900 dark:text-zinc-50">{item.label}</div>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">{item.desc}</div>
            </CardLink>
          ))}
        </div>
      </PageShell>
    </>
  );
}
