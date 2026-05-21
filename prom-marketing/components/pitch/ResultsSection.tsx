import { SectionReveal } from "@/components/effects/SectionReveal";
import { CounterRamp } from "@/components/effects/CounterRamp";
import { HolographicText } from "@/components/effects/HolographicText";
import { AuroraBackground } from "@/components/effects/AuroraBackground";

const METRICS = [
  { value: 24, suffix: "/7", label: "AI агентите работят без пауза", color: "#06b6d4" },
  { value: 80, suffix: "%", label: "от запитванията решени без човек", color: "#7c3aed" },
  { value: 70, suffix: "%", label: "по-малко време на повтарящи се задачи", color: "#ec4899" },
  { value: 3, suffix: "x", label: "по-бърз отговор на нови лийдове", color: "#06b6d4" },
  { value: 60, suffix: "%", label: "по-ниска цена на придобит клиент", color: "#7c3aed" },
  { value: 4, suffix: " седмици", label: "до стартиране на първия модул", color: "#ec4899" },
];

export function ResultsSection() {
  return (
    <section className="relative overflow-hidden py-32 md:py-44">
      <AuroraBackground intensity="subtle" />
      <div className="relative mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-16 max-w-3xl">
            <p className="mb-4 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
              {"// числата говорят"}
            </p>
            <h2 className="font-display text-[clamp(34px,6vw,80px)] font-bold leading-[1.02] tracking-tight">
              Не обещания. <HolographicText>Резултати.</HolographicText>
            </h2>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-border-default)] sm:grid-cols-2 lg:grid-cols-3">
          {METRICS.map((m, i) => (
            <SectionReveal key={m.label} delay={i * 80}>
              <div className="relative flex h-full flex-col justify-between bg-[var(--color-bg-deep)]/80 p-8 md:p-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-tertiary)]">
                  метрика 0{i + 1}
                </p>
                <p
                  className="my-6 font-display text-6xl font-bold leading-none tracking-tight md:text-7xl"
                  style={{ color: m.color }}
                >
                  <CounterRamp target={m.value} suffix={m.suffix} />
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">{m.label}</p>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
