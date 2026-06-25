"use client";

import { motion } from "motion/react";
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

interface ProcessStep {
  readonly id: string;
  /** пореден номер 1..5 */
  readonly n: number;
  /** заглавие на стъпката */
  readonly title: string;
  /** кратко времетраене / етикет (mono) */
  readonly duration: string;
  /** кратко бг копи */
  readonly body: string;
  /** глиф-икона */
  readonly glyph: string;
  /** акцент на възела */
  readonly accent: Accent;
  /** малки маркери „какво се случва“ */
  readonly tags: readonly string[];
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
/*  Данни — 5-те стъпки (фиксирани, илюстративни)                      */
/* ------------------------------------------------------------------ */

const STEPS: readonly ProcessStep[] = [
  {
    id: "razgovor",
    n: 1,
    title: "Разговор",
    duration: "30 мин",
    body: "Сядаме за половин час. Ти разказваш как работи бизнесът днес — запитванията, офертите, цеха, Amazon. Ние слушаме и отбелязваме къде можем да помогнем.",
    glyph: "◇",
    accent: "sky",
    tags: ["Без подготовка", "Безплатно", "На живо или онлайн"],
  },
  {
    id: "demo",
    n: 2,
    title: "Демо с твои данни",
    duration: "след 3–5 дни",
    body: "Връщаме се с жив макет върху ТВОИТЕ примери — твои оферти, твои поръчки. Виждаш точно как ще изглежда, преди да платиш каквото и да е.",
    glyph: "▶",
    accent: "cyan",
    tags: ["Реални примери", "Нула риск", "Виждаш преди да решиш"],
  },
  {
    id: "izgrazhdane",
    n: 3,
    title: "Изграждане",
    duration: "30–60 дни",
    body: "Сглобяваме системата: конвейер за офертите, табло за цеха, автоматичен внос на Amazon имейлите. Ти следиш напредъка стъпка по стъпка.",
    glyph: "◈",
    accent: "amber",
    tags: ["Седмични ъпдейти", "По твоя процес", "Без прекъсване"],
  },
  {
    id: "start",
    n: 4,
    title: "Старт + тренинг",
    duration: "1 ден",
    body: "Пускаме на живо и обучаваме екипа ти — търговеца, цеха, теб. Прости екрани, ясни стъпки. Никой не остава с въпрос „и сега как“.",
    glyph: "✦",
    accent: "cyan",
    tags: ["Обучен екип", "Готови инструкции", "Плавен преход"],
  },
  {
    id: "poddrazhka",
    n: 5,
    title: "Поддръжка",
    duration: "всеки месец",
    body: "Оставаме до теб. Следим, оправяме, надграждаме и добавяме нови автоматизации, докато бизнесът расте. Системата става по-умна с времето.",
    glyph: "↻",
    accent: "emerald",
    tags: ["Постоянна грижа", "Нови функции", "Расте с теб"],
  },
] as const;

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

/** Малък маркер-чип „какво се случва“ на стъпката. */
function Tag({ label, accent }: { label: string; accent: AccentTokens }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-secondary)]"
      style={{
        borderColor: `rgba(${accent.rgb},0.24)`,
        background: `rgba(${accent.rgb},0.05)`,
      }}
    >
      <span aria-hidden style={{ color: accent.color }}>
        ✓
      </span>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Възел (медальон с номера) на оста                                  */
/* ------------------------------------------------------------------ */

function NodeMedallion({
  step,
  accent,
  reduced,
}: {
  step: ProcessStep;
  accent: AccentTokens;
  reduced: boolean;
}) {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center md:h-20 md:w-20">
      {/* Външен halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full blur-xl"
        style={{ background: `radial-gradient(circle, rgba(${accent.rgb},0.45) 0%, transparent 70%)` }}
      />
      {/* Бавно въртящ се пунктирен ринг (без безкрайна анимация по подразбиране — статичен; въртенето е едничката лека ambient линия) */}
      <span
        aria-hidden
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: `rgba(${accent.rgb},0.28)`,
          borderStyle: "dashed",
        }}
      />
      {/* Ядро на медальона */}
      <span
        className="relative flex h-12 w-12 items-center justify-center rounded-full border font-[family-name:var(--font-editorial)] text-xl font-extrabold md:h-14 md:w-14 md:text-2xl"
        style={{
          borderColor: `rgba(${accent.rgb},0.55)`,
          color: accent.color,
          background: "var(--color-bg-deep)",
          boxShadow: `0 0 24px rgba(${accent.rgb},0.35), inset 0 0 14px rgba(${accent.rgb},0.12)`,
        }}
        aria-hidden
      >
        {step.n}
      </span>
      {/* Жив индикатор горе вдясно на медальона */}
      <span className="absolute -right-0.5 -top-0.5 md:right-0 md:top-0">
        <LiveDot accent={accent} reduced={reduced} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Карта на стъпката                                                  */
/* ------------------------------------------------------------------ */

function StepCard({ step, accent }: { step: ProcessStep; accent: AccentTokens }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border p-5 md:p-6"
      style={{
        borderColor: `rgba(${accent.rgb},0.22)`,
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
        boxShadow: `0 0 30px rgba(${accent.rgb},0.10)`,
      }}
    >
      {/* Светеща горна линия */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent.color}, transparent)`,
          opacity: 0.75,
        }}
      />
      {/* Ъглов halo */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl"
        style={{
          opacity: 0.5,
          background: `radial-gradient(circle, ${accent.color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative">
        {/* Header: глиф + времетраене */}
        <div className="flex items-center justify-between gap-3">
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-lg"
            style={{
              borderColor: `rgba(${accent.rgb},0.4)`,
              color: accent.color,
              background: `rgba(${accent.rgb},0.08)`,
            }}
            aria-hidden
          >
            {step.glyph}
          </span>

          <span
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.18em]"
            style={{
              borderColor: `rgba(${accent.rgb},0.3)`,
              color: accent.color,
              background: `rgba(${accent.rgb},0.06)`,
            }}
          >
            <span aria-hidden>◷</span>
            {step.duration}
          </span>
        </div>

        {/* Заглавие */}
        <h3 className="mt-4 font-[family-name:var(--font-editorial)] text-xl font-extrabold leading-tight text-[var(--color-text-primary)] md:text-2xl">
          {step.title}
        </h3>

        {/* Копи */}
        <p className="mt-2.5 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {step.body}
        </p>

        {/* Маркери */}
        <div className="mt-4 flex flex-wrap gap-2">
          {step.tags.map((tag) => (
            <Tag key={tag} label={tag} accent={accent} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Ред от таймлайна (зигзаг на десктоп, лява ос на мобилен)           */
/* ------------------------------------------------------------------ */

function TimelineRow({
  step,
  index,
  reduced,
}: {
  step: ProcessStep;
  index: number;
  reduced: boolean;
}) {
  const accent = ACCENTS[step.accent];
  const left = index % 2 === 0; // зигзаг: четните вляво
  const delay = Math.min(index * 0.12, 0.6);

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative grid grid-cols-[64px_1fr] gap-x-4 md:grid-cols-[1fr_88px_1fr] md:gap-x-0"
    >
      {/* --- Мобилен/таблет: медальон в лявата колона --- */}
      <div className="row-span-1 flex justify-center md:hidden">
        <NodeMedallion step={step} accent={accent} reduced={reduced} />
      </div>

      {/* --- Десктоп ляв слот --- */}
      <div
        className={`hidden md:flex md:items-center ${
          left ? "md:justify-end md:pr-10" : "md:justify-start md:pl-10"
        }`}
      >
        {left ? (
          <div className="w-full max-w-md">
            <StepCard step={step} accent={accent} />
          </div>
        ) : (
          <DesktopMeta step={step} accent={accent} align="right" />
        )}
      </div>

      {/* --- Десктоп централен медальон --- */}
      <div className="hidden md:flex md:items-center md:justify-center">
        <NodeMedallion step={step} accent={accent} reduced={reduced} />
      </div>

      {/* --- Десктоп десен слот --- */}
      <div
        className={`hidden md:flex md:items-center ${
          left ? "md:justify-start md:pl-10" : "md:justify-end md:pr-10"
        }`}
      >
        {left ? (
          <DesktopMeta step={step} accent={accent} align="left" />
        ) : (
          <div className="w-full max-w-md">
            <StepCard step={step} accent={accent} />
          </div>
        )}
      </div>

      {/* --- Мобилен/таблет: картата вдясно от оста --- */}
      <div className="md:hidden">
        <StepCard step={step} accent={accent} />
      </div>
    </motion.div>
  );
}

/** Десктоп „мета" страна срещу картата: голям призрачен номер + етикет. */
function DesktopMeta({
  step,
  accent,
  align,
}: {
  step: ProcessStep;
  accent: AccentTokens;
  align: "left" | "right";
}) {
  return (
    <div
      className={`w-full max-w-md ${align === "right" ? "text-right" : "text-left"}`}
      aria-hidden
    >
      <span
        className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em]"
        style={{ color: accent.color }}
      >
        Стъпка {String(step.n).padStart(2, "0")}
      </span>
      <p
        className="mt-1 font-[family-name:var(--font-editorial)] text-[clamp(48px,7vw,96px)] font-extrabold leading-[0.9]"
        style={{
          color: "transparent",
          WebkitTextStroke: `1px rgba(${accent.rgb},0.4)`,
        }}
      >
        {String(step.n).padStart(2, "0")}
      </p>
      <p className="mt-1 font-[family-name:var(--font-editorial)] text-lg font-bold text-[var(--color-text-tertiary)]">
        {step.title}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Светеща централна ос (SVG draw)                                    */
/* ------------------------------------------------------------------ */

/**
 * Вертикална светеща линия зад медальоните, която се „рисува" при влизане
 * в изгледа. SVG path с pathLength=1 → анимираме strokeDashoffset 1→0.
 * При reduced motion линията е статична (без draw, без движещ се пулс).
 */
function CenterAxis({ reduced }: { reduced: boolean }) {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-[31px] w-px md:left-1/2 md:-translate-x-1/2"
      aria-hidden
    >
      {/* Базова мъглива линия */}
      <div
        className="absolute inset-0 w-px"
        style={{
          background:
            "linear-gradient(180deg, transparent, var(--color-border-bright) 8%, var(--color-border-bright) 92%, transparent)",
        }}
      />

      {/* Рисуваща се светеща линия */}
      <svg
        className="absolute inset-0 h-full w-px overflow-visible"
        preserveAspectRatio="none"
        viewBox="0 0 1 100"
      >
        <defs>
          <linearGradient id="axis-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-sky)" />
            <stop offset="45%" stopColor="var(--color-accent-cyan)" />
            <stop offset="75%" stopColor="var(--color-accent-amber)" />
            <stop offset="100%" stopColor="var(--color-accent-emerald)" />
          </linearGradient>
        </defs>
        <motion.line
          x1="0.5"
          y1="0"
          x2="0.5"
          y2="100"
          stroke="url(#axis-grad)"
          strokeWidth={2}
          strokeLinecap="round"
          style={{ filter: "drop-shadow(0 0 6px rgba(34,211,238,0.6))" }}
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={reduced ? undefined : { pathLength: 1 }}
          viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          transition={{ duration: 1.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
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
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-cyan)] opacity-70" />
        )}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-cyan)]" />
      </span>
      <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
        Как работим
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Финален CTA-ред (обнадеждаващ)                                     */
/* ------------------------------------------------------------------ */

function StartBanner({ reduced }: { reduced: boolean }) {
  const accent = ACCENTS.emerald;
  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 22 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-14 overflow-hidden rounded-2xl border p-6 text-center md:p-8"
      style={{
        borderColor: `rgba(${accent.rgb},0.3)`,
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(52,211,153,0.12) 0%, transparent 60%)",
        }}
      />
      <div className="relative flex flex-col items-center gap-3">
        <div className="flex items-center gap-2">
          <LiveDot accent={accent} reduced={reduced} />
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.28em]"
            style={{ color: accent.color }}
          >
            Готови за теб
          </span>
        </div>
        <p className="max-w-2xl font-[family-name:var(--font-editorial)] text-xl font-extrabold leading-snug text-[var(--color-text-primary)] md:text-2xl">
          Започваме с обикновен разговор.{" "}
          <span className="text-[var(--color-accent-emerald)]">
            Без ангажимент, без риск.
          </span>
        </p>
        <p className="max-w-xl text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          Ти продължаваш да движиш бизнеса си както досега. Ние поемаме тежката
          част — и ти показваме всичко, преди да решиш.
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function ProcessTimeline() {
  const reduced = useReducedMotion();

  const headStyle: CSSProperties = {
    transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
  };

  return (
    <section
      id="proces"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 12% 0%, rgba(56,189,248,0.07) 0%, transparent 55%), radial-gradient(ellipse at 90% 100%, rgba(52,211,153,0.06) 0%, transparent 52%)",
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
          От разговор до{" "}
          <span className="text-[var(--color-accent-sky)]">старт</span>
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Пет ясни стъпки — без изненади и без жаргон. Виждаш точно какво следва на
          всеки етап, а ние оставаме до теб и след старта.
        </motion.p>

        {/* Таймлайн */}
        <div className="relative mt-14 md:mt-20">
          {/* Светеща централна ос */}
          <CenterAxis reduced={reduced} />

          {/* Редовете */}
          <div className="relative flex flex-col gap-12 md:gap-16">
            {STEPS.map((step, i) => (
              <TimelineRow key={step.id} step={step} index={i} reduced={reduced} />
            ))}
          </div>
        </div>

        {/* Финален обнадеждаващ банер */}
        <StartBanner reduced={reduced} />
      </div>
    </section>
  );
}
