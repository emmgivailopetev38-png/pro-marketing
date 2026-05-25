"use client";
import { useEffect, useState } from "react";
import { TiltCard } from "@/components/effects/TiltCard";
import { SectionReveal } from "@/components/effects/SectionReveal";

const AGENTS = [
  { name: "Сара", role: "Sales agent", task: "Анализира 14 нови leads", status: "working", color: "#06b6d4" },
  { name: "Виктор", role: "Content writer", task: "Пише блог пост · 78%", status: "working", color: "#a78bfa" },
  { name: "Михаил", role: "Email assistant", task: "Изпратени 3 follow-ups", status: "done", color: "#22c55e" },
  { name: "Елена", role: "Lead qualifier", task: "Score: 8 hot · 12 warm", status: "working", color: "#06b6d4" },
  { name: "Иван", role: "Voice agent", task: "На линия с клиент", status: "calling", color: "#f59e0b" },
  { name: "Анна", role: "Data analyst", task: "Готов седмичен отчет", status: "done", color: "#22c55e" },
  { name: "Тодор", role: "Booking assistant", task: "Идле · чака повикване", status: "idle", color: "#64748b" },
  { name: "Невена", role: "CRM keeper", task: "Синхронизира 23 записа", status: "working", color: "#06b6d4" },
];

const PIPELINES = [
  { name: "Lead → Discovery", count: 14, color: "#06b6d4", progress: 35 },
  { name: "Discovery → Оферта", count: 8, color: "#a78bfa", progress: 62 },
  { name: "Оферта → Договор", count: 5, color: "#f59e0b", progress: 78 },
  { name: "Договор → Старт", count: 3, color: "#22c55e", progress: 92 },
];

const FEED = [
  { time: "00:12", text: "Сара изпрати оферта на хотел Алба", color: "#06b6d4" },
  { time: "00:45", text: "Михаил написа 2 follow-up имейла", color: "#a78bfa" },
  { time: "01:23", text: "Booking #4421 потвърден от клиент", color: "#22c55e" },
  { time: "02:08", text: "Виктор публикува LinkedIn пост", color: "#a78bfa" },
  { time: "03:14", text: "Иван приключи разговор · 4:32 мин", color: "#f59e0b" },
];

const STATUS_LABEL: Record<string, string> = {
  working: "Работи",
  done: "Готово",
  calling: "На линия",
  idle: "Idle",
};

export function LiveDashboards() {
  // Animated metric ticker
  const [revenue, setRevenue] = useState(48720);
  const [leads, setLeads] = useState(127);

  useEffect(() => {
    const interval = setInterval(() => {
      setRevenue((r) => r + Math.floor(Math.random() * 80));
      if (Math.random() > 0.7) setLeads((l) => l + 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden border-y border-[var(--color-border-default)] py-32">
      {/* Subtle scanline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(transparent 50%, rgba(6,182,212,0.5) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, rgba(6,182,212,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(124,58,237,0.08) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
                {"// на живо"}
              </p>
              <h2
                className="font-display text-[clamp(32px,7vw,64px)] font-bold leading-[1.06] tracking-tight"
                style={{ overflowWrap: "break-word", hyphens: "auto" }}
              >
                Твоят AI екип<br />
                <span className="text-[var(--color-accent-cyan)]">на смяна 24/7</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm text-[var(--color-text-secondary)] md:text-base">
                Не бот за чат — а пълноценен екип от агенти със собствени роли,
                задачи и метрики. Видими в общ дашборд. Управляват се с чат.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-glass)] px-4 py-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#22c55e" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: "#22c55e" }} />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">
                LIVE preview · моите системи
              </span>
            </div>
          </div>
        </SectionReveal>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Big card: Agent grid */}
          <SectionReveal>
            <TiltCard className="h-full rounded-2xl">
              <div className="glass relative h-full rounded-2xl p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">8 активни агента</h3>
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                    обновено: преди 4 сек
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {AGENTS.map((a) => (
                    <div
                      key={a.name}
                      className="flex items-center gap-3 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-void)]/40 p-3 transition-colors hover:border-[var(--color-border-bright)]"
                    >
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                        style={{
                          background: a.color + "22",
                          color: a.color,
                          boxShadow: a.status === "working" || a.status === "calling" ? `0 0 12px ${a.color}40` : undefined,
                        }}
                      >
                        {a.name[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-bold text-[var(--color-text-primary)]">
                            {a.name}
                          </p>
                          <span className="text-[10px] text-[var(--color-text-tertiary)]">·</span>
                          <p className="truncate text-[10px] text-[var(--color-text-tertiary)]">
                            {a.role}
                          </p>
                        </div>
                        <p className="truncate text-[11px] text-[var(--color-text-secondary)]">{a.task}</p>
                      </div>
                      <span
                        className="flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                        style={{
                          background: a.color + "20",
                          color: a.color,
                        }}
                      >
                        {STATUS_LABEL[a.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </TiltCard>
          </SectionReveal>

          {/* Right column: stacked cards */}
          <div className="flex flex-col gap-5">
            {/* Live metrics */}
            <SectionReveal delay={120}>
              <TiltCard className="rounded-2xl">
                <div className="glass relative rounded-2xl p-6 md:p-7">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-base font-bold">Live приходи</h3>
                    <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">днес</span>
                  </div>
                  <p
                    className="mt-4 font-display text-4xl font-extrabold tracking-tight transition-all duration-500"
                    style={{ color: "var(--color-accent-cyan)" }}
                  >
                    {revenue.toLocaleString("bg-BG")} лв
                  </p>
                  <div className="mt-4 flex items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                    <span className="font-mono text-[10px]" style={{ color: "#22c55e" }}>
                      ▲ +18.2%
                    </span>
                    <span>спрямо вчера</span>
                  </div>

                  {/* Mini bar chart */}
                  <div className="mt-6 flex h-12 items-end gap-1">
                    {[35, 52, 41, 68, 55, 82, 74, 91, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-all"
                        style={{
                          height: `${h}%`,
                          background:
                            i === 8
                              ? "linear-gradient(180deg, #06b6d4 0%, #06b6d488 100%)"
                              : "linear-gradient(180deg, rgba(6,182,212,0.5) 0%, rgba(6,182,212,0.15) 100%)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between font-mono text-[9px] text-[var(--color-text-tertiary)]">
                    <span>пон</span>
                    <span>вто</span>
                    <span>сря</span>
                    <span>чет</span>
                    <span>пет</span>
                    <span>съб</span>
                    <span>нед</span>
                    <span>пон</span>
                    <span className="text-[var(--color-accent-cyan)]">днес</span>
                  </div>
                </div>
              </TiltCard>
            </SectionReveal>

            {/* Lead pipeline */}
            <SectionReveal delay={200}>
              <TiltCard className="rounded-2xl">
                <div className="glass relative rounded-2xl p-6 md:p-7">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-display text-base font-bold">Lead pipeline</h3>
                    <span
                      className="font-mono text-3xl font-extrabold transition-all duration-500"
                      style={{ color: "var(--color-accent-cyan)" }}
                    >
                      {leads}
                    </span>
                  </div>
                  <ul className="space-y-3">
                    {PIPELINES.map((p) => (
                      <li key={p.name}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-text-secondary)]">{p.name}</span>
                          <span
                            className="font-mono font-bold"
                            style={{ color: p.color }}
                          >
                            {p.count}
                          </span>
                        </div>
                        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${p.progress}%`,
                              background: `linear-gradient(90deg, ${p.color} 0%, ${p.color}88 100%)`,
                              boxShadow: `0 0 12px ${p.color}50`,
                            }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </TiltCard>
            </SectionReveal>
          </div>
        </div>

        {/* Bottom: live feed */}
        <SectionReveal delay={280}>
          <div className="mt-5">
            <TiltCard className="rounded-2xl">
              <div className="glass relative rounded-2xl p-6 md:p-7">
                <div className="mb-5 flex items-center justify-between">
                  <h3 className="font-display text-base font-bold">Activity stream · последния час</h3>
                  <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: "#22c55e" }} />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#22c55e" }} />
                    </span>
                    streaming
                  </span>
                </div>
                <ul className="space-y-2">
                  {FEED.map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-4 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-void)]/40 px-4 py-2.5 text-sm"
                    >
                      <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{f.time}</span>
                      <span
                        className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                        style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }}
                      />
                      <span className="flex-1 text-[var(--color-text-secondary)]">{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TiltCard>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
