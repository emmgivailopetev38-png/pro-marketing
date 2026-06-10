"use client";
/* =====================================================================
   LiveDashboardsV2 — the original LiveDashboards, redrawn in the "2050"
   "Luminescent Depth" language. Content, data, links, icons and the live
   ticker logic are preserved 1:1 (only currency "лв" → "€"). The dashboard
   is restaged as depth-glass telemetry panels with neon-edged cards and a
   NeuralCore pulsing behind the agent grid header.

   Stays a client component because of the animated metric ticker
   (useState / useEffect), exactly like the original.
   ===================================================================== */
import { useEffect, useState } from "react";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

const AGENTS = [
  { name: "Сара", role: "Продажби", task: "Анализира 14 нови лида", status: "working", color: "var(--v2-cyan)" },
  { name: "Виктор", role: "Копирайтър", task: "Пише блог пост · 78%", status: "working", color: "var(--v2-violet-2)" },
  { name: "Михаил", role: "Имейл асистент", task: "Изпратени 3 проследяващи писма", status: "done", color: "var(--v2-mint)" },
  { name: "Елена", role: "Оценител на лидове", task: "Оценка: 8 топли · 12 хладни", status: "working", color: "var(--v2-cyan)" },
  { name: "Иван", role: "Гласов агент", task: "На линия с клиент", status: "calling", color: "#f59e0b" },
  { name: "Анна", role: "Анализатор", task: "Готов седмичен отчет", status: "done", color: "var(--v2-mint)" },
  { name: "Тодор", role: "Резервации", task: "Свободен · чака повикване", status: "idle", color: "var(--v2-faint)" },
  { name: "Невена", role: "CRM поддръжка", task: "Синхронизира 23 записа", status: "working", color: "var(--v2-cyan)" },
];

const PIPELINES = [
  { name: "Лид → Среща", count: 14, color: "var(--v2-cyan)", progress: 35 },
  { name: "Среща → Оферта", count: 8, color: "var(--v2-violet-2)", progress: 62 },
  { name: "Оферта → Договор", count: 5, color: "#f59e0b", progress: 78 },
  { name: "Договор → Старт", count: 3, color: "var(--v2-mint)", progress: 92 },
];

const FEED = [
  { time: "00:12", text: "Сара изпрати оферта на хотел Алба", color: "var(--v2-cyan)" },
  { time: "00:45", text: "Михаил написа 2 проследяващи имейла", color: "var(--v2-violet-2)" },
  { time: "01:23", text: "Резервация #4421 потвърдена от клиент", color: "var(--v2-mint)" },
  { time: "02:08", text: "Виктор публикува пост в LinkedIn", color: "var(--v2-violet-2)" },
  { time: "03:14", text: "Иван приключи разговор · 4:32 мин", color: "#f59e0b" },
];

const STATUS_LABEL: Record<string, string> = {
  working: "Работи",
  done: "Готово",
  calling: "На линия",
  idle: "Свободен",
};

export function LiveDashboardsV2() {
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
    <section className="v2-section overflow-hidden">
      {/* Engineered grid + signature aurora glow backdrop */}
      <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 20% 30%, var(--v2-glow-cyan) 0%, transparent 55%), radial-gradient(ellipse at 80% 70%, var(--v2-glow-violet) 0%, transparent 55%)",
          opacity: 0.16,
        }}
      />

      <div className="v2-wrap">
        {/* ---- Header ---------------------------------------------------- */}
        <div className="mb-14 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="v2-reveal" style={{ ["--d" as string]: "0.04s" }}>
            <span className="v2-eyebrow">{"// на живо"}</span>
            <h2 className="v2-title-plain mt-4">
              Твоят AI екип
              <br />
              <span className="v2-grad">на смяна 24/7</span>
            </h2>
            <p className="v2-sub mt-4">
              Не бот за чат — а пълноценен екип от агенти със собствени роли,
              задачи и метрики. Видими в общо табло. Управляват се с чат.
            </p>
          </div>

          <div className="v2-reveal self-start" style={{ ["--d" as string]: "0.12s" }}>
            <span className="v2-status">НА ЖИВО · моите системи</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.4fr_1fr]">
          {/* Big card: Agent grid (NeuralCore breathing behind the header) */}
          <div className="v2-reveal h-full" style={{ ["--d" as string]: "0.06s" }}>
            <div className="v2-card v2-glow is-always group h-full">
              {/* living core, anchored top-right behind the title */}
              <div
                aria-hidden
                className="pointer-events-none absolute -right-12 -top-16 h-64 w-64 opacity-50"
              >
                <NeuralCore radius={1.15} nodeCount={170} spin={0.7} />
              </div>

              <div className="relative mb-6 flex items-center justify-between">
                <h3 className="text-lg font-bold" style={{ fontFamily: "var(--v2-font-display)" }}>
                  8 активни агента
                </h3>
                <span className="v2-mono text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
                  обновено: преди 4 сек
                </span>
              </div>
              <div className="relative grid grid-cols-1 gap-3 sm:grid-cols-2">
                {AGENTS.map((a) => (
                  <div
                    key={a.name}
                    className="flex items-center gap-3 rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/50 p-3 transition-colors hover:border-[var(--v2-line-bright)]"
                  >
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: `color-mix(in srgb, ${a.color} 14%, transparent)`,
                        color: a.color,
                        boxShadow:
                          a.status === "working" || a.status === "calling"
                            ? `0 0 14px color-mix(in srgb, ${a.color} 40%, transparent)`
                            : undefined,
                      }}
                    >
                      {a.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-bold text-[var(--v2-ink)]">
                          {a.name}
                        </p>
                        <span className="text-[10px] text-[var(--v2-faint)]">·</span>
                        <p className="truncate text-[10px] text-[var(--v2-faint)]">
                          {a.role}
                        </p>
                      </div>
                      <p className="truncate text-[11px] text-[var(--v2-muted)]">{a.task}</p>
                    </div>
                    <span
                      className="v2-mono flex-shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                      style={{
                        background: `color-mix(in srgb, ${a.color} 13%, transparent)`,
                        color: a.color,
                      }}
                    >
                      {STATUS_LABEL[a.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column: stacked cards */}
          <div className="flex flex-col gap-5">
            {/* Live metrics */}
            <div className="v2-reveal" style={{ ["--d" as string]: "0.14s" }}>
              <div className="v2-card v2-glow group">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold" style={{ fontFamily: "var(--v2-font-display)" }}>
                    Приходи на живо
                  </h3>
                  <span className="v2-mono text-[10px] text-[var(--v2-faint)]">днес</span>
                </div>
                <p
                  className="mt-4 text-4xl font-extrabold tracking-tight transition-all duration-500"
                  style={{ color: "var(--v2-cyan)", fontFamily: "var(--v2-font-display)" }}
                >
                  {revenue.toLocaleString("bg-BG")} €
                </p>
                <div className="mt-4 flex items-center gap-3 text-xs text-[var(--v2-muted)]">
                  <span className="v2-mono text-[10px]" style={{ color: "var(--v2-mint)" }}>
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
                            ? "linear-gradient(180deg, var(--v2-cyan) 0%, color-mix(in srgb, var(--v2-cyan) 53%, transparent) 100%)"
                            : "linear-gradient(180deg, color-mix(in srgb, var(--v2-cyan) 50%, transparent) 0%, color-mix(in srgb, var(--v2-cyan) 15%, transparent) 100%)",
                        boxShadow: i === 8 ? "0 0 14px color-mix(in srgb, var(--v2-cyan) 45%, transparent)" : undefined,
                      }}
                    />
                  ))}
                </div>
                <div className="v2-mono mt-2 flex justify-between text-[9px] text-[var(--v2-faint)]">
                  <span>пон</span>
                  <span>вто</span>
                  <span>сря</span>
                  <span>чет</span>
                  <span>пет</span>
                  <span>съб</span>
                  <span>нед</span>
                  <span>пон</span>
                  <span style={{ color: "var(--v2-cyan)" }}>днес</span>
                </div>
              </div>
            </div>

            {/* Lead pipeline */}
            <div className="v2-reveal" style={{ ["--d" as string]: "0.2s" }}>
              <div className="v2-card v2-glow group" style={{ ["--v2-c" as string]: "var(--v2-violet)" }}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-base font-bold" style={{ fontFamily: "var(--v2-font-display)" }}>
                    Лидов процес
                  </h3>
                  <span
                    className="text-3xl font-extrabold transition-all duration-500"
                    style={{ color: "var(--v2-cyan)", fontFamily: "var(--v2-font-display)" }}
                  >
                    {leads}
                  </span>
                </div>
                <ul className="space-y-3">
                  {PIPELINES.map((p) => (
                    <li key={p.name}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--v2-muted)]">{p.name}</span>
                        <span className="v2-mono font-bold" style={{ color: p.color }}>
                          {p.count}
                        </span>
                      </div>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${p.progress}%`,
                            background: `linear-gradient(90deg, ${p.color} 0%, color-mix(in srgb, ${p.color} 53%, transparent) 100%)`,
                            boxShadow: `0 0 12px color-mix(in srgb, ${p.color} 50%, transparent)`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: live feed */}
        <div className="v2-reveal mt-5" style={{ ["--d" as string]: "0.26s" }}>
          <div className="v2-card v2-glow group">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ fontFamily: "var(--v2-font-display)" }}>
                Поток на активността · последния час
              </h3>
              <span className="v2-status">на живо</span>
            </div>
            <ul className="space-y-2">
              {FEED.map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-4 rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/50 px-4 py-2.5 text-sm"
                >
                  <span className="v2-mono text-[10px] text-[var(--v2-faint)]">{f.time}</span>
                  <span
                    className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ background: f.color, boxShadow: `0 0 6px ${f.color}` }}
                  />
                  <span className="flex-1 text-[var(--v2-muted)]">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
