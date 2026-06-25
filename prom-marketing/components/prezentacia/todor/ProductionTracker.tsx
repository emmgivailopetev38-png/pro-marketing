"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CounterRamp } from "@/components/effects/CounterRamp";

/* ------------------------------------------------------------------ */
/*  Типове                                                             */
/* ------------------------------------------------------------------ */

type Accent = "cyan" | "sky" | "amber" | "emerald";

interface AccentTokens {
  readonly color: string;
  /** rgb тройка за rgba() миксове */
  readonly rgb: string;
}

interface Stage {
  readonly id: string;
  /** име на етапа */
  readonly name: string;
  /** глиф-икона */
  readonly glyph: string;
  /** акцент на колоната */
  readonly accent: Accent;
}

interface Job {
  readonly id: string;
  /** код на поръчката (mono) */
  readonly code: string;
  /** клиент / артикул */
  readonly title: string;
  /** брой бройки */
  readonly qty: string;
  /** индекс на етапа в STAGES (0..5) */
  readonly stage: number;
  /** прогрес 0..100 за текущия етап */
  readonly progress: number;
  /** AI прогноза за готовност */
  readonly eta: string;
  /** канал на поръчката */
  readonly channel: "Телефон" | "Amazon";
  /** последно чекиране по станция (QR) */
  readonly lastScan: string;
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
/*  Данни — етапите на цеха (фиксирани, илюстративни)                  */
/* ------------------------------------------------------------------ */

const STAGES: readonly Stage[] = [
  { id: "zaiavka", name: "Заявка", glyph: "◈", accent: "sky" },
  { id: "riazane", name: "Рязане", glyph: "▰", accent: "cyan" },
  { id: "zavariavane", name: "Заваряване", glyph: "✦", accent: "amber" },
  { id: "boiadisvane", name: "Боядисване", glyph: "❖", accent: "sky" },
  { id: "opakovane", name: "Опаковане", glyph: "▦", accent: "cyan" },
  { id: "gotovo", name: "Готово", glyph: "✓", accent: "emerald" },
] as const;

const JOBS: readonly Job[] = [
  {
    id: "j-1",
    code: "ORD-4821",
    title: "Стойки за климатик · инокс",
    qty: "120 бр.",
    stage: 0,
    progress: 22,
    eta: "AI срок: четвъртък 11:00",
    channel: "Телефон",
    lastScan: "приета · 08:12",
  },
  {
    id: "j-2",
    code: "ORD-4807",
    title: "Вентилационни решетки",
    qty: "300 бр.",
    stage: 1,
    progress: 64,
    eta: "AI срок: утре 15:00",
    channel: "Телефон",
    lastScan: "станция Рязане · 09:41",
  },
  {
    id: "j-3",
    code: "AMZ-1190",
    title: "Камина — корпус",
    qty: "18 бр.",
    stage: 2,
    progress: 48,
    eta: "AI срок: петък 13:30",
    channel: "Amazon",
    lastScan: "станция Заваряване · 10:06",
  },
  {
    id: "j-4",
    code: "ORD-4793",
    title: "Конзоли за климатизация",
    qty: "85 бр.",
    stage: 3,
    progress: 71,
    eta: "AI срок: утре 17:20",
    channel: "Телефон",
    lastScan: "станция Боя · 10:22",
  },
  {
    id: "j-5",
    code: "AMZ-1184",
    title: "Камина — стъклен панел",
    qty: "24 бр.",
    stage: 4,
    progress: 90,
    eta: "AI срок: днес 16:40",
    channel: "Amazon",
    lastScan: "станция Опаковане · 10:35",
  },
  {
    id: "j-6",
    code: "ORD-4778",
    title: "Стойки за климатик · стандарт",
    qty: "60 бр.",
    stage: 5,
    progress: 100,
    eta: "Готово · чака експедиция",
    channel: "Телефон",
    lastScan: "готово · 10:48",
  },
] as const;

/** Общ прогрес на цеха (фиксиран — без четене на системно време). */
const TOTAL_PROGRESS = 67;
/** Брой поръчки в производство. */
const ACTIVE_JOBS = 14;
/** Изпреварен срок спрямо ръчното планиране, в часове. */
const HOURS_AHEAD = 9;

/* ------------------------------------------------------------------ */
/*  Малки под-компоненти                                               */
/* ------------------------------------------------------------------ */

/** Пулсиращо ядро + ринг (CSS animate-ping). */
function LiveDot({ accent, reduced }: { accent: AccentTokens; reduced: boolean }) {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      {!reduced && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70"
          style={{ background: accent.color }}
        />
      )}
      <span
        className="relative inline-flex h-2 w-2 rounded-full"
        style={{ background: accent.color, boxShadow: `0 0 10px ${accent.color}` }}
      />
    </span>
  );
}

/** Бадж за канала на поръчката. */
function ChannelBadge({ channel }: { channel: Job["channel"] }) {
  const accent = channel === "Amazon" ? ACCENTS.amber : ACCENTS.cyan;
  const glyph = channel === "Amazon" ? "✉" : "☎";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.12em]"
      style={{
        color: accent.color,
        background: `rgba(${accent.rgb},0.1)`,
        border: `1px solid rgba(${accent.rgb},0.26)`,
      }}
    >
      <span aria-hidden>{glyph}</span>
      {channel}
    </span>
  );
}

/**
 * Прогрес-бар с анимиран пълнеж (whileInView → ширина).
 * При reduced motion → статична ширина, без преход.
 */
function ProgressBar({
  value,
  accent,
  reduced,
  delay,
}: {
  value: number;
  accent: AccentTokens;
  reduced: boolean;
  delay: number;
}) {
  const fill = `linear-gradient(90deg, rgba(${accent.rgb},0.65), ${accent.color})`;
  const glow = `0 0 12px rgba(${accent.rgb},0.55)`;

  return (
    <div
      className="relative h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: `rgba(${accent.rgb},0.12)` }}
      aria-hidden
    >
      {reduced ? (
        // Статичен пълнеж — без преход при reduced motion.
        <span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${value}%`, background: fill, boxShadow: glow }}
        />
      ) : (
        <motion.span
          className="absolute inset-y-0 left-0 rounded-full"
          style={{ background: fill, boxShadow: glow }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 1.1, delay, ease: [0.22, 1, 0.36, 1] }}
        />
      )}
    </div>
  );
}

/** Малка QR-плочка (декоративна, детерминистична). */
function QrGlyph({ accent }: { accent: AccentTokens }) {
  // Фиксиран 5x5 шаблон — без random, за да няма SSR mismatch.
  const cells: readonly number[] = [
    1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1, 1, 1, 1, 0, 1, 1,
  ];
  return (
    <span
      className="grid h-6 w-6 shrink-0 gap-px rounded-[3px] p-0.5"
      style={{
        gridTemplateColumns: "repeat(5, 1fr)",
        border: `1px solid rgba(${accent.rgb},0.34)`,
        background: `rgba(${accent.rgb},0.06)`,
      }}
      aria-hidden
    >
      {cells.map((c, i) => (
        <span
          key={i}
          style={{
            background: c ? accent.color : "transparent",
            opacity: c ? 0.85 : 1,
            borderRadius: 1,
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Job-карта                                                          */
/* ------------------------------------------------------------------ */

function JobCard({ job, index }: { job: Job; index: number }) {
  const reduced = useReducedMotion();
  const stage = STAGES[job.stage];
  const accent = ACCENTS[stage.accent];
  const done = job.progress >= 100;
  const etaAccent = done ? ACCENTS.emerald : ACCENTS.cyan;

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 18 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{
        duration: 0.55,
        delay: Math.min(index * 0.07, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative overflow-hidden rounded-2xl border p-3.5"
      style={{
        borderColor: done ? `rgba(${accent.rgb},0.45)` : "var(--color-border-default)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(12px)",
        boxShadow: done ? `0 0 26px rgba(${accent.rgb},0.18)` : "none",
      }}
    >
      {/* Цветен горен ръб според етапа */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent.color}, transparent)`,
          opacity: 0.7,
        }}
      />

      {/* Header: код + канал */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="font-[family-name:var(--font-mono)] text-[11px] font-bold tracking-[0.08em]"
          style={{ color: accent.color }}
        >
          {job.code}
        </span>
        <ChannelBadge channel={job.channel} />
      </div>

      {/* Артикул + бройки */}
      <h4 className="mt-1.5 text-[13px] font-semibold leading-snug text-[var(--color-text-primary)]">
        {job.title}
      </h4>
      <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
        {job.qty}
      </p>

      {/* Прогрес-бар + % */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
            {done ? "завършен" : "в процес"}
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[11px] font-bold tabular-nums"
            style={{ color: accent.color }}
          >
            {job.progress}%
          </span>
        </div>
        <ProgressBar
          value={job.progress}
          accent={accent}
          reduced={reduced}
          delay={0.15 + Math.min(index * 0.07, 0.4)}
        />
      </div>

      {/* AI ETA бадж */}
      <div
        className="mt-3 flex items-center gap-1.5 rounded-lg border px-2 py-1.5"
        style={{
          borderColor: `rgba(${etaAccent.rgb},0.28)`,
          background: `rgba(${etaAccent.rgb},0.06)`,
        }}
      >
        <span
          aria-hidden
          className="font-[family-name:var(--font-mono)] text-[9px] font-bold uppercase tracking-[0.1em]"
          style={{ color: etaAccent.color }}
        >
          AI
        </span>
        <span className="truncate text-[11px] leading-tight text-[var(--color-text-secondary)]">
          {job.eta}
        </span>
      </div>

      {/* QR чекиране по станция */}
      <div className="mt-2.5 flex items-center gap-2">
        <QrGlyph accent={accent} />
        <div className="min-w-0">
          <p className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
            чек-ин
          </p>
          <p className="truncate font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-text-secondary)]">
            {job.lastScan}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/*  Колона (етап) на дъската                                          */
/* ------------------------------------------------------------------ */

function StageColumn({
  stage,
  index,
  jobs,
  active,
  reduced,
}: {
  stage: Stage;
  index: number;
  jobs: readonly Job[];
  /** „сега“ индикаторът е на тази колона */
  active: boolean;
  reduced: boolean;
}) {
  const accent = ACCENTS[stage.accent];

  return (
    <div className="flex w-[220px] shrink-0 flex-col md:w-auto md:shrink">
      {/* Глава на колоната */}
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-3 flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-500"
        style={{
          borderColor: active ? `rgba(${accent.rgb},0.5)` : "var(--color-border-default)",
          background: active ? `rgba(${accent.rgb},0.08)` : "rgba(255,255,255,0.02)",
          boxShadow: active ? `0 0 22px rgba(${accent.rgb},0.25)` : "none",
        }}
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[11px]"
          style={{
            color: accent.color,
            background: `rgba(${accent.rgb},0.12)`,
          }}
          aria-hidden
        >
          {stage.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-editorial)] text-[12px] font-extrabold leading-tight text-[var(--color-text-primary)]">
            {stage.name}
          </p>
          <p
            className="font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em]"
            style={{ color: accent.color }}
          >
            {jobs.length} {jobs.length === 1 ? "поръчка" : "поръчки"}
          </p>
        </div>
        {active && <LiveDot accent={accent} reduced={reduced} />}
      </motion.div>

      {/* Карти в колоната */}
      <div className="flex flex-col gap-3">
        {jobs.length > 0 ? (
          jobs.map((job, i) => <JobCard key={job.id} job={job} index={index + i} />)
        ) : (
          <div
            className="rounded-2xl border border-dashed px-3 py-6 text-center"
            style={{ borderColor: "var(--color-border-default)" }}
          >
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
              чисто
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Eyebrow                                                            */
/* ------------------------------------------------------------------ */

function Eyebrow({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-2.5"
    >
      <span className="relative flex h-2 w-2" aria-hidden>
        {!reduced && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-emerald)] opacity-70" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-emerald)]" />
      </span>
      <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-emerald)]">
        Решение · производство
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function ProductionTracker() {
  const reduced = useReducedMotion();

  /**
   * „Сега" индикаторът обикаля колоните. Стартираме на 0 (детерминистично
   * за SSR); анимираме само след mount → без hydration mismatch.
   */
  const [nowStage, setNowStage] = useState<number>(0);

  useEffect(() => {
    if (reduced) return;
    const interval = window.setInterval(() => {
      setNowStage((prev) => (prev + 1) % STAGES.length);
    }, 2000);
    return () => window.clearInterval(interval);
  }, [reduced]);

  const headStyle: CSSProperties = {
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <section
      id="cex"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 8% 0%, rgba(52,211,153,0.07) 0%, transparent 55%), radial-gradient(ellipse at 95% 100%, rgba(34,211,238,0.06) 0%, transparent 52%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        <Eyebrow reduced={reduced} />

        {/* Heading */}
        <motion.h2
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          style={headStyle}
          className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.05] text-[var(--color-text-primary)]"
        >
          Цехът ти,{" "}
          <span className="text-[var(--color-accent-emerald)]">на живо</span>
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Всяка поръчка минава по дъската: Заявка → Рязане → Заваряване → Боядисване
          → Опаковане → Готово. Виждаш къде е всичко — без обиколки из цеха и без
          въпроси „докъде стигнахме“.
        </motion.p>

        {/* Лента с общ прогрес + метрики */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 overflow-hidden rounded-2xl border p-5 md:p-6"
          style={{
            borderColor: "var(--color-border-bright)",
            background: "var(--color-bg-glass)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <LiveDot accent={ACCENTS.emerald} reduced={reduced} />
                <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                  Общ прогрес на цеха · днес
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <CounterRamp
                  target={TOTAL_PROGRESS}
                  suffix="%"
                  durationMs={2000}
                  className="font-[family-name:var(--font-mono)] text-4xl font-bold leading-none text-[var(--color-accent-emerald)] md:text-5xl"
                />
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                  завършено
                </span>
              </div>
            </div>

            {/* Малки метрики */}
            <div className="flex gap-6">
              <div>
                <CounterRamp
                  target={ACTIVE_JOBS}
                  durationMs={1600}
                  className="font-[family-name:var(--font-mono)] text-2xl font-bold leading-none text-[var(--color-accent-cyan)]"
                />
                <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  в производство
                </p>
              </div>
              <div>
                <CounterRamp
                  target={HOURS_AHEAD}
                  prefix="−"
                  suffix="ч"
                  durationMs={1600}
                  className="font-[family-name:var(--font-mono)] text-2xl font-bold leading-none text-[var(--color-accent-emerald)]"
                />
                <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-tertiary)]">
                  пред план
                </p>
              </div>
            </div>
          </div>

          {/* Дебел общ прогрес-бар */}
          <div
            className="relative mt-4 h-2.5 w-full overflow-hidden rounded-full"
            style={{ background: "rgba(52,211,153,0.12)" }}
            aria-hidden
          >
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--color-accent-cyan), var(--color-accent-emerald))",
                boxShadow: "0 0 16px rgba(52,211,153,0.55)",
                ...(reduced ? { width: `${TOTAL_PROGRESS}%` } : {}),
              }}
              initial={reduced ? false : { width: 0 }}
              whileInView={reduced ? undefined : { width: `${TOTAL_PROGRESS}%` }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 1.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            />
            {/* движещ се отблясък по пълнежа (1-ва безкрайна анимация) */}
            {!reduced && (
              <motion.span
                className="absolute inset-y-0 w-16 rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
                }}
                initial={{ left: "-15%" }}
                animate={{ left: ["-15%", "85%"] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              />
            )}
          </div>
        </motion.div>

        {/* KANBAN дъска */}
        <div className="relative mt-8">
          {/* Хоризонтален скрол на мобилен; 6 колони на широко */}
          <div className="-mx-6 overflow-x-auto px-6 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="grid grid-flow-col auto-cols-[220px] gap-4 md:grid-flow-row md:auto-cols-auto md:grid-cols-3 lg:grid-cols-6">
              {STAGES.map((stage, i) => {
                const jobsInStage = JOBS.filter((j) => j.stage === i);
                return (
                  <StageColumn
                    key={stage.id}
                    stage={stage}
                    index={i}
                    jobs={jobsInStage}
                    active={nowStage === i}
                    reduced={reduced}
                  />
                );
              })}
            </div>
          </div>

          {/* „Сега" индикатор — лента с точки под дъската */}
          <div
            className="mt-5 flex items-center justify-center gap-2"
            aria-hidden
          >
            <span className="mr-1 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">
              сега
            </span>
            {STAGES.map((stage, i) => (
              <span
                key={stage.id}
                className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: nowStage === i ? "26px" : "8px",
                  background:
                    nowStage === i
                      ? ACCENTS[stage.accent].color
                      : "var(--color-border-bright)",
                  boxShadow:
                    nowStage === i ? `0 0 12px ${ACCENTS[stage.accent].color}` : "none",
                }}
              />
            ))}
          </div>
        </div>

        {/* Акцент: AI учи от историята */}
        <motion.aside
          initial={reduced ? false : { opacity: 0, y: 20 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-10 flex flex-col gap-5 overflow-hidden rounded-2xl border p-5 md:flex-row md:items-center md:p-6"
          style={{
            borderColor: `rgba(${ACCENTS.emerald.rgb},0.3)`,
            background: "var(--color-bg-glass)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse at 0% 0%, rgba(52,211,153,0.1) 0%, transparent 55%)",
            }}
          />

          {/* Иконка */}
          <span
            className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-xl"
            style={{
              borderColor: `rgba(${ACCENTS.emerald.rgb},0.4)`,
              color: ACCENTS.emerald.color,
              background: `rgba(${ACCENTS.emerald.rgb},0.08)`,
              boxShadow: `0 0 20px rgba(${ACCENTS.emerald.rgb},0.2)`,
            }}
            aria-hidden
          >
            ◷
          </span>

          <div className="relative min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.28em]"
                style={{ color: ACCENTS.emerald.color }}
              >
                AI срок
              </span>
              <LiveDot accent={ACCENTS.emerald} reduced={reduced} />
            </div>
            <p className="mt-1.5 font-[family-name:var(--font-editorial)] text-lg font-extrabold leading-snug text-[var(--color-text-primary)] md:text-xl">
              AI учи от историята ти и казва кога{" "}
              <span className="text-[var(--color-accent-emerald)]">РЕАЛНО</span> ще е
              готово.
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              Всяко чекиране с QR на станция захранва модела. Колкото повече минава
              през цеха, толкова по-точен става срокът — без оптимистични обещания на
              клиента.
            </p>
          </div>

          {/* Мини-стат: точност на прогнозата */}
          <div
            className="relative flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3"
            style={{
              borderColor: `rgba(${ACCENTS.cyan.rgb},0.26)`,
              background: `rgba(${ACCENTS.cyan.rgb},0.05)`,
            }}
          >
            <CounterRamp
              target={94}
              suffix="%"
              durationMs={1800}
              className="font-[family-name:var(--font-mono)] text-2xl font-bold leading-none text-[var(--color-accent-cyan)]"
            />
            <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase leading-tight tracking-[0.14em] text-[var(--color-text-tertiary)]">
              точност
              <br />
              на срока
            </span>
          </div>
        </motion.aside>
      </div>
    </section>
  );
}
