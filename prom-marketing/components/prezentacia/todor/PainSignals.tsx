"use client";

import { motion } from "motion/react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ------------------------------------------------------------------ */
/*  Типове                                                             */
/* ------------------------------------------------------------------ */

interface Gain {
  readonly id: string;
  readonly glyph: string;
  readonly title: string;
  readonly body: string;
  readonly accentVar: string;
}

/* ------------------------------------------------------------------ */
/*  Данни — какво става по-лесно (топъл, спокоен тон)                  */
/* ------------------------------------------------------------------ */

const GAINS: readonly Gain[] = [
  {
    id: "01",
    glyph: "◈",
    title: "Офертите — винаги подредени",
    body: "Всяка оферта си има място и ясен статус. Виждаш докъде е стигнала, без да помниш наизуст и без да ровиш в чата.",
    accentVar: "var(--color-accent-cyan)",
  },
  {
    id: "02",
    glyph: "✦",
    title: "Amazon имейлите — въвеждат се сами",
    body: "Поръчките от Amazon, crowdfunding и маркетплейсите влизат автоматично в системата — без копи-пейст на ръка.",
    accentVar: "var(--color-accent-amber)",
  },
  {
    id: "03",
    glyph: "⚙",
    title: "Производството — видимо наведнъж",
    body: "Всяка поръчка показва в кой етап е и кога ще е готова. По-малко въпроси „докъде стигнахме“, повече спокойствие.",
    accentVar: "var(--color-accent-emerald)",
  },
  {
    id: "04",
    glyph: "▦",
    title: "Всичко — на един екран",
    body: "Клиенти, оферти, поръчки и производство на едно място. Вместо десет таблици и тетрадки — една ясна картина.",
    accentVar: "var(--color-accent-sky)",
  },
];

/* ------------------------------------------------------------------ */
/*  Карта „какво става по-лесно“                                       */
/* ------------------------------------------------------------------ */

function GainCard({ gain, index }: { gain: Gain; index: number }) {
  const reduced = useReducedMotion();

  return (
    <motion.article
      initial={reduced ? false : { opacity: 0, y: 26 }}
      whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex items-start gap-5 overflow-hidden rounded-3xl border p-6 md:p-7"
      style={{
        borderColor: "var(--color-border-default)",
        background: "var(--color-bg-glass)",
        backdropFilter: "blur(14px)",
      }}
    >
      {/* мек ъглов halo при hover */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-60"
        style={{ background: `radial-gradient(circle, ${gain.accentVar} 0%, transparent 70%)` }}
      />
      {/* тънка светеща горна линия */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px opacity-40 transition-opacity duration-500 group-hover:opacity-90"
        style={{ background: `linear-gradient(90deg, transparent, ${gain.accentVar}, transparent)` }}
      />

      {/* глиф-бадж */}
      <div
        className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-lg"
        style={{
          borderColor: "var(--color-border-bright)",
          color: gain.accentVar,
          background: "rgba(255,255,255,0.03)",
        }}
        aria-hidden
      >
        {gain.glyph}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span aria-hidden style={{ color: gain.accentVar }}>
            ✓
          </span>
          <span
            className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]"
            style={{ color: gain.accentVar }}
          >
            по-лесно
          </span>
        </div>

        <h3 className="mt-2 font-[family-name:var(--font-editorial)] text-xl font-bold leading-tight text-[var(--color-text-primary)] md:text-2xl">
          {gain.title}
        </h3>

        <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
          {gain.body}
        </p>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/*  Главна секция                                                      */
/* ------------------------------------------------------------------ */

export function PainSignals() {
  const reduced = useReducedMotion();

  return (
    <section
      id="bolki"
      className="relative overflow-hidden border-t border-[var(--color-border-default)] py-24 md:py-32"
    >
      {/* Мек фонов ambient градиент */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 0%, rgba(34,211,238,0.06) 0%, transparent 55%), radial-gradient(ellipse at 90% 25%, rgba(52,211,153,0.05) 0%, transparent 50%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 md:px-12">
        {/* Eyebrow */}
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 16 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5"
        >
          <span className="relative flex h-2 w-2" aria-hidden>
            {!reduced && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-emerald)] opacity-60" />
            )}
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-emerald)]" />
          </span>
          <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-accent-emerald)]">
            По-малко ръчно · повече яснота
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
          Какво става <span className="text-[var(--color-accent-cyan)]">по-лесно</span>
        </motion.h2>

        {/* Подзаглавие */}
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Запазваш начина, по който работиш — само ежедневието става по-спокойно и
          подредено. Ето кои неща си идват на мястото.
        </motion.p>

        {/* Карти */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          {GAINS.map((gain, i) => (
            <GainCard key={gain.id} gain={gain} index={i} />
          ))}
        </div>

        {/* Топъл финал → агентите */}
        <motion.a
          href="#agenti"
          initial={reduced ? false : { opacity: 0, y: 18 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="group mt-10 flex flex-col items-start gap-3 rounded-3xl border p-7 md:flex-row md:items-center md:justify-between md:p-8"
          style={{
            borderColor: "var(--color-border-bright)",
            background:
              "linear-gradient(120deg, rgba(34,211,238,0.08), rgba(52,211,153,0.05))",
          }}
        >
          <p className="font-[family-name:var(--font-editorial)] text-lg font-bold leading-snug text-[var(--color-text-primary)] md:text-2xl">
            А черната работа я поемат{" "}
            <span className="text-[var(--color-accent-cyan)]">твоите AI агенти</span>.
          </p>
          <span className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-sm uppercase tracking-[0.2em] text-[var(--color-accent-cyan)]">
            Виж агентите
            <span aria-hidden className="transition-transform group-hover:translate-y-1">
              ↓
            </span>
          </span>
        </motion.a>
      </div>
    </section>
  );
}
