"use client";

import { motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ------------------------------------------------------------------ */
/*  Типове                                                             */
/* ------------------------------------------------------------------ */

type Accent = "cyan" | "sky" | "amber" | "emerald";

interface AccentTokens {
  readonly color: string;
  /** rgb тройка за rgba() миксове */
  readonly rgb: string;
}

interface Agent {
  readonly id: string;
  /** кодово име, главни букви */
  readonly code: string;
  /** роля — един ред */
  readonly role: string;
  /** жив статус — "сега: …" */
  readonly status: string;
  /** мъничка метрика (число) */
  readonly metricValue: string;
  /** етикет на метриката */
  readonly metricLabel: string;
  readonly glyph: string;
  readonly accent: Accent;
}

/* ------------------------------------------------------------------ */
/*  Акцентни токени                                                    */
/* ------------------------------------------------------------------ */

const ACCENTS: Record<Accent, AccentTokens> = {
  cyan: { color: "var(--color-accent-cyan)", rgb: "34,211,238" },
  sky: { color: "var(--color-accent-sky)", rgb: "56,189,248" },
  amber: { color: "var(--color-accent-amber)", rgb: "251,146,60" },
  emerald: { color: "var(--color-accent-emerald)", rgb: "52,211,153" },
} as const;

/* ------------------------------------------------------------------ */
/*  Данни — работещите агенти (фиксирани, илюстративни)                */
/* ------------------------------------------------------------------ */

const AGENTS: readonly Agent[] = [
  {
    id: "oferta",
    code: "ОФЕРТА",
    role: "Пише и праща оферта след разговора",
    status: "сега: генерира оферта #4821",
    metricValue: "312",
    metricLabel: "оферти / мес",
    glyph: "✎",
    accent: "sky",
  },
  {
    id: "followup",
    code: "FOLLOW-UP",
    role: "Гони застоялите оферти",
    status: "сега: напомня по 9 оферти",
    metricValue: "+38%",
    metricLabel: "приети повече",
    glyph: "➤",
    accent: "emerald",
  },
  {
    id: "amazon",
    code: "AMAZON",
    role: "Чете settlement имейлите и внася поръчките",
    status: "сега: обработва settlement",
    metricValue: "Live",
    metricLabel: "синхрон с инбокс",
    glyph: "✉",
    accent: "amber",
  },
  {
    id: "sklad",
    code: "СКЛАД",
    role: "Следи наличности и суровини",
    status: "сега: проверява ламарина",
    metricValue: "0",
    metricLabel: "под минимум",
    glyph: "▣",
    accent: "cyan",
  },
  {
    id: "ceh",
    code: "ЦЕХ",
    role: "Следи етапите на производството",
    status: "сега: 14 поръчки в процес",
    metricValue: "14",
    metricLabel: "активни на линия",
    glyph: "◈",
    accent: "sky",
  },
  {
    id: "srok",
    code: "СРОК",
    role: "AI прогноза кога е готова поръчката",
    status: "сега: преизчислява срокове",
    metricValue: "96%",
    metricLabel: "точна прогноза",
    glyph: "◷",
    accent: "emerald",
  },
  {
    id: "faktura",
    code: "ФАКТУРА",
    role: "Издава и праща документи",
    status: "сега: издава фактура #2207",
    metricValue: "100%",
    metricLabel: "без забавяне",
    glyph: "▦",
    accent: "cyan",
  },
  {
    id: "otchet",
    code: "ОТЧЕТ",
    role: "Дневен и седмичен репорт",
    status: "сега: сглобява дневен отчет",
    metricValue: "07:00",
    metricLabel: "всяка сутрин",
    glyph: "▤",
    accent: "sky",
  },
  {
    id: "klient",
    code: "КЛИЕНТ",
    role: "Досие и история на всеки клиент",
    status: "сега: обновява досие",
    metricValue: "3 940",
    metricLabel: "карти клиенти",
    glyph: "◉",
    accent: "amber",
  },
  {
    id: "dispecher",
    code: "ДИСПЕЧЕР",
    role: "Разпределя задачите към хората",
    status: "сега: насочва 6 задачи",
    metricValue: "6",
    metricLabel: "в опашката",
    glyph: "⤳",
    accent: "emerald",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Малки под-компоненти                                               */
/* ------------------------------------------------------------------ */

/** Жив индикатор за активност — пулсиращо ядро + ринг (CSS, не JS). */
function LiveDot({ accent, reduced }: { accent: AccentTokens; reduced: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5" aria-hidden>
      {!reduced && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ background: accent.color }}
        />
      )}
      <span
        className="relative inline-flex h-2.5 w-2.5 rounded-full"
        style={{ background: accent.color, boxShadow: `0 0 10px ${accent.color}` }}
      />
    </span>
  );
}

/** Три streaming точки — една споделена motion анимация на точка. */
function StreamingDots({ accent, reduced }: { accent: AccentTokens; reduced: boolean }) {
  if (reduced) {
    return (
      <span className="inline-flex gap-1" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1 w-1 rounded-full"
            style={{ background: accent.color, opacity: 0.5 }}
          />
        ))}
      </span>
    );
  }
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1 w-1 rounded-full"
          style={{ background: accent.color }}
          animate={{ opacity: [0.25, 1, 0.25] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.18,
          }}
        />
      ))}
    </span>
  );
}

/** Тънка прогрес-лента с движещ се блик (CSS animation). */
function ActivityBar({
  accent,
  fill,
  reduced,
}: {
  accent: AccentTokens;
  fill: number;
  reduced: boolean;
}) {
  return (
    <div
      className="relative h-1 w-full overflow-hidden rounded-full"
      style={{ background: `rgba(${accent.rgb},0.14)` }}
      aria-hidden
    >
      <div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{
          width: `${fill}%`,
          background: `linear-gradient(90deg, rgba(${accent.rgb},0.35), ${accent.color})`,
        }}
      />
      {!reduced && (
        <div
          className="agentswarm-sheen absolute inset-y-0 w-1/3"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${accent.rgb},0.55), transparent)`,
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Карта на агент                                                     */
/* ------------------------------------------------------------------ */

/** Детерминистична запълненост за прогрес-лентата (без random при render). */
const FILLS: readonly number[] = [82, 64, 71, 58, 90, 47, 76, 88, 69, 54, 61, 73];

function AgentCard({ agent, index }: { agent: Agent; index: number }) {
  const reduced = useReducedMotion();
  const accent = ACCENTS[agent.accent];
  const fill = FILLS[index % FILLS.length];

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.05, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border p-5 transition-transform duration-300 will-change-transform hover:-translate-y-1"
      style={{
        borderColor: "var(--color-border-default)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* Светещ ъглов halo при hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: `radial-gradient(circle, ${accent.color} 0%, transparent 70%)` }}
      />
      {/* Тънка светеща горна линия */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-40 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent.color}, transparent)`,
        }}
      />

      <div className="relative flex flex-1 flex-col">
        {/* Header: глиф + код + жив индикатор */}
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-base"
            style={{
              borderColor: `rgba(${accent.rgb},0.34)`,
              color: accent.color,
              background: `rgba(${accent.rgb},0.08)`,
            }}
            aria-hidden
          >
            {agent.glyph}
          </span>

          <div className="min-w-0 flex-1">
            <p
              className="truncate font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em]"
              style={{ color: accent.color }}
            >
              Агент
            </p>
            <h3 className="truncate font-[family-name:var(--font-editorial)] text-base font-extrabold leading-tight text-[var(--color-text-primary)]">
              {agent.code}
            </h3>
          </div>

          <LiveDot accent={accent} reduced={reduced} />
        </div>

        {/* Роля */}
        <p className="mt-3 text-[13px] leading-snug text-[var(--color-text-secondary)]">
          {agent.role}
        </p>

        {/* Жив статус-ред */}
        <div
          className="mt-4 flex items-center gap-2 rounded-xl border px-3 py-2"
          style={{
            borderColor: `rgba(${accent.rgb},0.18)`,
            background: `rgba(${accent.rgb},0.05)`,
          }}
        >
          <StreamingDots accent={accent} reduced={reduced} />
          <span className="truncate font-[family-name:var(--font-mono)] text-[11px] tracking-[0.04em] text-[var(--color-text-secondary)]">
            {agent.status}
          </span>
        </div>

        {/* Метрика + прогрес */}
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <div
              className="font-[family-name:var(--font-mono)] text-xl font-bold leading-none"
              style={{ color: accent.color }}
            >
              {agent.metricValue}
            </div>
            <div className="mt-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
              {agent.metricLabel}
            </div>
          </div>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accent.color }}
          >
            ● онлайн
          </span>
        </div>

        <div className="mt-3">
          <ActivityBar accent={accent} fill={fill} reduced={reduced} />
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/*  HERMES — оркестраторът (специална, голяма карта)                   */
/* ------------------------------------------------------------------ */

interface OrchestratedTask {
  readonly to: string;
  readonly text: string;
}

const HERMES_FEED: readonly OrchestratedTask[] = [
  { to: "ОФЕРТА", text: "нова оферта за ВентАир → готова" },
  { to: "FOLLOW-UP", text: "оферта #4821 застояла → напомни" },
  { to: "ДИСПЕЧЕР", text: "монтаж в Пловдив → насочи към екип B" },
  { to: "AMAZON", text: "нов settlement имейл → внеси 7 поръчки" },
] as const;

function HermesCard() {
  const reduced = useReducedMotion();
  const accent = ACCENTS.cyan;

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="group relative col-span-full overflow-hidden rounded-3xl border p-6 md:p-9 lg:col-span-2"
      style={{
        borderColor: "var(--color-border-bright)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Двоен ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 12% 0%, rgba(34,211,238,0.14) 0%, transparent 55%), radial-gradient(ellipse at 100% 120%, rgba(56,189,248,0.12) 0%, transparent 55%)",
        }}
      />
      {/* Скенираща линия — една от ограничените безкрайни анимации */}
      {!reduced && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 w-1/4"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(34,211,238,0.12), transparent)",
          }}
          initial={{ x: "-130%" }}
          animate={{ x: "520%" }}
          transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        {/* Лява част: халюстриращ ринг + идентичност */}
        <div className="flex flex-col items-start">
          <div className="flex items-center gap-2">
            <span
              className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em]"
              style={{ color: accent.color }}
            >
              Оркестратор
            </span>
            <LiveDot accent={accent} reduced={reduced} />
          </div>

          {/* Халюстриращ ринг */}
          <div className="relative mt-6 h-36 w-36">
            {/* Външен ротиращ ринг (2-ра ограничена безкрайна анимация) */}
            {!reduced ? (
              <motion.div
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(from 0deg, transparent, rgba(${accent.rgb},0.0) 35%, ${accent.color} 50%, rgba(${accent.rgb},0.0) 65%, transparent)`,
                  WebkitMask:
                    "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
                  mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 3px))",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              <div
                aria-hidden
                className="absolute inset-0 rounded-full border"
                style={{ borderColor: `rgba(${accent.rgb},0.4)` }}
              />
            )}

            {/* Статични орбитни рингове */}
            <div
              aria-hidden
              className="absolute inset-2 rounded-full border"
              style={{ borderColor: `rgba(${accent.rgb},0.16)` }}
            />
            <div
              aria-hidden
              className="absolute inset-6 rounded-full border"
              style={{ borderColor: `rgba(${accent.rgb},0.12)` }}
            />

            {/* Ядро */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-3xl"
                style={{
                  color: accent.color,
                  background: `radial-gradient(circle, rgba(${accent.rgb},0.18), rgba(${accent.rgb},0.04))`,
                  boxShadow: `0 0 36px rgba(${accent.rgb},0.35), inset 0 0 18px rgba(${accent.rgb},0.20)`,
                }}
                aria-hidden
              >
                ◈
              </div>
            </div>
          </div>

          <h3 className="mt-6 font-[family-name:var(--font-editorial)] text-3xl font-extrabold leading-none text-[var(--color-text-primary)] md:text-4xl">
            HERMES
          </h3>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Диригентът. Оркестрира агентите, говори на чист български и решава кой
            какво да поеме — в реално време.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <HermesTag accent={accent}>дирижира екипа</HermesTag>
            <HermesTag accent={accent}>говори български</HermesTag>
          </div>
        </div>

        {/* Дясна част: жив поток от команди */}
        <div
          className="rounded-2xl border p-4 md:p-5"
          style={{
            borderColor: "var(--color-border-default)",
            background: "rgba(5,8,14,0.45)",
          }}
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
              Жив поток на задачите
            </span>
            <StreamingDots accent={accent} reduced={reduced} />
          </div>

          <ul className="space-y-2.5">
            {HERMES_FEED.map((task, i) => (
              <motion.li
                key={task.to}
                initial={reduced ? false : { opacity: 0, x: 12 }}
                whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: 0.15 + i * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                style={{
                  borderColor: "var(--color-border-default)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <span
                  aria-hidden
                  className="font-[family-name:var(--font-mono)] text-xs"
                  style={{ color: accent.color }}
                >
                  →
                </span>
                <span
                  className="shrink-0 rounded-md px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em]"
                  style={{
                    color: accent.color,
                    background: `rgba(${accent.rgb},0.10)`,
                    border: `1px solid rgba(${accent.rgb},0.22)`,
                  }}
                >
                  {task.to}
                </span>
                <span className="truncate text-[12px] leading-snug text-[var(--color-text-secondary)]">
                  {task.text}
                </span>
              </motion.li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between">
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
              латентност
            </span>
            <span
              className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em]"
              style={{ color: accent.color }}
            >
              ◷ под 1 сек
            </span>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function HermesTag({ children, accent }: { children: ReactNode; accent: AccentTokens }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.1em] text-[var(--color-text-secondary)]"
      style={{
        borderColor: `rgba(${accent.rgb},0.24)`,
        background: `rgba(${accent.rgb},0.05)`,
      }}
    >
      <span aria-hidden style={{ color: accent.color }}>
        ✦
      </span>
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function AgentSwarm() {
  const reduced = useReducedMotion();

  const headStyle: CSSProperties = {
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <section
      id="agenti"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 0%, rgba(34,211,238,0.07) 0%, transparent 55%), radial-gradient(ellipse at 0% 90%, rgba(56,189,248,0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        {/* Eyebrow */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={headStyle}
          className="flex items-center gap-2.5"
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            {!reduced && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-cyan)] opacity-70" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-cyan)]" />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
            Твоят екип от AI агенти
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.05] text-[var(--color-text-primary)]"
        >
          <span className="text-[var(--color-accent-cyan)]">Агентите</span>, които
          работят за теб
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Всеки агент поема една рутинна задача от твоя бизнес и я върши без пауза.
          Заедно стават екип, който работи денонощно — а HERMES ги дирижира.
        </motion.p>

        {/* Грид с агенти */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* HERMES заема 2 колони на lg, цял ред под това */}
          <HermesCard />
          {AGENTS.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>

        {/* Долен ред: обобщение */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="mt-6 flex flex-col items-center justify-center gap-2 rounded-2xl border px-6 py-5 text-center sm:flex-row sm:gap-3"
          style={{
            borderColor: "var(--color-border-default)",
            background: "var(--color-bg-glass)",
          }}
        >
          <span className="font-[family-name:var(--font-mono)] text-sm tracking-[0.06em] text-[var(--color-text-secondary)]">
            <span className="font-bold text-[var(--color-accent-emerald)]">Цял екип</span>{" "}
            агенти ·{" "}
            <span className="font-bold text-[var(--color-accent-cyan)]">един</span>{" "}
            диригент ·{" "}
            <span className="font-bold text-[var(--color-accent-sky)]">24/7</span> без
            почивни дни
          </span>
        </motion.div>
      </div>

      {/* Локални keyframes за движещия се блик на прогрес-лентите */}
      <style>{`
        @keyframes agentswarm-sheen {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
        .agentswarm-sheen {
          animation: agentswarm-sheen 2.6s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .agentswarm-sheen { animation: none; display: none; }
        }
      `}</style>
    </section>
  );
}
