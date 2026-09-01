export function BarRow({ label, value, max, tone = "blue" }: { label: string; value: number; max: number; tone?: "blue" | "amber" }) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 4 : 0) : 0;
  const barColor = tone === "blue" ? "bg-blue-500" : "bg-amber-500";

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 shrink-0 text-zinc-500 dark:text-zinc-400">{label}</span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right font-medium text-zinc-700 dark:text-zinc-300">{value}</span>
    </div>
  );
}
