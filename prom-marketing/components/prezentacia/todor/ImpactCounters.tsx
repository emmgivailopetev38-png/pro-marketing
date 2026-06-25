"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { CounterRamp } from "@/components/effects/CounterRamp";

/* ------------------------------------------------------------------ */
/*  Типове                                                             */
/* ------------------------------------------------------------------ */

interface AccentTokens {
  readonly color: string;
  /** rgb тройка за rgba() миксове */
  readonly rgb: string;
}

/**
 * Голям брояч. Числовите се анимират чрез CounterRamp; статичните
 * (трансформации като „6→1") се изписват директно, за да няма
 * подвеждаща анимация и да остане коректно.
 */
type Stat =
  | {
      readonly kind: "ramp";
      readonly id: string;
      readonly target: number;
      readonly prefix?: string;
      readonly suffix?: string;
      readonly durationMs: number;
      readonly label: string;
      readonly note: string;
      readonly glyph: string;
      readonly accent: AccentTokens;
    }
  | {
      readonly kind: "static";
      readonly id: string;
      /** ляво число на трансформацията, напр. „6" */
      readonly from: string;
      /** дясно число на трансформацията, напр. „1" */
      readonly to: string;
      readonly label: string;
      readonly note: string;
      readonly glyph: string;
      readonly accent: AccentTokens;
    };

interface CompareRow {
  readonly id: string;
  readonly area: string;
  readonly glyph: string;
  /** състояние ПРЕДИ */
  readonly before: string;
  /** състояние СЕГА */
  readonly after: string;
  readonly accent: AccentTokens;
}

/* ------------------------------------------------------------------ */
/*  Акцентни токени                                                    */
/* ------------------------------------------------------------------ */

const CYAN: AccentTokens = { color: "var(--color-accent-cyan)", rgb: "34,211,238" };
const SKY: AccentTokens = { color: "var(--color-accent-sky)", rgb: "56,189,248" };
const AMBER: AccentTokens = { color: "var(--color-accent-amber)", rgb: "251,146,60" };
const EMERALD: AccentTokens = { color: "var(--color-accent-emerald)", rgb: "52,211,153" };

/* ------------------------------------------------------------------ */
/*  Данни (фиксирани, илюстративни)                                    */
/* ------------------------------------------------------------------ */

const STATS: readonly Stat[] = [
  {
    kind: "ramp",
    id: "offers",
    target: 100,
    suffix: "%",
    durationMs: 1600,
    label: "оферти проследени",
    note: "нито една не изпада",
    glyph: "◈",
    accent: EMERALD,
  },
  {
    kind: "ramp",
    id: "hours",
    target: 15,
    suffix: " ч",
    durationMs: 2000,
    label: "спестено / седмица",
    note: "ръчна работа отпада",
    glyph: "✦",
    accent: CYAN,
  },
  {
    kind: "ramp",
    id: "amazon",
    target: 140,
    suffix: "+",
    durationMs: 2200,
    label: "Amazon поръчки / месец",
    note: "влизат автоматично",
    glyph: "✉",
    accent: AMBER,
  },
  {
    kind: "static",
    id: "screens",
    from: "6",
    to: "1",
    label: "екран за всичко",
    note: "една обща картина",
    glyph: "▦",
    accent: CYAN,
  },
] as const;

const COMPARE: readonly CompareRow[] = [
  {
    id: "offers",
    area: "Оферти",
    glyph: "◈",
    before: "в главата на търговеца",
    after: "проследени до стъпка",
    accent: SKY,
  },
  {
    id: "amazon",
    area: "Amazon",
    glyph: "✉",
    before: "copy-paste на ръка",
    after: "автоматично в CRM",
    accent: AMBER,
  },
  {
    id: "production",
    area: "Производство",
    glyph: "◉",
    before: "следи се на ръка",
    after: "live + AI срок",
    accent: EMERALD,
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Малки под-компоненти                                               */
/* ------------------------------------------------------------------ */

/** Жив индикатор — пулсиращо ядро + ринг (CSS, не JS). */
function LiveDot({ accent, reduced }: { accent: AccentTokens; reduced: boolean }) {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      {!reduced && (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
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

/** Голяма брояч-карта (статистика). */
function StatCard({ stat, index }: { stat: Stat; index: number }) {
  const reduced = useReducedMotion();
  const { accent } = stat;

  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: 0.08 + index * 0.09, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border p-5 md:p-6"
      style={{
        borderColor: "var(--color-border-default)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* Светещ ъглов halo при hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-30 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
        style={{ background: `radial-gradient(circle, ${accent.color} 0%, transparent 70%)` }}
      />
      {/* Тънка светеща горна линия */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-40 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${accent.color}, transparent)` }}
      />

      <div className="relative flex flex-col">
        {/* Глиф-бадж */}
        <span
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border text-base"
          style={{
            color: accent.color,
            borderColor: `rgba(${accent.rgb},0.32)`,
            background: `rgba(${accent.rgb},0.08)`,
          }}
          aria-hidden
        >
          {stat.glyph}
        </span>

        {/* Самото число */}
        <div
          className="font-[family-name:var(--font-editorial)] text-[clamp(40px,6vw,64px)] font-extrabold leading-none"
          style={{ color: accent.color, textShadow: `0 0 28px rgba(${accent.rgb},0.4)` }}
        >
          {stat.kind === "ramp" ? (
            <CounterRamp
              target={stat.target}
              durationMs={stat.durationMs}
              prefix={stat.prefix}
              suffix={stat.suffix}
              className="tabular-nums"
            />
          ) : (
            <span className="inline-flex items-center gap-2 tabular-nums">
              <span className="opacity-45">{stat.from}</span>
              <span
                aria-hidden
                className="text-[0.5em] font-bold"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                →
              </span>
              <span>{stat.to}</span>
            </span>
          )}
        </div>

        {/* Етикет */}
        <p className="mt-3 text-sm font-medium leading-snug text-[var(--color-text-primary)]">
          {stat.label}
        </p>

        {/* Под-етикет */}
        <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
          {stat.note}
        </p>
      </div>
    </motion.li>
  );
}

/** Един ред от таблицата ПРЕДИ → СЕГА. */
function CompareRowItem({ row, index }: { row: CompareRow; index: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.li
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: 0.06 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-1 items-center gap-3 px-5 py-4 sm:grid-cols-[150px_1fr_auto_1fr]"
    >
      {/* Област */}
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm"
          style={{
            color: row.accent.color,
            background: `rgba(${row.accent.rgb},0.1)`,
          }}
          aria-hidden
        >
          {row.glyph}
        </span>
        <span className="font-[family-name:var(--font-editorial)] text-sm font-extrabold text-[var(--color-text-primary)]">
          {row.area}
        </span>
      </div>

      {/* ПРЕДИ */}
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-2"
        style={{
          borderColor: "rgba(91,112,136,0.22)",
          background: "rgba(91,112,136,0.06)",
        }}
      >
        <span
          aria-hidden
          className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]"
        >
          преди
        </span>
        <span className="text-[13px] leading-snug text-[var(--color-text-tertiary)] line-through decoration-[rgba(91,112,136,0.5)]">
          {row.before}
        </span>
      </div>

      {/* Стрелка (хоризонтално на десктоп, вертикално на мобилно) */}
      <span
        aria-hidden
        className="mx-auto rotate-90 text-base sm:rotate-0"
        style={{ color: row.accent.color }}
      >
        →
      </span>

      {/* СЕГА */}
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-2"
        style={{
          borderColor: `rgba(${row.accent.rgb},0.3)`,
          background: `rgba(${row.accent.rgb},0.07)`,
        }}
      >
        <span
          aria-hidden
          className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em]"
          style={{ color: row.accent.color }}
        >
          сега
        </span>
        <span className="text-[13px] font-medium leading-snug text-[var(--color-text-primary)]">
          {row.after}
        </span>
      </div>
    </motion.li>
  );
}

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
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-cyan)] opacity-70" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-cyan)]" />
      </span>
      <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
        Резултатът
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function ImpactCounters() {
  const reduced = useReducedMotion();

  return (
    <section
      id="impact"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 12% 0%, rgba(34,211,238,0.07) 0%, transparent 55%), radial-gradient(ellipse at 90% 95%, rgba(52,211,153,0.05) 0%, transparent 52%)",
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
          className="mt-5 font-[family-name:var(--font-editorial)] text-[clamp(32px,5vw,64px)] font-extrabold leading-[1.05] text-[var(--color-text-primary)]"
        >
          Връщаме ти <span className="text-[var(--color-accent-cyan)]">времето</span>
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Не теория, а часове обратно в деня ти. Ето какво се променя, когато всичко
          живее на едно място.
        </motion.p>

        {/* Голями броячи */}
        <ul className="mt-12 grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.id} stat={stat} index={i} />
          ))}
        </ul>

        {/* Таблица ПРЕДИ → СЕГА */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-8 overflow-hidden rounded-3xl border"
          style={{
            borderColor: "var(--color-border-bright)",
            background: "var(--color-bg-glass)",
            backdropFilter: "blur(16px)",
          }}
        >
          {/* Вътрешен ambient градиент */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(ellipse at 100% 0%, rgba(34,211,238,0.1) 0%, transparent 55%), radial-gradient(ellipse at 0% 110%, rgba(52,211,153,0.08) 0%, transparent 55%)",
            }}
          />
          {/* Скенираща линия — единствената безкрайна JS-анимация в секцията */}
          {!reduced && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 h-1/3"
              style={{
                background:
                  "linear-gradient(180deg, transparent, rgba(34,211,238,0.06), transparent)",
              }}
              initial={{ y: "-120%" }}
              animate={{ y: "320%" }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div className="relative">
            {/* Header на таблицата */}
            <div className="flex items-center justify-between border-b px-5 py-4"
              style={{ borderColor: "var(--color-border-default)" }}
            >
              <div className="flex items-center gap-2.5">
                <LiveDot accent={CYAN} reduced={reduced} />
                <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-secondary)]">
                  Преди → Сега
                </span>
              </div>
              <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
                4 процеса · 1 система
              </span>
            </div>

            {/* Редовете */}
            <ul className="divide-y" style={{ borderColor: "var(--color-border-default)" }}>
              {COMPARE.map((row, i) => (
                <CompareRowItem key={row.id} row={row} index={i} />
              ))}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
