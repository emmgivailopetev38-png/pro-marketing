"use client";
import { useEffect, useState } from "react";
import { TiltCard } from "@/components/effects/TiltCard";
import { SectionReveal } from "@/components/effects/SectionReveal";

interface PainPoint {
  icon: string;
  task: string;
  detail: string;
  hoursPerMonth: number;
  rateBgnPerHour: number;
  aiCostBgn: number;
}

const PAINS: PainPoint[] = [
  {
    icon: "💬",
    task: "Отговори в Messenger / Viber / Instagram",
    detail: "На едни и същи въпроси по 50 пъти на ден",
    hoursPerMonth: 88,
    rateBgnPerHour: 18,
    aiCostBgn: 200,
  },
  {
    icon: "📱",
    task: "Постове и reels всеки ден",
    detail: "Текст, визия, hashtags, calendar — ръчно",
    hoursPerMonth: 66,
    rateBgnPerHour: 22,
    aiCostBgn: 300,
  },
  {
    icon: "✉️",
    task: "Follow-up имейли до лийдове",
    detail: '"Кога ще се чуем", "имаш ли време", "напомням"',
    hoursPerMonth: 33,
    rateBgnPerHour: 25,
    aiCostBgn: 100,
  },
  {
    icon: "📅",
    task: "Запис на срещи и потвърждения",
    detail: "Обаждания за час, преразпределения, no-show управление",
    hoursPerMonth: 44,
    rateBgnPerHour: 18,
    aiCostBgn: 150,
  },
  {
    icon: "🎯",
    task: "Сортиране на лийдове по приоритет",
    detail: "Кой е готов да купи, кой губи времето ти",
    hoursPerMonth: 44,
    rateBgnPerHour: 25,
    aiCostBgn: 200,
  },
  {
    icon: "⭐",
    task: "Отговор на ревюта и коментари",
    detail: "Google, Booking, TripAdvisor, Facebook — всеки иска отговор",
    hoursPerMonth: 15,
    rateBgnPerHour: 22,
    aiCostBgn: 80,
  },
  {
    icon: "📊",
    task: "Седмични отчети и анализи",
    detail: "Excel формули, графики, summary за директора",
    hoursPerMonth: 16,
    rateBgnPerHour: 30,
    aiCostBgn: 50,
  },
  {
    icon: "🧾",
    task: "Фактуриране и счетоводна административа",
    detail: "Издаване, изпращане, проследяване на плащания",
    hoursPerMonth: 44,
    rateBgnPerHour: 22,
    aiCostBgn: 150,
  },
];

function fmtBgn(n: number) {
  return n.toLocaleString("bg-BG") + " лв";
}

export function PainPoints() {
  // Animated total savings counter
  const totalManual = PAINS.reduce((s, p) => s + p.hoursPerMonth * p.rateBgnPerHour, 0);
  const totalAi = PAINS.reduce((s, p) => s + p.aiCostBgn, 0);
  const totalSavings = totalManual - totalAi;

  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 1800;
    const animate = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.floor(totalSavings * eased));
      if (t < 1) raf = requestAnimationFrame(animate);
    };
    // Only animate once on first scroll into view — using IO would be better
    // but simple timer works for the initial impression
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [totalSavings]);

  return (
    <section className="relative overflow-hidden py-32">
      {/* Dual-tint background — red on left, green on right */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 30%, rgba(239,68,68,0.08) 0%, transparent 45%), radial-gradient(ellipse at 85% 70%, rgba(34,197,94,0.08) 0%, transparent 45%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-12 max-w-3xl">
            <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em]" style={{ color: "#ef4444" }}>
              {"// колко плащаш за рутина"}
            </p>
            <h2
              className="font-display text-[clamp(32px,7vw,68px)] font-bold leading-[1.04] tracking-tight"
              style={{ overflowWrap: "break-word", hyphens: "auto" }}
            >
              Спирай да плащаш<br />
              <span style={{ color: "#ef4444" }}>заплати</span> за рутина.
            </h2>
            <p className="mt-5 text-base text-[var(--color-text-secondary)] md:text-lg">
              Един човек на 2000 лв/месец прави работа, която AI агент върши за{" "}
              <span className="font-semibold text-[var(--color-text-primary)]">200 лв/месец</span>.
              Без отпуски, без болнични, без забавяне. Виж конкретно:
            </p>
          </div>
        </SectionReveal>

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {PAINS.map((p, i) => {
            const manualCost = p.hoursPerMonth * p.rateBgnPerHour;
            const savings = manualCost - p.aiCostBgn;
            const savingsPct = Math.round((savings / manualCost) * 100);
            return (
              <SectionReveal key={p.task} delay={i * 60}>
                <TiltCard className="h-full rounded-2xl">
                  <div className="glass relative h-full overflow-hidden rounded-2xl p-6 md:p-7">
                    {/* Savings ribbon */}
                    <div
                      className="absolute right-0 top-0 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider"
                      style={{
                        background: "rgba(34,197,94,0.15)",
                        color: "#22c55e",
                        borderBottomLeftRadius: "0.75rem",
                      }}
                    >
                      −{savingsPct}%
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-3xl" aria-hidden>{p.icon}</span>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-lg font-bold leading-tight">
                          {p.task}
                        </h3>
                        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">{p.detail}</p>
                      </div>
                    </div>

                    {/* Cost comparison */}
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      <div
                        className="rounded-lg border p-3"
                        style={{
                          borderColor: "rgba(239,68,68,0.25)",
                          background: "rgba(239,68,68,0.06)",
                        }}
                      >
                        <p
                          className="font-mono text-[10px] uppercase tracking-[0.2em]"
                          style={{ color: "#ef4444" }}
                        >
                          Ръчно
                        </p>
                        <p
                          className="mt-1 font-display text-2xl font-extrabold line-through decoration-2"
                          style={{ color: "#ef4444", textDecorationColor: "rgba(239,68,68,0.6)" }}
                        >
                          {fmtBgn(manualCost)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                          {p.hoursPerMonth}ч × {p.rateBgnPerHour} лв
                        </p>
                      </div>
                      <div
                        className="rounded-lg border p-3"
                        style={{
                          borderColor: "rgba(34,197,94,0.30)",
                          background: "rgba(34,197,94,0.08)",
                        }}
                      >
                        <p
                          className="font-mono text-[10px] uppercase tracking-[0.2em]"
                          style={{ color: "#22c55e" }}
                        >
                          С AI агент
                        </p>
                        <p
                          className="mt-1 font-display text-2xl font-extrabold"
                          style={{ color: "#22c55e" }}
                        >
                          {fmtBgn(p.aiCostBgn)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
                          24/7, без почивка
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border-default)] pt-3">
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                        Спестяваш
                      </span>
                      <span
                        className="font-display text-lg font-bold"
                        style={{ color: "#22c55e" }}
                      >
                        +{fmtBgn(savings)} / месец
                      </span>
                    </div>
                  </div>
                </TiltCard>
              </SectionReveal>
            );
          })}
        </div>

        {/* Total savings hero */}
        <SectionReveal delay={200}>
          <div
            className="mt-12 overflow-hidden rounded-3xl border p-8 md:p-12"
            style={{
              borderColor: "rgba(34,197,94,0.35)",
              background:
                "linear-gradient(135deg, rgba(34,197,94,0.10) 0%, rgba(6,182,212,0.06) 100%), var(--color-bg-glass)",
              boxShadow: "0 0 60px rgba(34,197,94,0.10)",
            }}
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[1fr_auto] md:items-center md:gap-12">
              <div>
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: "#22c55e" }}
                >
                  Общо месечно спестяване
                </p>
                <p
                  className="mt-3 font-display text-5xl font-extrabold leading-none tracking-tight md:text-7xl"
                  style={{ color: "#22c55e" }}
                >
                  {fmtBgn(displayed)}
                </p>
                <p className="mt-3 text-sm text-[var(--color-text-secondary)] md:text-base">
                  Ако имаш дори половината от тези процеси —{" "}
                  <span className="font-bold text-[var(--color-text-primary)]">
                    {fmtBgn(Math.floor(totalSavings / 2))}
                  </span>{" "}
                  всеки месец остават в джоба ти, не на ведомостта.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center md:gap-6">
                <Stat label="Ръчно/мес" value={fmtBgn(totalManual)} color="#ef4444" />
                <Stat label="С AI/мес" value={fmtBgn(totalAi)} color="#22c55e" />
                <Stat label="Часа спестени" value={`${PAINS.reduce((s, p) => s + p.hoursPerMonth, 0)}ч`} color="var(--color-accent-cyan)" />
              </div>
            </div>

            <p className="mt-8 text-center text-xs text-[var(--color-text-tertiary)]">
              * Калкулации на база средни ставки в България (15–30 лв/час за административна работа) +{" "}
              30% overhead за осигуровки/болнични/отпуски.
            </p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p
        className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]"
      >
        {label}
      </p>
      <p
        className="mt-1 font-display text-lg font-bold md:text-2xl"
        style={{ color }}
      >
        {value}
      </p>
    </div>
  );
}
