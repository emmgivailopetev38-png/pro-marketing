"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import type { Transition, Variants } from "motion/react";
import { AuroraBackground } from "@/components/effects/AuroraBackground";
import { ParticleField } from "@/components/effects/ParticleField";
import { TextScramble } from "@/components/effects/TextScramble";
import { HolographicText } from "@/components/effects/HolographicText";
import { MagneticButton } from "@/components/effects/MagneticButton";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

/* ── Типизирани данни ─────────────────────────────────────────── */

interface BootLine {
  readonly text: string;
  readonly delayMs: number;
}

const BOOT_LINES: readonly BootLine[] = [
  { text: "› подреждам офертите…", delayMs: 600 },
  { text: "› чета входящите имейли…", delayMs: 1250 },
  { text: "› синхронизирам производството…", delayMs: 1900 },
];

interface SystemStat {
  readonly value: string;
  readonly label: string;
  readonly accent: string;
}

const SYSTEM_STATS: readonly SystemStat[] = [
  { value: "1", label: "система за всичко", accent: "var(--color-accent-cyan)" },
  { value: "2", label: "канала · БГ + свят", accent: "var(--color-accent-sky)" },
  { value: "24/7", label: "буден център", accent: "var(--color-accent-emerald)" },
];

/* ── Boot sequence (typing + зелено ✓) ────────────────────────── */

function BootSequence({ reduced }: { reduced: boolean }) {
  const [revealed, setRevealed] = useState<number>(0);

  useEffect(() => {
    const timers = BOOT_LINES.map((line, i) =>
      window.setTimeout(
        () => setRevealed((n) => Math.max(n, i + 1)),
        reduced ? 0 : line.delayMs
      )
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [reduced]);

  return (
    <div
      className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[var(--color-border-default)] bg-[var(--color-bg-glass)] p-5 backdrop-blur-xl"
      style={{ boxShadow: "inset 0 0 30px rgba(6,182,212,0.06), 0 0 40px rgba(6,182,212,0.08)" }}
    >
      {/* скенираща линия */}
      {!reduced && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--color-accent-cyan), transparent)",
          }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: ["0%", "1700%"], opacity: [0, 0.9, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear", delay: 2 }}
        />
      )}

      <div className="mb-4 flex items-center gap-2">
        <span
          aria-hidden
          className="inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-emerald)]"
          style={{ boxShadow: "0 0 10px var(--color-accent-emerald)" }}
        />
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
          boot · promarketing_os
        </span>
      </div>

      <ul className="space-y-2.5 font-[family-name:var(--font-mono)] text-[13px] leading-relaxed">
        {BOOT_LINES.map((line, i) => {
          const isOpen = i < revealed;
          return (
            <li
              key={line.text}
              className="flex items-center justify-between gap-3 transition-all duration-500"
              style={{
                opacity: isOpen ? 1 : 0.18,
                transform: isOpen ? "translateX(0)" : "translateX(-6px)",
              }}
            >
              <span className="text-[var(--color-text-secondary)]">
                {line.text}
                {isOpen && !reduced && i === revealed - 1 && (
                  <motion.span
                    aria-hidden
                    className="ml-0.5 inline-block h-[1em] w-[7px] translate-y-[2px] bg-[var(--color-accent-cyan)]"
                    animate={{ opacity: [1, 0, 1] }}
                    transition={{ duration: 0.9, repeat: Infinity }}
                  />
                )}
              </span>
              <span
                className="flex-shrink-0 text-[var(--color-accent-emerald)] transition-opacity duration-500"
                style={{ opacity: isOpen ? 1 : 0 }}
                aria-hidden={!isOpen}
              >
                ✓
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── HERO ─────────────────────────────────────────────────────── */

export function TodorHero() {
  const reduced = useReducedMotion();

  const ease: Transition["ease"] = [0.22, 1, 0.36, 1];
  const container: Variants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduced ? 0 : 0.12, delayChildren: reduced ? 0 : 0.1 },
    },
  };
  const rise: Variants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 28 },
    show: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.8, ease } },
  };

  return (
    <section
      id="top"
      className="relative flex min-h-screen flex-col justify-center overflow-hidden font-[family-name:var(--font-body)]"
    >
      {/* ── Фон (зад съдържанието) ── */}
      <div aria-hidden className="absolute inset-0 z-0">
        <AuroraBackground intensity="normal" />
        <ParticleField density={50} />
        {/* лек grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-accent-cyan) 1px, transparent 1px), linear-gradient(90deg, var(--color-accent-cyan) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
            maskImage:
              "radial-gradient(ellipse at 50% 45%, black 0%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 50% 45%, black 0%, transparent 80%)",
          }}
        />
        {/* долен fade към void */}
        <div
          className="absolute inset-x-0 bottom-0 h-40"
          style={{ background: "linear-gradient(to bottom, transparent, var(--color-bg-void))" }}
        />
      </div>

      {/* ── Съдържание ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto flex w-full max-w-5xl flex-col px-6 py-28 md:px-12"
      >
        {/* eyebrow */}
        <motion.div variants={rise} className="mb-7 flex items-center">
          <span className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-bg-glass)] px-4 py-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)] backdrop-blur-md">
            <span className="relative flex h-2 w-2" aria-hidden>
              {!reduced && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-accent-cyan)] opacity-75" />
              )}
              <span
                className="relative inline-flex h-2 w-2 rounded-full bg-[var(--color-accent-cyan)]"
                style={{ boxShadow: "0 0 10px var(--color-accent-cyan)" }}
              />
            </span>
            ПРОМАРКЕТИНГ OS · 2050
          </span>
        </motion.div>

        {/* ОГРОМНО заглавие */}
        <motion.h1
          variants={rise}
          lang="bg"
          className="font-[family-name:var(--font-editorial)] text-[clamp(64px,12vw,180px)] font-extrabold leading-[0.9] tracking-tight text-[var(--color-text-primary)]"
          style={{ textShadow: "0 0 60px rgba(34,211,238,0.25)" }}
        >
          <TextScramble text="Бъдещето" durationMs={1100} />
        </motion.h1>

        {/* холографски подзаглавен ред */}
        <motion.div variants={rise} className="mt-3 md:mt-4">
          <HolographicText
            as="h2"
            className="font-[family-name:var(--font-editorial)] text-[clamp(22px,4vw,46px)] font-bold leading-[1.05]"
          >
            командният център на бизнеса ти
          </HolographicText>
        </motion.div>

        {/* параграф */}
        <motion.p
          variants={rise}
          className="mt-7 max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg"
        >
          Целият бизнес — запитванията, офертите, поръчките и производството — се движи от{" "}
          <span className="font-[family-name:var(--font-editorial)] font-bold text-[var(--color-text-primary)]">
            една жива система
          </span>
          , в която AI агенти вършат работата вместо теб.
        </motion.p>

        {/* sector chip */}
        <motion.div variants={rise} className="mt-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-bright)] bg-[rgba(34,211,238,0.06)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-[0.3em] text-[var(--color-accent-sky)]">
            <span aria-hidden className="text-[var(--color-accent-cyan)]">
              ◈
            </span>
            AI агенти · CRM · Автоматизации
          </span>
        </motion.div>

        {/* boot + статистики */}
        <motion.div
          variants={rise}
          className="mt-10 flex flex-col items-start gap-7 lg:flex-row lg:items-center"
        >
          <BootSequence reduced={reduced} />

          <div aria-hidden className="hidden h-16 w-px bg-[var(--color-border-default)] lg:block" />

          <ul className="flex flex-wrap gap-x-8 gap-y-4">
            {SYSTEM_STATS.map((stat) => (
              <li key={stat.label} className="flex flex-col">
                <span
                  className="font-[family-name:var(--font-editorial)] text-3xl font-extrabold leading-none md:text-4xl"
                  style={{ color: stat.accent, textShadow: `0 0 24px ${stat.accent}55` }}
                >
                  {stat.value}
                </span>
                <span className="mt-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-tertiary)]">
                  {stat.label}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* бутони-пили */}
        <motion.div variants={rise} className="mt-11 flex flex-wrap items-center gap-4">
          <MagneticButton strength={0.4} radius={72}>
            <a
              href="#agenti"
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full bg-[var(--color-accent-cyan)] px-7 py-3.5 text-sm font-bold uppercase tracking-[0.12em] text-[var(--color-bg-void)] shadow-[0_0_45px_rgba(34,211,238,0.45)] transition-shadow hover:shadow-[0_0_70px_rgba(34,211,238,0.7)]"
            >
              <span>Виж агентите</span>
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </a>
          </MagneticButton>

          <MagneticButton strength={0.3} radius={64}>
            <a
              href="#system"
              className="group inline-flex items-center gap-3 rounded-full border border-[var(--color-border-bright)] bg-[var(--color-bg-glass)] px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--color-text-primary)] backdrop-blur-md transition-colors hover:border-[var(--color-accent-cyan)] hover:text-[var(--color-accent-cyan)]"
            >
              <span aria-hidden className="text-[var(--color-accent-emerald)]">
                ▶
              </span>
              <span>Влез в системата</span>
            </a>
          </MagneticButton>
        </motion.div>
      </motion.div>

      {/* ── Scroll cue ── */}
      <motion.a
        href="#system"
        aria-label="Скролни надолу"
        className="absolute inset-x-0 bottom-7 z-10 mx-auto flex w-fit flex-col items-center gap-2 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-cyan)]"
        initial={reduced ? false : { opacity: 0 }}
        animate={reduced ? undefined : { opacity: 1 }}
        transition={{ delay: 2.2, duration: 0.8 }}
      >
        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[0.3em]">
          скрол
        </span>
        <motion.span
          aria-hidden
          className="text-lg leading-none"
          animate={reduced ? undefined : { y: [0, 7, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          ↓
        </motion.span>
      </motion.a>
    </section>
  );
}
