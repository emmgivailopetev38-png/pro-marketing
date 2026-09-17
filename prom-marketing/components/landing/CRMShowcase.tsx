"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SectionReveal } from "@/components/effects/SectionReveal";

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
    { name: "Спечелени", count: 12, color: "#22c55e" },
    { name: "Преговори", count: 4, color: "#fb923c" },
    { name: "Оферти", count: 7, color: "#facc15" },
    { name: "Презентации", count: 6, color: "#ec4899" },
    { name: "Discovery", count: 11, color: "#00d4ff" },
    { name: "В контакт", count: 18, color: "#a78bfa" },
    { name: "Lead", count: 23, color: "#7da8cc" },
  ];
  const max = stages.reduce((m, s) => Math.max(m, s.count), 0);
  return (
    <div className="space-y-3 p-6">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          81 активни сделки · €124,500 pipeline
        </p>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
          ▲ 18% · 7 дни
        </span>
      </div>
      {stages.map((s) => (
        <div key={s.name}>
          <div className="mb-1 flex items-center justify-between text-[11px]">
            <span style={{ color: s.color }} className="font-mono uppercase tracking-wider">
              {s.name}
            </span>
            <span className="text-[var(--color-text-tertiary)]">{s.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(s.count / max) * 100}%` }}
              transition={{ duration: 1, delay: 0.05, ease: "easeOut" }}
              style={{ background: s.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function KpiSlide() {
  const cards: Array<{ label: string; value: string; hint: string; color: string; delta: string }> = [
    { label: "Активни клиенти", value: "81", hint: "новo: +14", color: "#06b6d4", delta: "▲ 8" },
    { label: "Conversion", value: "42%", hint: "12 от 28 спечелени", color: "#22c55e", delta: "▲ 5" },
    { label: "Pipeline €", value: "€124,500", hint: "оферти + преговори", color: "#facc15", delta: "▲ €18k" },
    { label: "Срещи / месец", value: "23", hint: "проведени", color: "#a78bfa", delta: "▲ 7" },
    { label: "Имейли / 7д", value: "47", hint: "пратени", color: "#ec4899", delta: "▲ 12" },
    { label: "Просрочени", value: "0", hint: "всичко чисто", color: "#22c55e", delta: "—" },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 p-6 md:grid-cols-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 * i, duration: 0.4 }}
          className="rounded-lg border border-white/10 bg-black/40 p-3"
        >
          <div className="flex items-center justify-between">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">
              {c.label}
            </p>
            <span className="font-mono text-[9px] text-emerald-300">{c.delta}</span>
          </div>
          <p className="mt-1 text-2xl font-bold" style={{ color: c.color }}>
            {c.value}
          </p>
          <p className="text-[10px] text-[var(--color-text-tertiary)]">{c.hint}</p>
        </motion.div>
      ))}
    </div>
  );
}

function ClientTimelineSlide() {
  // Demo timeline — fictional client. Real CRM activities live in /admin only.
  const activities: Array<{ icon: string; title: string; time: string; color: string }> = [
    { icon: "🤝", title: "Среща проведена · 45 мин", time: "днес 14:00", color: "#22c55e" },
    { icon: "💎", title: "Оферта изпратена · €2,000", time: "вчера 11:20", color: "#facc15" },
    { icon: "🎯", title: "Презентация пратена", time: "преди 2 дни", color: "#ec4899" },
    { icon: "📅", title: "Cal.com резервация", time: "преди 3 дни", color: "#a78bfa" },
    { icon: "✉️", title: "Welcome имейл", time: "преди 3 дни", color: "#06b6d4" },
    { icon: "📥", title: "Meta lead → CRM", time: "преди 4 дни", color: "#1877F2" },
  ];
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
          МС
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">Мария Стоянова</p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">Био магазин · €1,500 сделка</p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-emerald-300">
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
            className="relative flex items-center gap-3 rounded-md border border-white/5 bg-white/[0.02] py-2 pl-2 pr-3"
          >
            <span
              className="z-10 flex h-7 w-7 items-center justify-center rounded-full text-sm"
              style={{ background: `${a.color}30`, color: a.color }}
            >
              {a.icon}
            </span>
            <p className="flex-1 text-xs text-[var(--color-text-secondary)]">{a.title}</p>
            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{a.time}</span>
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
    { name: "Мария Стоянова", biz: "Био магазин · онлайн", when: "пон · 10:00", color: "#22c55e" },
    { name: "Николай Димитров", biz: "Туристическа агенция", when: "вто · 14:30", color: "#22c55e" },
    { name: "Елена Тодорова", biz: "Бутик за бижута", when: "сря · 11:00", color: "#a78bfa" },
  ];
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          📅 Предстоящи срещи · Google Meet
        </p>
        <div className="inline-flex rounded-md border border-white/10 bg-black/40 p-0.5">
          <span className="rounded-sm bg-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
            Предстоящи · 3
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono text-[var(--color-text-tertiary)]">
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
            className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <span className="text-lg">📅</span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{b.name}</p>
              <p className="truncate text-[11px] text-[var(--color-text-tertiary)]">{b.biz}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-mono text-emerald-300">{b.when}</p>
              <p className="text-[10px] text-cyan-400">отвори meet →</p>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 p-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-mono">
            Auto-flow при нова резервация
          </p>
          <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
            Webhook → Контакт → Welcome имейл → Google Meet
          </p>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
          активно
        </span>
      </div>
    </div>
  );
}

function ChannelsSlide() {
  const channels: Array<{ name: string; status: string; count: string; color: string; icon: string }> = [
    { name: "Meta лидове (Facebook/IG)", status: "Синхронизация на живо", count: "127 / месец", color: "#1877F2", icon: "📥" },
    { name: "Cal.com резервации", status: "Webhook активен", count: "23 / месец", color: "#06b6d4", icon: "📅" },
    { name: "Сайт форма", status: "Свързана", count: "14 / месец", color: "#22c55e", icon: "🌐" },
    { name: "Welcome имейли", status: "Resend / auto", count: "47 / 7 дни", color: "#a78bfa", icon: "✉️" },
    { name: "Google Meet линкове", status: "Auto-генерация", count: "23 / месец", color: "#facc15", icon: "🎥" },
    { name: "Чатбот · сайт", status: "В подготовка", count: "—", color: "#ec4899", icon: "💬" },
  ];
  return (
    <div className="p-6">
      <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
        🔌 Интегрирани канали · 6 системи
      </p>
      <div className="space-y-2">
        {channels.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.06 * i, duration: 0.3 }}
            className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/40 p-3"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-lg text-base"
              style={{ background: `${c.color}25`, color: c.color }}
            >
              {c.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">{c.name}</p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">{c.status}</p>
            </div>
            <span className="font-mono text-[11px] text-[var(--color-text-secondary)]">{c.count}</span>
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
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          📈 Активност · 30 дни
        </p>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-[var(--color-text-secondary)]">общо <span className="font-mono text-cyan-300">374</span></span>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-emerald-300">
            ▲ 67%
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-black/40 p-4">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-32 w-full">
          <defs>
            <linearGradient id="crm-spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#crm-spark)" />
          <motion.path
            d={line}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.6, ease: "easeOut" }}
          />
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Имейли", value: 142, color: "#a78bfa" },
          { label: "Срещи", value: 23, color: "#22c55e" },
          { label: "Бележки", value: 96, color: "#facc15" },
        ].map((b) => (
          <div key={b.label} className="rounded-md border border-white/10 bg-black/30 p-2">
            <p className="font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              {b.label}
            </p>
            <p className="mt-0.5 text-xl font-bold" style={{ color: b.color }}>
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
      color: "#22c55e",
    },
    {
      user: `Защо продажбите паднаха миналата седмица?`,
      ai: `Analytics Agent проверява · открих 3 причини: 27% по-малко срещи, 40% по-нисък email open rate, 2 lost клиента в negotiating. Готвя отчет.`,
      agent: "→ Analytics Agent",
      color: "#06b6d4",
    },
    {
      user: `Публикувай идея за пост във FB и IG за CRM системите`,
      ai: `Content Agent композира 3 варианта (текст + изображения от Midjourney) · одобри в /admin/social.`,
      agent: "→ Content Agent",
      color: "#a78bfa",
    },
  ];
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          🎩 CEO Agent · говориш с шефа
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
          <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
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
              <div className="max-w-[80%] rounded-2xl rounded-br-md bg-cyan-500/90 px-3 py-2 text-xs text-black">
                {c.user}
              </div>
            </div>
            <div className="flex flex-col items-start">
              <span
                className="mb-1 ml-2 font-mono text-[9px] uppercase tracking-wider"
                style={{ color: c.color }}
              >
                {c.agent}
              </span>
              <div
                className="max-w-[85%] rounded-2xl rounded-bl-md border px-3 py-2 text-xs"
                style={{ borderColor: `${c.color}40`, background: `${c.color}10`, color: c.color }}
              >
                <span className="mr-1">✓</span>
                {c.ai}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-center">
        <p className="text-[11px] text-emerald-300">
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
    { name: "Sales Agent", role: "Оферти + договори", status: "пише оферта · 3:42", tasks: 8, color: "#22c55e", icon: "🎯" },
    { name: "Email Agent", role: "Imail кампании", status: "праща 12 follow-ups", tasks: 47, color: "#a78bfa", icon: "✉️" },
    { name: "Content Agent", role: "Постове + Reels", status: "генерира пост за IG", tasks: 5, color: "#ec4899", icon: "📝" },
    { name: "Booking Agent", role: "Срещи + Google Meet", status: "потвърждава 2 резервации", tasks: 3, color: "#facc15", icon: "📅" },
    { name: "Analytics Agent", role: "Отчети + графики", status: "седмичен отчет готов", tasks: 1, color: "#06b6d4", icon: "📊" },
    { name: "Chat Agent", role: "Сайт + Messenger DM", status: "разговаря с 4 души", tasks: 4, color: "#fb923c", icon: "💬" },
  ];
  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
          🏢 AI Екипът · оркестриран от Hermes
        </p>
        <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
          7 активни · 0 почивки
        </span>
      </div>

      {/* CEO at top */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-4 flex max-w-[260px] items-center gap-3 rounded-xl border-2 border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 p-3"
      >
        <span className="text-2xl">🎩</span>
        <div className="flex-1">
          <p className="text-sm font-bold text-cyan-300">CEO Agent</p>
          <p className="text-[10px] text-[var(--color-text-tertiary)]">Hermes · приема команди от теб</p>
        </div>
        <span className="rounded-full bg-emerald-400 px-1.5 py-0.5 text-[9px] font-mono font-bold text-black">LIVE</span>
      </motion.div>

      {/* Connection lines + workers */}
      <div className="relative">
        <span aria-hidden className="absolute left-1/2 top-0 h-3 w-px -translate-x-1/2 bg-gradient-to-b from-cyan-500/50 to-transparent" />
        <div className="grid grid-cols-2 gap-2">
          {workers.map((w, i) => (
            <motion.div
              key={w.name}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i + 0.2, duration: 0.35 }}
              whileHover={{ y: -2, scale: 1.02 }}
              className="group cursor-pointer rounded-lg border border-white/10 bg-black/40 p-2.5 transition-colors hover:border-white/30"
              style={{
                boxShadow: "0 0 0 0 transparent",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px -4px ${w.color}40`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 0 transparent";
              }}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-sm transition-transform group-hover:scale-110"
                  style={{ background: `${w.color}25`, color: w.color }}
                >
                  {w.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[11px] font-bold" style={{ color: w.color }}>{w.name}</p>
                  <p className="truncate text-[9px] text-[var(--color-text-tertiary)]">{w.role}</p>
                </div>
                <span
                  className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
                  style={{ background: `${w.color}15`, color: w.color }}
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
    accent: "#06b6d4",
    aiBadge: "7 агента · 24/7",
    savings: "екип за €0 заплати",
    render: () => <AgentTeamSlide />,
  },
  {
    id: "copilot",
    tag: "CEO Agent · команди",
    title: "Казваш — екипът прави.",
    desc: `Не пълниш форми и не цъкаш менюта. Пишеш на CEO Agent, той делегира: 'Изпрати оферти на топ 5', 'Защо паднаха продажбите?', 'Публикувай пост'. Workers вършат работата, ти само одобряваш.`,
    accent: "#06b6d4",
    aiBadge: "Делегира на workers",
    savings: "спестява 12-15ч/седмично",
    render: () => <CopilotSlide />,
  },
  {
    id: "kpi",
    tag: "Главно табло",
    title: "Виж бизнеса с 6 цифри",
    desc: "AI следи всеки сигнал — pipeline, conversion, срещи, имейли, просрочени — и подчертава какво иска внимание. С тенденция спрямо миналата седмица.",
    accent: "#06b6d4",
    aiBadge: "AI приоритизира",
    savings: "30-секунден ежедневен преглед",
    render: () => <KpiSlide />,
  },
  {
    id: "pipeline",
    tag: "Етапи на сделките",
    title: "Pipeline без догадки",
    desc: "AI премества клиентите между стадиите автоматично — според това какво се случва (среща → discovery, оферта → negotiation). Виждаш точно къде застива потока, AI ти казва защо.",
    accent: "#22c55e",
    aiBadge: "AI премества стадии",
    savings: "0 ръчно цъкане",
    render: () => <PipelineSlide />,
  },
  {
    id: "client",
    tag: "Контактна карта",
    title: "История с един клиент — AI пише обобщенията",
    desc: `Всеки имейл, разговор, среща, презентация, оферта — времева линия. AI пише кратко резюме 'последно: ... · следваща стъпка: ...' без ти да си вадиш бележник.`,
    accent: "#22c55e",
    aiBadge: "AI резюмира",
    savings: "5 мин преди всяка среща",
    render: () => <ClientTimelineSlide />,
  },
  {
    id: "bookings",
    tag: "Срещи · Google Meet",
    title: "Резервациите се случват сами",
    desc: "Клиент резервира → AI създава контакт → AI пише welcome имейл → AI генерира Google Meet линк → AI слага в календара. Ти получаваш всичко наготово.",
    accent: "#a78bfa",
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

export function CRMShowcase() {
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
    <section
      id="crm"
      className="relative overflow-hidden border-y border-[var(--color-border-default)] py-32"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 20%, rgba(6,182,212,0.06) 0%, transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(124,58,237,0.06) 0%, transparent 55%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionReveal>
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                </span>
                {"// AI-управляван CRM"}
              </p>
              <h2 className="font-display text-[clamp(28px,5vw,52px)] font-semibold leading-[1.06] tracking-tight">
                Командният център<br />
                <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  с AI на 100%
                </span>
              </h2>
              <p className="mt-4 max-w-xl text-sm text-[var(--color-text-secondary)] md:text-base">
                Системата, която изграждаме за теб — но AI върши <span className="text-[var(--color-accent-cyan)]">90% от работата</span>.
                Лидове, сделки, срещи, имейли, реклами — всичко тече автоматично. Ти само одобряваш.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] text-emerald-300">
                  ⏱️ 12-15ч/седмица спестено
                </span>
                <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-300">
                  🤖 AI co-pilot · 24/7
                </span>
                <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-[11px] text-violet-300">
                  📊 Real-time данни
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                {String(active + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                onClick={() => goTo(active - 1)}
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm transition hover:border-cyan-500/40"
                aria-label="Предишен"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => goTo(active + 1)}
                className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-sm transition hover:border-cyan-500/40"
                aria-label="Следващ"
              >
                →
              </button>
            </div>
          </div>
        </SectionReveal>

        <SectionReveal>
          <div
            className="grid gap-6 lg:grid-cols-[1fr_1.6fr]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* Description panel */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-6 md:p-8">
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1"
                style={{ background: `linear-gradient(90deg, ${current.accent} 0%, transparent 80%)` }}
              />
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
                      className="font-mono text-[10px] uppercase tracking-[0.2em]"
                      style={{ color: current.accent }}
                    >
                      {current.tag}
                    </p>
                    <span
                      className="rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider"
                      style={{
                        borderColor: `${current.accent}40`,
                        background: `${current.accent}15`,
                        color: current.accent,
                      }}
                    >
                      🤖 {current.aiBadge}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl font-bold leading-tight md:text-3xl">
                    {current.title}
                  </h3>
                  <p className="mt-4 text-sm text-[var(--color-text-secondary)] md:text-base">
                    {current.desc}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[11px] text-emerald-300">
                    <span>⏱️</span>
                    <span className="font-mono">{current.savings}</span>
                  </div>
                </motion.div>
              </AnimatePresence>

              <div className="mt-8 space-y-2">
                {SLIDES.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(i)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                      i === active
                        ? "border-white/20 bg-white/[0.04]"
                        : "border-transparent hover:border-white/10 hover:bg-white/[0.02]"
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
                          ? "font-medium text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      {s.tag}
                    </span>
                    {i === active && (
                      <motion.span
                        className="h-0.5 w-6 rounded-full"
                        style={{ background: s.accent }}
                        layoutId="active-pill"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Mockup window */}
            <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/60 shadow-[0_0_60px_-20px_rgba(6,182,212,0.3)]">
              {/* Browser-style chrome */}
              <div className="flex items-center justify-between border-b border-white/5 bg-black/40 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                </div>
                <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">
                  promarketing.pw/admin · {current.tag.toLowerCase()}
                </span>
                <span
                  className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider"
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
                  className="min-h-[420px]"
                >
                  {current.render()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </SectionReveal>

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
                    style={{ background: s.accent }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 5.5, ease: "linear" }}
                  />
                )}
                {i < active && (
                  <span className="block h-full w-full rounded-full" style={{ background: `${s.accent}55` }} />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
