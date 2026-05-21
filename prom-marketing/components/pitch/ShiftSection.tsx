import { SectionReveal } from "@/components/effects/SectionReveal";
import { HolographicText } from "@/components/effects/HolographicText";
import { CounterRamp } from "@/components/effects/CounterRamp";

export function ShiftSection() {
  return (
    <section className="relative border-y border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/30 py-32 md:py-44">
      <div className="absolute inset-0 grid-overlay opacity-30" />
      <div className="relative mx-auto max-w-5xl px-6">
        <SectionReveal>
          <p className="mb-6 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
            {"// прехода вече започна"}
          </p>
          <h2 className="font-display text-[clamp(34px,6vw,80px)] font-bold leading-[1.05] tracking-tight">
            Компаниите, които{" "}
            <HolographicText>автоматизират</HolographicText> сега,
            <br />
            ще управляват пазара утре.
          </h2>
          <p className="mt-10 max-w-2xl text-lg text-[var(--color-text-secondary)]">
            Не става въпрос дали ще се случи. Само кой ще е там, когато се случи.
          </p>
        </SectionReveal>

        <div className="mt-20 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            { value: 87, suffix: "%", label: "от компаниите вече тестват AI", color: "cyan" },
            { value: 70, suffix: "%", label: "по-малко време на рутина с AI агенти", color: "violet" },
            { value: 3, suffix: "x", label: "по-бърз отговор на лийдове", color: "magenta" },
          ].map((stat, i) => (
            <SectionReveal key={stat.label} delay={i * 120}>
              <div className="glass relative h-full overflow-hidden rounded-2xl p-7">
                <div
                  aria-hidden
                  className="absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20 blur-3xl"
                  style={{
                    background:
                      stat.color === "cyan"
                        ? "radial-gradient(circle, #06b6d4, transparent)"
                        : stat.color === "violet"
                        ? "radial-gradient(circle, #7c3aed, transparent)"
                        : "radial-gradient(circle, #ec4899, transparent)",
                  }}
                />
                <div className="relative">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-[var(--color-text-tertiary)]">
                    стат
                  </p>
                  <p className="mt-4 font-display text-6xl font-bold tracking-tight md:text-7xl">
                    <CounterRamp target={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-4 text-sm text-[var(--color-text-secondary)]">{stat.label}</p>
                </div>
              </div>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
