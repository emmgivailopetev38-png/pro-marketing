import { CounterRamp } from "@/components/effects/CounterRamp";

const STATS = [
  { target: 100, suffix: "+", label: "Автоматизирани процеса" },
  { target: 24, suffix: "/7", label: "Работа без пауза" },
  { target: 60, suffix: "%", label: "Средно спестено време" },
];

export function TrustStrip() {
  return (
    <section className="relative border-y border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 py-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 md:grid-cols-3">
        {STATS.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center md:items-start md:text-left">
            <span className="font-display text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
              <CounterRamp target={s.target} suffix={s.suffix} />
            </span>
            <p className="mt-2 text-sm uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              {s.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
