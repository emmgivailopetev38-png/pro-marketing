"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
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

interface DealChip {
  /** име на сделката */
  readonly name: string;
  /** стойност, форматирана */
  readonly value: string;
  /** акцент за chip-а */
  readonly accent: Accent;
}

interface PipelineStep {
  readonly id: string;
  /** пореден номер 1..6 */
  readonly n: number;
  /** име на стъпката */
  readonly name: string;
  /** глиф-икона */
  readonly glyph: string;
  /** брой активни сделки на тази стъпка */
  readonly count: number;
  /** етикет под брояча */
  readonly countLabel: string;
  /** акцент на възела */
  readonly accent: Accent;
  /** примерни сделки-chips */
  readonly chips: readonly DealChip[];
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
/*  Данни — 6-стъпковият процес (фиксирани, илюстративни)              */
/* ------------------------------------------------------------------ */

const STEPS: readonly PipelineStep[] = [
  {
    id: "zapitvane",
    n: 1,
    name: "Запитване",
    glyph: "✉",
    count: 24,
    countLabel: "нови",
    accent: "sky",
    chips: [
      { name: "ВентАир", value: "€2 400", accent: "cyan" },
      { name: "Климатек", value: "€1 180", accent: "sky" },
    ],
  },
  {
    id: "obazhdane",
    n: 2,
    name: "Контакт",
    glyph: "◇",
    count: 18,
    countLabel: "в контакт",
    accent: "cyan",
    chips: [
      { name: "ВентАир", value: "€2 400", accent: "cyan" },
      { name: "Аеро Дом", value: "€640", accent: "amber" },
    ],
  },
  {
    id: "oferta",
    n: 3,
    name: "Оферта",
    glyph: "▦",
    count: 12,
    countLabel: "изпратени",
    accent: "sky",
    chips: [
      { name: "ВентАир", value: "€2 400", accent: "cyan" },
      { name: "СтудКлима", value: "€3 950", accent: "sky" },
    ],
  },
  {
    id: "potvarzhdenie",
    n: 4,
    name: "Потвърждение",
    glyph: "✓",
    count: 7,
    countLabel: "чакат „да“",
    accent: "amber",
    chips: [
      { name: "ВентАир", value: "€2 400", accent: "cyan" },
      { name: "Метал-Вент", value: "€870", accent: "amber" },
    ],
  },
  {
    id: "poruchka",
    n: 5,
    name: "Поръчка",
    glyph: "◈",
    count: 9,
    countLabel: "потвърдени",
    accent: "emerald",
    chips: [
      { name: "ВентАир", value: "€2 400", accent: "cyan" },
      { name: "ТермоВент", value: "€1 520", accent: "emerald" },
    ],
  },
  {
    id: "proizvodstvo",
    n: 6,
    name: "Производство",
    glyph: "⚙",
    count: 14,
    countLabel: "в цеха",
    accent: "cyan",
    chips: [
      { name: "ВентАир", value: "€2 400", accent: "cyan" },
      { name: "КлимаПро", value: "€2 130", accent: "sky" },
    ],
  },
] as const;

/** Името на сделката, която „тече“ през целия pipeline. */
const FLOWING_DEAL = "ВентАир";

/* ------------------------------------------------------------------ */
/*  Малки под-компоненти                                               */
/* ------------------------------------------------------------------ */

/** Пулсиращо ядро + ринг (CSS animate-ping). */
function LiveDot({ accent }: { accent: AccentTokens }) {
  const reduced = useReducedMotion();
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

/** Малък деал-chip; маркира „течащата“ сделка с по-ярка рамка/блясък. */
function Chip({
  chip,
  active,
  highlight,
}: {
  chip: DealChip;
  /** активен ли е възелът точно сега */
  active: boolean;
  /** това ли е течащата сделка */
  highlight: boolean;
}) {
  const accent = ACCENTS[chip.accent];
  const live = active && highlight;

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-lg border px-2.5 py-1.5 transition-all duration-500"
      style={{
        borderColor: live
          ? `rgba(${accent.rgb},0.55)`
          : highlight
            ? `rgba(${accent.rgb},0.30)`
            : "var(--color-border-default)",
        background: live ? `rgba(${accent.rgb},0.12)` : "rgba(255,255,255,0.02)",
        boxShadow: live ? `0 0 18px rgba(${accent.rgb},0.30)` : "none",
      }}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span
          aria-hidden
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{
            background: accent.color,
            boxShadow: live ? `0 0 8px ${accent.color}` : "none",
          }}
        />
        <span className="truncate text-[12px] font-medium text-[var(--color-text-primary)]">
          {chip.name}
        </span>
      </span>
      <span
        className="shrink-0 font-[family-name:var(--font-mono)] text-[11px] tracking-[0.02em]"
        style={{ color: highlight ? accent.color : "var(--color-text-secondary)" }}
      >
        {chip.value}
      </span>
    </div>
  );
}

/** Конектор между два възела с течащ pulse (хоризонтален / вертикален). */
function Connector({
  accent,
  active,
  reduced,
  vertical,
}: {
  accent: AccentTokens;
  /** свети ли тази отсечка (сделката минава по нея) */
  active: boolean;
  reduced: boolean;
  /** вертикален вариант (мобилен) */
  vertical: boolean;
}) {
  if (vertical) {
    return (
      <div
        className="relative mx-auto my-1 h-7 w-px overflow-hidden md:hidden"
        style={{
          background: active
            ? `linear-gradient(180deg, rgba(${accent.rgb},0.6), rgba(${accent.rgb},0.15))`
            : "var(--color-border-default)",
        }}
        aria-hidden
      >
        {!reduced && active && (
          <motion.span
            className="absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full"
            style={{ background: accent.color, boxShadow: `0 0 12px ${accent.color}` }}
            initial={{ top: "-15%", opacity: 0 }}
            animate={{ top: ["-15%", "115%"], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className="relative hidden h-px flex-1 self-center overflow-hidden md:block"
      style={{
        background: active
          ? `linear-gradient(90deg, rgba(${accent.rgb},0.6), rgba(${accent.rgb},0.15))`
          : "var(--color-border-default)",
      }}
      aria-hidden
    >
      {!reduced && active && (
        <motion.span
          className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
          style={{ background: accent.color, boxShadow: `0 0 12px ${accent.color}` }}
          initial={{ left: "-12%", opacity: 0 }}
          animate={{ left: ["-12%", "112%"], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Възел от pipeline-а                                                */
/* ------------------------------------------------------------------ */

function StepNode({
  step,
  index,
  active,
}: {
  step: PipelineStep;
  index: number;
  /** „течащата“ сделка е на този възел сега */
  active: boolean;
}) {
  const reduced = useReducedMotion();
  const accent = ACCENTS[step.accent];

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay: Math.min(index * 0.08, 0.5),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex flex-col rounded-2xl border p-4 transition-all duration-500"
      style={{
        borderColor: active ? `rgba(${accent.rgb},0.5)` : "var(--color-border-default)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
        boxShadow: active ? `0 0 34px rgba(${accent.rgb},0.22)` : "none",
      }}
    >
      {/* Светеща горна линия — ярка при активен възел */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px transition-opacity duration-500"
        style={{
          opacity: active ? 1 : 0.35,
          background: `linear-gradient(90deg, transparent, ${accent.color}, transparent)`,
        }}
      />
      {/* Ъглов halo при активност */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl transition-opacity duration-500"
        style={{
          opacity: active ? 0.55 : 0,
          background: `radial-gradient(circle, ${accent.color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* Header: номер + глиф + жив индикатор */}
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border font-[family-name:var(--font-mono)] text-sm font-bold transition-all duration-500"
            style={{
              borderColor: active
                ? `rgba(${accent.rgb},0.6)`
                : `rgba(${accent.rgb},0.28)`,
              color: accent.color,
              background: active ? `rgba(${accent.rgb},0.14)` : `rgba(${accent.rgb},0.06)`,
              boxShadow: active ? `0 0 16px rgba(${accent.rgb},0.35)` : "none",
            }}
            aria-hidden
          >
            {String(step.n).padStart(2, "0")}
          </span>

          <div className="min-w-0 flex-1">
            <p
              className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.2em]"
              style={{ color: accent.color }}
              aria-hidden
            >
              {step.glyph} стъпка
            </p>
            <h3 className="truncate font-[family-name:var(--font-editorial)] text-[15px] font-extrabold leading-tight text-[var(--color-text-primary)]">
              {step.name}
            </h3>
          </div>

          {active && <LiveDot accent={accent} />}
        </div>

        {/* Брояч */}
        <div className="mt-3 flex items-baseline gap-1.5">
          <span
            className="font-[family-name:var(--font-mono)] text-2xl font-bold leading-none"
            style={{ color: accent.color }}
          >
            {step.count}
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
            {step.countLabel}
          </span>
        </div>

        {/* Деал-chips */}
        <div className="mt-3 space-y-1.5">
          {step.chips.map((chip) => (
            <Chip
              key={chip.name}
              chip={chip}
              active={active}
              highlight={chip.name === FLOWING_DEAL}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Бележка „AI напомняне“                                             */
/* ------------------------------------------------------------------ */

function AiReminderNote() {
  const reduced = useReducedMotion();
  const accent = ACCENTS.emerald;

  return (
    <motion.aside
      initial={reduced ? false : { opacity: 0, y: 20 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex items-start gap-4 overflow-hidden rounded-2xl border p-5 md:p-6"
      style={{
        borderColor: `rgba(${accent.rgb},0.28)`,
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background: `radial-gradient(ellipse at 0% 0%, rgba(${accent.rgb},0.10) 0%, transparent 55%)`,
        }}
      />

      {/* Иконка */}
      <span
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg"
        style={{
          borderColor: `rgba(${accent.rgb},0.4)`,
          color: accent.color,
          background: `rgba(${accent.rgb},0.08)`,
          boxShadow: `0 0 20px rgba(${accent.rgb},0.20)`,
        }}
        aria-hidden
      >
        ◷
      </span>

      <div className="relative min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.28em]"
            style={{ color: accent.color }}
          >
            AI следи
          </span>
          <LiveDot accent={accent} />
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          <span className="font-semibold text-[var(--color-text-primary)]">
            AI вижда коя оферта е застояла
          </span>{" "}
          и сама праща напомняне — преди сделката да изстине.
        </p>

        {/* Примерен ред: застояла оферта */}
        <div
          className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-3 py-2"
          style={{
            borderColor: `rgba(${ACCENTS.amber.rgb},0.28)`,
            background: `rgba(${ACCENTS.amber.rgb},0.05)`,
          }}
        >
          <span
            aria-hidden
            className="text-sm"
            style={{ color: ACCENTS.amber.color }}
          >
            ⚠
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[11px] tracking-[0.02em] text-[var(--color-text-secondary)]">
            „СтудКлима · €3 950“ застояла на „Оферта“ 3 дни
          </span>
          <span
            className="rounded-md px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em]"
            style={{
              color: accent.color,
              background: `rgba(${accent.rgb},0.10)`,
              border: `1px solid rgba(${accent.rgb},0.24)`,
            }}
          >
            → напомняне изпратено
          </span>
        </div>
      </div>
    </motion.aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function OfferPipeline() {
  const reduced = useReducedMotion();

  /**
   * Кой възел е „активен“ — сделката ВентАир тече през стъпките.
   * Стартираме на 0 (детерминистично за SSR); анимираме само след mount
   * вътре в useEffect → без hydration mismatch.
   */
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    if (reduced) return;
    const interval = window.setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 1800);
    return () => window.clearInterval(interval);
  }, [reduced]);

  const headStyle: CSSProperties = {
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <section
      id="oferti"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 10% 0%, rgba(56,189,248,0.07) 0%, transparent 55%), radial-gradient(ellipse at 95% 100%, rgba(34,211,238,0.05) 0%, transparent 50%)",
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
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-sky)] opacity-70" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-sky)]" />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-sky)]">
            Решение · оферти
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
          Всяка оферта,{" "}
          <span className="text-[var(--color-accent-sky)]">проследена</span>
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Процесът от 6 стъпки вече не се губи. Всяка сделка минава по светещ
          конвейер — и виждаш на коя стъпка е, без да питаш никого.
        </motion.p>

        {/* Легенда: течащата сделка */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
          className="mt-7 inline-flex items-center gap-3 rounded-full border px-4 py-2"
          style={{
            borderColor: "var(--color-border-bright)",
            background: "var(--color-bg-glass)",
          }}
        >
          <LiveDot accent={ACCENTS.cyan} />
          <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.16em] text-[var(--color-text-secondary)]">
            Следим:
          </span>
          <span className="font-[family-name:var(--font-mono)] text-[12px] font-bold tracking-[0.04em] text-[var(--color-accent-cyan)]">
            {FLOWING_DEAL} — €2 400
          </span>
          <span
            aria-hidden
            className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-text-tertiary)]"
          >
            ▶ тече през конвейера
          </span>
        </motion.div>

        {/* Pipeline: хоризонтално на md, вертикално на мобилен */}
        <div className="mt-10 flex flex-col md:flex-row md:items-stretch">
          {STEPS.map((step, i) => {
            const isActive = activeStep === i;
            // отсечката ПРЕДИ възела свети, когато сделката е стигнала до него
            const connectorAccent = ACCENTS[step.accent];
            const connectorActive = activeStep === i;

            return (
              <div
                key={step.id}
                className="flex flex-col md:flex-1 md:flex-row md:items-stretch"
              >
                {/* Конектор преди възела (без първия) */}
                {i > 0 && (
                  <>
                    <Connector
                      accent={connectorAccent}
                      active={connectorActive}
                      reduced={reduced}
                      vertical
                    />
                    <Connector
                      accent={connectorAccent}
                      active={connectorActive}
                      reduced={reduced}
                      vertical={false}
                    />
                  </>
                )}

                <div className="md:flex-1">
                  <StepNode step={step} index={i} active={isActive} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Прогрес-индикатор на конвейера (стъпка X от 6) */}
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          whileInView={reduced ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 flex items-center justify-center gap-2"
          aria-hidden
        >
          {STEPS.map((step, i) => (
            <span
              key={step.id}
              className="h-1.5 rounded-full transition-all duration-500"
              style={{
                width: activeStep === i ? "28px" : "8px",
                background:
                  activeStep === i
                    ? ACCENTS[step.accent].color
                    : "var(--color-border-bright)",
                boxShadow:
                  activeStep === i
                    ? `0 0 12px ${ACCENTS[step.accent].color}`
                    : "none",
              }}
            />
          ))}
        </motion.div>

        {/* Бележка за AI напомнянето */}
        <div className="mt-10">
          <AiReminderNote />
        </div>
      </div>
    </section>
  );
}
