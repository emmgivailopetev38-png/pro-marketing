"use client";
/* =====================================================================
   CRMShowcaseV2 — the original CRMShowcase, redrawn in the "2050"
   "Luminescent Depth" language. ALL content is preserved 1:1: every
   slide, text, datum, accent color, AI badge, savings line, the seven
   dashboard mockups and the full auto-rotating carousel logic
   (auto-advance, pause-on-hover, prev/next, click-to-jump, progress bar).
   Only the skin changes — depth-glass panels, neon conic edges,
   holographic title, Sora/JetBrains type via the v2 tokens — plus a
   NeuralCore breathing behind the live mockup chrome. Currency note: the
   original already uses "€" everywhere; no "лв/лева" present to convert.

   Stays a client component: the carousel runs on useState/useEffect/
   useRef + motion/AnimatePresence, exactly like the original.
   ===================================================================== */
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { NeuralCore } from "@/components/landing/v2/NeuralCore";

interface Slide {
  id: string;
  tag: string;
  title: string;
  desc: string;
  accent: string;
  /** Short, punchy AI-impact line — shown as a glowing chip. */
  aiBadge: string;
  /** Time savings claim — e.g. "спестява 4ч/седмично". */
  savings: string;
  render: () => ReactNode;
}

// Each slide renders a small dashboard-style mockup so the section feels like
// a live product tour, not stock screenshots. All values are illustrative —
// numbers are static but the layout matches the real /admin pages 1:1.

function PipelineSlide() {
  const stages: Array<{ name: string; count: number; color: string }> = [
    { name: "Спечелени", count: 12, color: "var(--v2-mint)" },
    { name: "Преговори", count: 4, color: "#fb923c" },
    { name: "Оферти", count: 7, color: "#facc15" },
    { name: "Презентации", count: 6, color: "var(--v2-magenta)" },
    { name: "Discovery", count: 11, color: "var(--v2-cyan)" },
    { name: "В контакт", count: 18, color: "var(--v2-violet-2)" },
    { name: "Lead", count: 23, color: "var(--v2-faint)" },
  ];
  const max = stages.reduce((m, s) => Math.max(m, s.count), 0);
  return (
    <div className="space-y-3 p-6">
      <div className="flex items-center justify-between">
        <p className="v2-mono text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
          81 активни сделки · €124,500 pipeline
        </p>
        <span className="v2-mono rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)] px-2 py-0.5 text-[10px] text-[var(--v2-mint)]">
          ▲ 18% · 7 дни
        </span>
      </div>
      {stages.map((s) => (
        <div key={s.name}>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span style={{ color: s.color }} className="v2-mono uppercase tracking-wider">
              {s.name}
            </span>
            <span className="text-[var(--v2-faint)]">{s.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(s.count / max) * 100}%` }}
              transition={{ duration: 1, delay: 0.05, ease: "easeOut" }}
              style={{
                background: `linear-gradient(90deg, ${s.color} 0%, color-mix(in srgb, ${s.color} 55%, transparent) 100%)`,
                boxShadow: `0 0 10px color-mix(in srgb, ${s.color} 45%, transparent)`,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiSlide() {
  const cards: Array<{ label: string; value: string; hint: string; color: string; delta: string }> = [
    { label: "Активни клиенти", value: "81", hint: "новo: +14", color: "var(--v2-cyan)", delta: "▲ 8" },
    { label: "Conversion", value: "42%", hint: "12 от 28 спечелени", color: "var(--v2-mint)", delta: "▲ 5" },
    { label: "Pipeline €", value: "€124,500", hint: "оферти + преговори", color: "#facc15", delta: "▲ €18k" },
    { label: "Срещи / месец", value: "23", hint: "проведени", color: "var(--v2-violet-2)", delta: "▲ 7" },
    { label: "Имейли / 7д", value: "47", hint: "пратени", color: "var(--v2-magenta)", delta: "▲ 12" },
    { label: "Просрочени", value: "0", hint: "всичко чисто", color: "var(--v2-mint)", delta: "—" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 p-6 md:grid-cols-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.4 }}
          className="rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-3 transition-colors hover:border-[var(--v2-line-bright)]"
        >
          <div className="flex items-center justify-between">
            <p className="v2-mono text-[9px] uppercase tracking-[0.15em] text-[var(--v2-faint)]">
              {c.label}
            </p>
            <span className="v2-mono text-[9px] text-[var(--v2-mint)]">{c.delta}</span>
          </div>
          <p className="mt-1 text-2xl font-bold" style={{ color: c.color, fontFamily: "var(--v2-font-display)" }}>
            {c.value}
          </p>
          <p className="text-[10px] text-[var(--v2-faint)]">{c.hint}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ClientTimelineSlide() {
  // Demo timeline — fictional client. Real CRM activities live in /admin only.
  const activities: Array<{ icon: string; title: string; time: string; color: string }> = [
    { icon: "🤝", title: "Среща проведена · 30 мин", time: "днес 14:00", color: "var(--v2-mint)" },
    { icon: "💎", title: "Оферта изпратена · €2,000", time: "вчера 11:20", color: "#facc15" },
    { icon: "🎯", title: "Презентация пратена", time: "преди 2 дни", color: "var(--v2-magenta)" },
    { icon: "📅", title: "Cal.com резервация", time: "преди 3 дни", color: "var(--v2-violet-2)" },
    { icon: "✉️", title: "Welcome имейл", time: "преди 3 дни", color: "var(--v2-cyan)" },
    { icon: "📥", title: "Meta lead → CRM", time: "преди 4 дни", color: "#1877F2" },
  ];
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3 rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(52,211,153,0.18)] text-[var(--v2-mint)]">
          МС
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[var(--v2-ink)]">Мария Стоянова</p>
          <p className="text-[11px] text-[var(--v2-faint)]">Био магазин · €1,500 сделка</p>
        </div>
        <span className="v2-mono rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)] px-2 py-0.5 text-[10px] uppercase tracking-wider text-[var(--v2-mint)]">
          Спечелен
        </span>
      </div>
      <div className="relative space-y-2">
        <span className="absolute left-[14px] top-1 h-[calc(100%-2.5rem)] w-px bg-white/10" />
        {activities.map((a, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.07 * i, duration: 0.3 }}
            className="relative flex items-center gap-3 rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-white/[0.02] py-2 pl-2 pr-3"
          >
            <span
              className="z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm"
              style={{ background: `color-mix(in srgb, ${a.color} 19%, transparent)`, color: a.color }}
            >
              {a.icon}
            </span>
            <p className="flex-1 text-xs text-[var(--v2-muted)]">{a.title}</p>
            <span className="v2-mono text-[10px] text-[var(--v2-faint)]">{a.time}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function BookingsSlide() {
  // Demo data — fictional clients shown only on the public homepage. Real CRM
  // contacts live in /admin/clients and never appear here.
  const upcoming: Array<{ name: string; biz: string; when: string; color: string }> = [
    { name: "Мария Стоянова", biz: "Био магазин · онлайн", when: "пон · 10:00", color: "var(--v2-mint)" },
    { name: "Николай Димитров", biz: "Туристическа агенция", when: "вто · 14:30", color: "var(--v2-mint)" },
    { name: "Елена Тодорова", biz: "Бутик за бижута", when: "сря · 11:00", color: "var(--v2-violet-2)" },
  ];
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="v2-mono text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
          📅 Предстоящи срещи · Google Meet
        </p>
        <div className="inline-flex rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-0.5">
          <span className="v2-mono rounded-sm bg-[color-mix(in_srgb,var(--v2-cyan)_30%,transparent)] px-2 py-0.5 text-[10px] text-[var(--v2-cyan)]">
            Предстоящи · 3
          </span>
          <span className="v2-mono px-2 py-0.5 text-[10px] text-[var(--v2-faint)]">
            Архив · 24
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {upcoming.map((b, i) => (
          <motion.div
            key={b.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, duration: 0.3 }}
            className="flex items-center gap-3 rounded-[var(--v2-r-sm)] border border-[rgba(52,211,153,0.22)] bg-[rgba(52,211,153,0.06)] p-3"
          >
            <span className="text-lg">📅</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--v2-ink)]">{b.name}</p>
              <p className="truncate text-[11px] text-[var(--v2-faint)]">{b.biz}</p>
            </div>
            <div className="text-right">
              <p className="v2-mono text-[11px] text-[var(--v2-mint)]">{b.when}</p>
              <p className="text-[10px] text-[var(--v2-cyan)]">отвори meet →</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/45 p-3">
        <div>
          <p className="v2-mono text-[10px] uppercase tracking-wider text-[var(--v2-faint)]">
            Auto-flow при нова резервация
          </p>
          <p className="mt-1 text-[11px] text-[var(--v2-muted)]">
            Webhook → Контакт → Welcome имейл → Google Meet
          </p>
        </div>
        <span className="v2-mono rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)] px-2 py-0.5 text-[10px] text-[var(--v2-mint)]">
          активно
        </span>
      </div>
    </div>
  );
}

function ChannelsSlide() {
  const channels: Array<{ name: string; status: string; count: string; color: string; icon: string }> = [
    { name: "Meta лидове (Facebook/IG)", status: "Синхронизация на живо", count: "127 / месец", color: "#1877F2", icon: "📥" },
    { name: "Cal.com резервации", status: "Webhook активен", count: "23 / месец", color: "var(--v2-cyan)", icon: "📅" },
    { name: "Сайт форма", status: "Свързана", count: "14 / месец", color: "var(--v2-mint)", icon: "🌐" },
    { name: "Welcome имейли", status: "Resend / auto", count: "47 / 7 дни", color: "var(--v2-violet-2)", icon: "✉️" },
    { name: "Google Meet линкове", status: "Auto-генерация", count: "23 / месец", color: "#facc15", icon: "🎥" },
    { name: "Чатбот · сайт", status: "В подготовка", count: "—", color: "var(--v2-magenta)", icon: "💬" },
  ];
  return (
    <div className="p-6">
      <p className="v2-mono mb-3 text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
        🔌 Интегрирани канали · 6 системи
      </p>
      <div className="space-y-2">
        {channels.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
            className="flex items-center gap-3 rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-3 transition-colors hover:border-[var(--v2-line-bright)]"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-[var(--v2-r-sm)] text-base"
              style={{ background: `color-mix(in srgb, ${c.color} 16%, transparent)`, color: c.color }}
            >
              {c.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--v2-ink)]">{c.name}</p>
              <p className="text-[11px] text-[var(--v2-faint)]">{c.status}</p>
            </div>
            <span className="v2-mono text-[11px] text-[var(--v2-muted)]">{c.count}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ActivitySlide() {
  // Sparkline points — last 30 days of activity (illustrative)
  const data = [
    3, 5, 4, 7, 6, 8, 5, 9, 11, 8, 14, 12, 10, 13, 16, 14, 11, 9, 12, 15,
    18, 16, 14, 19, 22, 18, 20, 24, 21, 19,
  ];
  const max = Math.max(...data);
  const w = 100;
  const h = 60;
  const step = w / (data.length - 1);
  const coords = data.map((v, i) => [i * step, h - 6 - (v / max) * (h - 16)] as const);
  const line = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  const area = `${line} L${w},${h} L0,${h} Z`;

  return (
    <div className="p-6">
      <div className="mb-3 flex items-center justify-between">
        <p className="v2-mono text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
          📈 Активност · 30 дни
        </p>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[var(--v2-muted)]">общо <span className="v2-mono text-[var(--v2-cyan)]">374</span></span>
          <span className="v2-mono rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)] px-2 py-0.5 text-[var(--v2-mint)]">
            ▲ 67%
          </span>
        </div>
      </div>

      <div className="rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-4">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-32 w-full">
          <defs>
            <linearGradient id="crm-spark-v2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--v2-cyan)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--v2-cyan)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#crm-spark-v2)" />
          <motion.path
            d={line}
            fill="none"
            stroke="var(--v2-cyan)"
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
            style={{ filter: "drop-shadow(0 0 4px var(--v2-glow-cyan))" }}
          />
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Имейли", value: 142, color: "var(--v2-violet-2)" },
          { label: "Срещи", value: 23, color: "var(--v2-mint)" },
          { label: "Бележки", value: 96, color: "#facc15" },
        ].map((b) => (
          <div key={b.label} className="rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/45 p-2">
            <p className="v2-mono text-[9px] uppercase tracking-wider text-[var(--v2-faint)]">
              {b.label}
            </p>
            <p className="mt-0.5 text-xl font-bold" style={{ color: b.color, fontFamily: "var(--v2-font-display)" }}>
              {b.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopilotSlide() {
  // CEO Agent dialogue — demonstrates how the user gives orders to an
  // orchestrator that delegates to worker agents. Names and businesses are
  // fictional.
  const commands: Array<{ user: string; ai: string; agent: string; color: string }> = [
    {
      user: `Изпрати оферти на топ 5 lead-а от тази седмица`,
      ai: `Възлагам на Sales Agent · 5 персонализирани оферти готови за преглед в /admin/email до 4 минути.`,
      agent: "→ Sales Agent",
      color: "var(--v2-mint)",
    },
    {
      user: `Защо продажбите паднаха миналата седмица?`,
      ai: `Analytics Agent проверява · открих 3 причини: 27% по-малко срещи, 40% по-нисък email open rate, 2 lost клиента в negotiating. Готвя отчет.`,
      agent: "→ Analytics Agent",
      color: "var(--v2-cyan)",
    },
    {
      user: `Публикувай идея за пост във FB и IG за CRM системите`,
      ai: `Content Agent композира 3 варианта (текст + изображения от Midjourney) · одобри в /admin/social.`,
      agent: "→ Content Agent",
      color: "var(--v2-violet-2)",
    },
  ];
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="v2-mono text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
          🎩 CEO Agent · говориш с шефа
        </p>
        <span className="v2-mono inline-flex items-center gap-1 rounded-full border border-[var(--v2-line-bright)] bg-gradient-to-r from-[color-mix(in_srgb,var(--v2-cyan)_20%,transparent)] to-[color-mix(in_srgb,var(--v2-violet)_20%,transparent)] px-2 py-0.5 text-[10px] text-[var(--v2-cyan)]">
          <span className="h-1 w-1 animate-pulse rounded-full bg-[var(--v2-mint)]" />
          Hermes · оркестрира 6 агента
        </span>
      </div>
      <div className="space-y-3">
        {commands.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i, duration: 0.35 }}
            className="space-y-1"
          >
            <div className="flex justify-end">
              <div
                className="max-w-[80%] rounded-2xl rounded-br-md px-3 py-2 text-xs text-[#04121a]"
                style={{
                  background: "var(--v2-grad-accent)",
                  boxShadow: "0 6px 22px -8px var(--v2-glow-cyan)",
                }}
              >
                {c.user}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span
                className="v2-mono mb-1 ml-2 text-[9px] uppercase tracking-wider"
                style={{ color: c.color }}
              >
                {c.agent}
              </span>
              <div
                className="max-w-[85%] rounded-2xl rounded-bl-md border px-3 py-2 text-xs"
                style={{
                  borderColor: `color-mix(in srgb, ${c.color} 40%, transparent)`,
                  background: `color-mix(in srgb, ${c.color} 9%, transparent)`,
                  color: c.color,
                }}
              >
                <span className="mr-1">✓</span>
                {c.ai}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 rounded-[var(--v2-r-sm)] border border-[rgba(52,211,153,0.22)] bg-[rgba(52,211,153,0.06)] p-3 text-center">
        <p className="text-[11px] text-[var(--v2-mint)]">
          ⏱️ <span className="font-bold">12-15 часа седмично</span> спестени · CEO Agent делегира · ти само одобряваш
        </p>
      </div>
    </div>
  );
}

// Show the agent org chart — CEO Agent at top, workers below, each with a
// live status indicator. Built entirely with CSS + framer motion.
function AgentTeamSlide() {
  const workers: Array<{ name: string; role: string; status: string; tasks: number; color: string; icon: string }> = [
    { name: "Sales Agent", role: "Оферти + договори", status: "пише оферта · 3:42", tasks: 8, color: "var(--v2-mint)", icon: "🎯" },
    { name: "Email Agent", role: "Imail кампании", status: "праща 12 follow-ups", tasks: 47, color: "var(--v2-violet-2)", icon: "✉️" },
    { name: "Content Agent", role: "Постове + Reels", status: "генерира пост за IG", tasks: 5, color: "var(--v2-magenta)", icon: "📝" },
    { name: "Booking Agent", role: "Срещи + Google Meet", status: "потвърждава 2 резервации", tasks: 3, color: "#facc15", icon: "📅" },
    { name: "Analytics Agent", role: "Отчети + графики", status: "седмичен отчет готов", tasks: 1, color: "var(--v2-cyan)", icon: "📊" },
    { name: "Chat Agent", role: "Сайт + Messenger DM", status: "разговаря с 4 души", tasks: 4, color: "#fb923c", icon: "💬" },
  ];
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="v2-mono text-[10px] uppercase tracking-[0.2em] text-[var(--v2-faint)]">
          🏢 AI Екипът · оркестриран от Hermes
        </p>
        <span className="v2-mono rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.12)] px-2 py-0.5 text-[10px] text-[var(--v2-mint)]">
          7 активни · 0 почивки
        </span>
      </div>

      {/* CEO at top */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative mx-auto mb-4 flex max-w-[260px] items-center gap-3 overflow-hidden rounded-[var(--v2-r)] border border-[var(--v2-line-bright)] p-3"
        style={{
          background:
            "linear-gradient(115deg, color-mix(in srgb, var(--v2-cyan) 15%, transparent), color-mix(in srgb, var(--v2-violet) 15%, transparent))",
          boxShadow: "0 0 28px -10px var(--v2-glow-cyan)",
        }}
      >
        <span className="text-2xl">🎩</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-[var(--v2-cyan)]" style={{ fontFamily: "var(--v2-font-display)" }}>CEO Agent</p>
          <p className="text-[10px] text-[var(--v2-faint)]">Hermes · приема команди от теб</p>
        </div>
        <span className="v2-mono rounded-full bg-[var(--v2-mint)] px-1.5 py-0.5 text-[9px] font-bold text-[#04121a]">LIVE</span>
      </motion.div>

      {/* Connection lines + workers */}
      <div className="relative">
        <span aria-hidden className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-gradient-to-b from-[var(--v2-line-bright)] to-transparent" />
        <div className="grid grid-cols-2 gap-2">
          {workers.map((w, i) => (
            <motion.div
              key={w.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i + 0.2, duration: 0.35 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className="group cursor-pointer rounded-[var(--v2-r-sm)] border border-[var(--v2-line)] bg-[var(--v2-void)]/55 p-2.5 transition-colors hover:border-[var(--v2-line-bright)]"
              style={{
                boxShadow: "0 0 0 0 transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px -4px color-mix(in srgb, ${w.color} 40%, transparent)`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 0 transparent";
              }}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-[var(--v2-r-sm)] text-sm transition-transform group-hover:scale-110"
                  style={{ background: `color-mix(in srgb, ${w.color} 16%, transparent)`, color: w.color }}
                >
                  {w.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[11px] font-bold" style={{ color: w.color }}>{w.name}</p>
                  <p className="truncate text-[9px] text-[var(--v2-faint)]">{w.role}</p>
                </div>
                <span
                  className="v2-mono rounded-full px-1.5 py-0.5 text-[9px]"
                  style={{ background: `color-mix(in srgb, ${w.color} 13%, transparent)`, color: w.color }}
                >
                  {w.tasks}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="h-1 w-1 animate-pulse rounded-full"
                  style={{ background: w.color, boxShadow: `0 0 4px ${w.color}` }}
                />
                <p className="truncate text-[9px]" style={{ color: w.color }}>{w.status}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    id: "team",
    tag: "AI Екип · 7 агента",
    title: "Виртуалният ти екип, който никога не спира",
    desc: `CEO Agent (Hermes) приема командите ти и делегира на 6 специализирани работника — Sales, Email, Content, Booking, Analytics, Chat. Всеки знае работата си. Ти само водиш.`,
    accent: "var(--v2-cyan)",
    aiBadge: "7 агента · 24/7",
    savings: "екип за €0 заплати",
    render: () => <AgentTeamSlide />,
  },
  {
    id: "copilot",
    tag: "CEO Agent · команди",
    title: "Казваш — екипът прави.",
    desc: `Не пълниш форми и не цъкаш менюта. Пишеш на CEO Agent, той делегира: 'Изпрати оферти на топ 5', 'Защо паднаха продажбите?', 'Публикувай пост'. Workers вършат работата, ти само одобряваш.`,
    accent: "var(--v2-cyan)",
    aiBadge: "Делегира на workers",
    savings: "спестява 12-15ч/седмично",
    render: () => <CopilotSlide />,
  },
  {
    id: "kpi",
    tag: "Главно табло",
    title: "Виж бизнеса с 6 цифри",
    desc: "AI следи всеки сигнал — pipeline, conversion, срещи, имейли, просрочени — и подчертава какво иска внимание. С тенденция спрямо миналата седмица.",
    accent: "var(--v2-cyan)",
    aiBadge: "AI приоритизира",
    savings: "30-секунден ежедневен преглед",
    render: () => <KpiSlide />,
  },
  {
    id: "pipeline",
    tag: "Етапи на сделките",
    title: "Pipeline без догадки",
    desc: "AI премества клиентите между стадиите автоматично — според това какво се случва (среща → discovery, оферта → negotiation). Виждаш точно къде застива потока, AI ти казва защо.",
    accent: "var(--v2-mint)",
    aiBadge: "AI премества стадии",
    savings: "0 ръчно цъкане",
    render: () => <PipelineSlide />,
  },
  {
    id: "client",
    tag: "Контактна карта",
    title: "История с един клиент — AI пише обобщенията",
    desc: `Всеки имейл, разговор, среща, презентация, оферта — времева линия. AI пише кратко резюме 'последно: ... · следваща стъпка: ...' без ти да си вадиш бележник.`,
    accent: "var(--v2-mint)",
    aiBadge: "AI резюмира",
    savings: "5 мин преди всяка среща",
    render: () => <ClientTimelineSlide />,
  },
  {
    id: "bookings",
    tag: "Срещи · Google Meet",
    title: "Резервациите се случват сами",
    desc: "Клиент резервира → AI създава контакт → AI пише welcome имейл → AI генерира Google Meet линк → AI слага в календара. Ти получаваш всичко наготово.",
    accent: "var(--v2-violet-2)",
    aiBadge: "AI автоматизира 5 стъпки",
    savings: "0 секунди при резервация",
    render: () => <BookingsSlide />,
  },
  {
    id: "channels",
    tag: "Интеграции",
    title: "Всичко тече към едно място",
    desc: "Meta, Instagram, WhatsApp, Cal.com, сайт форма, имейл — всеки канал захранва CRM-а. AI слива дубликати, попълва липсваща информация, маркира приоритети.",
    accent: "#1877F2",
    aiBadge: "AI обединява канали",
    savings: "нула ръчно копиране",
    render: () => <ChannelsSlide />,
  },
  {
    id: "activity",
    tag: "Анализ · 30 дни",
    title: "Тенденцията се вижда веднага",
    desc: `Дневен пулс на действия — AI открива аномалии и пише 'миналата седмица си пратил 50% по-малко имейли'. Не разчиташ на чувство — данните говорят.`,
    accent: "#facc15",
    aiBadge: "AI спот-чек на данните",
    savings: "седмичен отчет за 0 мин",
    render: () => <ActivitySlide />,
  },
];

export function CRMShowcaseV2() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = useCallback((i: number) => {
    setActive(((i % SLIDES.length) + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(() => {
      setActive((a) => (a + 1) % SLIDES.length);
    }, 5500);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [paused]);

  const current = SLIDES[active];

  return (
    <section id="crm" className="v2-section overflow-hidden">
      {/* Engineered grid + signature aurora glow backdrop */}
      <div aria-hidden className="v2-grid pointer-events-none absolute inset-0 -z-[1]" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1]"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, var(--v2-glow-cyan) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, var(--v2-glow-violet) 0%, transparent 55%)",
          opacity: 0.14,
        }}
      />

      <div className="v2-wrap">
        {/* ---- Header ---------------------------------------------------- */}
        <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="v2-reveal" style={{ ["--d" as string]: "0.04s" }}>
            <span className="v2-eyebrow">{"// AI-управляван CRM"}</span>
            <h2 className="v2-title-plain mt-4 text-[clamp(28px,5vw,52px)] leading-[1.06]">
              Командният център
              <br />
              <span className="v2-grad">с AI на 100%</span>
            </h2>
            <p className="v2-sub mt-4">
              Системата, която изграждаме за теб — но AI върши{" "}
              <span className="font-semibold text-[var(--v2-cyan)]">90% от работата</span>.
              Лидове, сделки, срещи, имейли, реклами — всичко тече автоматично. Ти само одобряваш.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="v2-mono rounded-full border border-[rgba(52,211,153,0.3)] bg-[rgba(52,211,153,0.1)] px-3 py-1 text-[11px] text-[var(--v2-mint)]">
                ⏱️ 12-15ч/седмица спестено
              </span>
              <span className="v2-mono rounded-full border border-[var(--v2-line-bright)] bg-[color-mix(in_srgb,var(--v2-cyan)_10%,transparent)] px-3 py-1 text-[11px] text-[var(--v2-cyan)]">
                🤖 AI co-pilot · 24/7
              </span>
              <span className="v2-mono rounded-full border border-[color-mix(in_srgb,var(--v2-violet)_35%,transparent)] bg-[color-mix(in_srgb,var(--v2-violet)_12%,transparent)] px-3 py-1 text-[11px] text-[var(--v2-violet-2)]">
                📊 Real-time данни
              </span>
            </div>
          </div>

          <div className="v2-reveal flex flex-wrap items-center gap-2" style={{ ["--d" as string]: "0.12s" }}>
            <span className="v2-mono rounded-full border border-[var(--v2-line)] bg-[var(--v2-void)]/55 px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--v2-faint)]">
              {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() => goTo(active - 1)}
              className="rounded-full border border-[var(--v2-line)] bg-[var(--v2-void)]/55 px-3 py-1.5 text-sm text-[var(--v2-ink)] transition hover:border-[var(--v2-line-bright)]"
              aria-label="Предишен"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => goTo(active + 1)}
              className="rounded-full border border-[var(--v2-line)] bg-[var(--v2-void)]/55 px-3 py-1.5 text-sm text-[var(--v2-ink)] transition hover:border-[var(--v2-line-bright)]"
              aria-label="Следващ"
            >
              →
            </button>
          </div>
        </div>

        <div
          className="v2-reveal grid gap-6 lg:grid-cols-[1fr_1.6fr]"
          style={{ ["--d" as string]: "0.18s" }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Description panel */}
          <div className="v2-card v2-glow is-always group relative overflow-hidden" style={{ ["--v2-c" as string]: current.accent }}>
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 z-[1] h-1"
              style={{ background: `linear-gradient(90deg, ${current.accent} 0%, transparent 80%)` }}
            />
            <div className="relative z-[1]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <p
                      className="v2-mono text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: current.accent }}
                    >
                      {current.tag}
                    </p>
                    <span
                      className="v2-mono rounded-full border px-2 py-0.5 text-[9px] uppercase tracking-wider"
                      style={{
                        borderColor: `color-mix(in srgb, ${current.accent} 40%, transparent)`,
                        background: `color-mix(in srgb, ${current.accent} 15%, transparent)`,
                        color: current.accent,
                      }}
                    >
                      🤖 {current.aiBadge}
                    </span>
                  </div>
                  <h3
                    className="text-2xl font-bold leading-tight text-[var(--v2-ink)] md:text-3xl"
                    style={{ fontFamily: "var(--v2-font-display)" }}
                  >
                    {current.title}
                  </h3>
                  <p className="mt-4 text-sm text-[var(--v2-muted)] md:text-base">
                    {current.desc}
                  </p>
                  <div className="v2-mono mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(52,211,153,0.22)] bg-[rgba(52,211,153,0.06)] px-3 py-1 text-[11px] text-[var(--v2-mint)]">
                    <span>⏱️</span>
                    <span>{current.savings}</span>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 space-y-2">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`flex w-full items-center gap-3 rounded-[var(--v2-r-sm)] border px-3 py-2 text-left transition ${
                      i === active
                        ? "border-[var(--v2-line-bright)] bg-white/[0.04]"
                        : "border-transparent hover:border-[var(--v2-line)] hover:bg-white/[0.02]"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{
                        background: i === active ? s.accent : "rgba(255,255,255,0.2)",
                        boxShadow: i === active ? `0 0 8px ${s.accent}` : undefined,
                      }}
                    />
                    <span
                      className={`flex-1 text-xs ${
                        i === active
                          ? "font-medium text-[var(--v2-ink)]"
                          : "text-[var(--v2-faint)]"
                      }`}
                    >
                      {s.tag}
                    </span>
                    {i === active && (
                      <motion.span
                        className="h-0.5 w-6 rounded-full"
                        style={{ background: s.accent }}
                        layoutId="active-pill-v2"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Mockup window */}
          <div
            className="relative overflow-hidden rounded-[var(--v2-r)] border border-[var(--v2-line)] bg-[var(--v2-bg-2)]/70"
            style={{ boxShadow: "var(--v2-shadow-card), 0 0 60px -20px var(--v2-glow-cyan)" }}
          >
            {/* Living neural core breathing behind the chrome */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 opacity-40"
            >
              <NeuralCore radius={1.2} nodeCount={160} spin={0.6} />
            </div>

            {/* Browser-style chrome */}
            <div className="relative flex items-center justify-between border-b border-[var(--v2-line)] bg-[var(--v2-void)]/55 px-4 py-2.5">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--v2-mint)]/60" />
              </div>
              <span className="v2-mono text-[10px] text-[var(--v2-faint)]">
                promarketing.pw/admin · {current.tag.toLowerCase()}
              </span>
              <span
                className="v2-mono flex items-center gap-1.5 text-[9px] uppercase tracking-wider"
                style={{ color: current.accent }}
              >
                <span
                  className="h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ background: current.accent, boxShadow: `0 0 6px ${current.accent}` }}
                />
                на живо
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative min-h-[420px]"
              >
                {current.render()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex items-center gap-2">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => goTo(i)}
              className="group relative flex-1 overflow-hidden rounded-full bg-white/[0.04]"
              aria-label={`Слайд ${i + 1}`}
            >
              <span className="block h-1 w-full">
                {i === active && !paused && (
                  <motion.span
                    key={`bar-${active}`}
                    className="block h-full origin-left rounded-full"
                    style={{ background: s.accent, boxShadow: `0 0 10px color-mix(in srgb, ${s.accent} 60%, transparent)` }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 5.5, ease: "linear" }}
                  />
                )}
                {i < active && (
                  <span className="block h-full w-full rounded-full" style={{ background: `color-mix(in srgb, ${s.accent} 33%, transparent)` }} />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
