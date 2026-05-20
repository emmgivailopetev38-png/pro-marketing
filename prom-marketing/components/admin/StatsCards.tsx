import { Card } from "@/components/ui/card";

interface Stat { label: string; value: string | number; hint?: string; }

export function StatsCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="glass p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">{s.label}</p>
          <p className="mt-2 font-display text-3xl font-bold">{s.value}</p>
          {s.hint && <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{s.hint}</p>}
        </Card>
      ))}
    </div>
  );
}
