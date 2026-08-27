"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MessageSquare,
  Brain,
  User,
  Target,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Calculator,
  RotateCcw,
} from "lucide-react";
import { TimeMap } from "./TimeMap";
import {
  STAGES,
  OBJECTIONS,
  OBJECTION_FRAME,
  PREVENTION,
  SKILLS,
  MY_MISTAKES,
  NUMBERS_NOTE,
  type TimeZone,
} from "./data";

const ZONE_META: Record<TimeZone, { label: string; color: string; bg: string }> = {
  past: { label: "ГАДНО МИНАЛО", color: "#fbbf24", bg: "rgba(180,83,9,0.16)" },
  now: { label: "ГАДНО СЕГА", color: "#cbd5e1", bg: "rgba(100,116,139,0.16)" },
  badFuture: { label: "ГАДНО БЪДЕЩЕ", color: "#fda4af", bg: "rgba(225,29,72,0.16)" },
  goodFuture: { label: "ХУБАВО БЪДЕЩЕ", color: "#67e8f9", bg: "rgba(6,182,212,0.16)" },
  decision: { label: "РЕШЕНИЕТО", color: "#d8b4fe", bg: "rgba(168,85,247,0.16)" },
};

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent-cyan)]">
        {kicker}
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {title}
      </h2>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function StageCard({ index }: { index: number }) {
  const s = STAGES[index];
  const z = ZONE_META[s.zone];
  return (
    <div className="cc-panel overflow-hidden">
      <div
        className="flex flex-wrap items-center gap-3 border-b border-white/10 px-5 py-4"
        style={{ background: z.bg }}
      >
        <span className="font-mono text-3xl font-bold text-white/85">{s.num}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{s.title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{s.goal}</p>
        </div>
        <span
          className="rounded-full px-3 py-1 font-mono text-[10px] font-bold tracking-[0.14em]"
          style={{ background: "rgba(0,0,0,0.35)", color: z.color, border: `1px solid ${z.color}55` }}
        >
          {s.zoneLabel}
        </span>
      </div>

      <div className="grid gap-px bg-white/5 md:grid-cols-2">
        {/* ТИ КАЗВАШ */}
        <div className="bg-[#05050f] p-5">
          <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
            <MessageSquare className="size-3.5" /> Ти казваш
          </p>
          <ul className="space-y-2.5">
            {s.you.map((l, i) => (
              <li
                key={i}
                className="border-l-2 border-[var(--color-accent-cyan)] pl-3 text-[13.5px] leading-relaxed text-[var(--color-text-primary)]"
              >
                {l}
              </li>
            ))}
          </ul>
        </div>

        {/* ТОЙ КАЗВА */}
        <div className="bg-[#05050f] p-5">
          <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-secondary)]">
            <User className="size-3.5" /> Той казва
          </p>
          <ul className="space-y-2">
            {s.them.map((l, i) => (
              <li
                key={i}
                className="rounded-md bg-white/[0.04] px-3 py-2 text-[13px] italic leading-relaxed text-[var(--color-text-secondary)]"
              >
                {l}
              </li>
            ))}
          </ul>
        </div>

        {/* ТОЙ МИСЛИ */}
        <div className="bg-[#05050f] p-5">
          <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0abfc]">
            <Brain className="size-3.5" /> Той мисли
          </p>
          <p className="rounded-lg border border-fuchsia-400/25 bg-fuchsia-500/[0.07] px-4 py-3 text-[13.5px] leading-relaxed text-[#f5d0fe]">
            {s.themThink}
          </p>
        </div>

        {/* ТИ МИСЛИШ */}
        <div className="bg-[#05050f] p-5">
          <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#86efac]">
            <Target className="size-3.5" /> Ти мислиш
          </p>
          <p className="rounded-lg border border-emerald-400/25 bg-emerald-500/[0.07] px-4 py-3 text-[13.5px] leading-relaxed text-[#bbf7d0]">
            {s.youThink}
          </p>
        </div>
      </div>

      <div className="grid gap-px border-t border-white/5 bg-white/5 md:grid-cols-2">
        <div className="flex gap-3 bg-[#0b0510] p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-rose-400" />
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rose-400">
              Така се проваля
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{s.trap}</p>
          </div>
        </div>
        <div className="flex gap-3 bg-[#050b10] p-4">
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-cyan-400" />
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
              Минаваш нататък, когато
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">{s.exit}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Objections() {
  const [active, setActive] = useState(0);
  const o = OBJECTIONS[active];
  return (
    <div>
      <div className="cc-panel mb-5 p-5">
        <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-violet)]">
          Рамката · важи за всяко възражение
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          {OBJECTION_FRAME.map((f, i) => (
            <div key={i} className="rounded-lg border border-violet-400/25 bg-violet-500/[0.06] p-3">
              <p className="mb-1.5 text-[11px] font-bold text-[#d8b4fe]">{f.label}</p>
              <p className="text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">{f.line}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] text-[var(--color-text-tertiary)]">
          Възражението не е „не“ — то е „страх ме е“. Максимум три опита, после топъл отказ и дата за чуване.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {OBJECTIONS.map((x, i) => (
          <button
            key={x.id}
            onClick={() => setActive(i)}
            className="rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition"
            style={{
              borderColor: i === active ? x.tint : "rgba(120,160,220,0.25)",
              background: i === active ? `${x.tint}22` : "transparent",
              color: i === active ? "#fff" : "var(--color-text-secondary)",
            }}
          >
            „{x.label}“
          </button>
        ))}
      </div>

      <div className="cc-panel p-5" style={{ borderColor: `${o.tint}55` }}>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h3 className="text-lg font-bold" style={{ color: o.tint }}>
            „{o.label}“
          </h3>
          {!o.real && (
            <span className="rounded-full border border-amber-400/50 bg-amber-400/10 px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-300">
              НЕ Е ИСТИНСКО ВЪЗРАЖЕНИЕ
            </span>
          )}
        </div>
        {o.note && (
          <p className="mb-4 rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-[var(--color-text-secondary)]">
            {o.note}
          </p>
        )}
        <ol className="space-y-0">
          {o.steps.map((s, i) => (
            <li key={i} className="relative pl-8 pb-4 last:pb-0">
              {i < o.steps.length - 1 && (
                <span
                  className="absolute left-[11px] top-6 bottom-0 w-px"
                  style={{ background: `${o.tint}55` }}
                />
              )}
              <span
                className="absolute left-0 top-1 grid size-[23px] place-items-center rounded-full font-mono text-[10px] font-bold"
                style={{ background: `${o.tint}22`, color: o.tint, border: `1px solid ${o.tint}77` }}
              >
                {i + 1}
              </span>
              <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: o.tint }}>
                {s.label}
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-text-primary)]">{s.line}</p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const LS_KEY = "pm-skript-scorecard-v1";

function Scorecard() {
  const [scores, setScores] = useState<Record<string, number>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setScores(JSON.parse(raw));
    } catch {
      /* празно е ок */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(scores));
    } catch {
      /* без localStorage пак работи, само не помни */
    }
  }, [scores, loaded]);

  const filled = Object.values(scores).filter((v) => v > 0);
  const avg = filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : 0;
  const weakest = useMemo(
    () =>
      SKILLS.filter((s) => (scores[s.id] ?? 0) > 0)
        .sort((a, b) => (scores[a.id] ?? 0) - (scores[b.id] ?? 0))
        .slice(0, 3),
    [scores],
  );

  return (
    <div className="cc-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          След всеки разговор — оценка 1–10 по всяко умение. Пази се в този браузър.
        </p>
        <div className="flex items-center gap-3">
          {filled.length > 0 && (
            <span className="font-mono text-sm text-[var(--color-accent-cyan)]">
              средно {avg.toFixed(1)} · {filled.length}/{SKILLS.length}
            </span>
          )}
          <button
            onClick={() => setScores({})}
            className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:border-rose-400/50 hover:text-rose-300"
          >
            <RotateCcw className="size-3.5" /> Нов разговор
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        {SKILLS.map((s) => {
          const v = scores[s.id] ?? 0;
          return (
            <div
              key={s.id}
              className="grid grid-cols-1 items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_auto]"
            >
              <div className="min-w-0">
                <p className="truncate text-[13.5px] font-medium text-[var(--color-text-primary)]">
                  {s.label}
                </p>
                <p className="truncate text-[11.5px] text-[var(--color-text-tertiary)]">{s.hint}</p>
              </div>
              <div className="flex gap-[3px]">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const on = v >= n;
                  const hue = n <= 4 ? "#e11d48" : n <= 7 ? "#f59e0b" : "#22d3ee";
                  return (
                    <button
                      key={n}
                      aria-label={`${s.label}: ${n}`}
                      onClick={() => setScores((p) => ({ ...p, [s.id]: p[s.id] === n ? 0 : n }))}
                      className="size-[19px] rounded-[4px] border text-[9px] font-bold transition"
                      style={{
                        background: on ? hue : "transparent",
                        borderColor: on ? hue : "rgba(120,160,220,0.28)",
                        color: on ? "#04040c" : "var(--color-text-tertiary)",
                      }}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {weakest.length > 0 && (
        <div className="mt-5 rounded-lg border border-rose-400/30 bg-rose-500/[0.07] p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-rose-300">
            Утре тренираш това
          </p>
          <ul className="mt-2 space-y-1">
            {weakest.map((s) => (
              <li key={s.id} className="text-[13.5px] text-[#fecdd3]">
                <span className="font-mono font-bold">{scores[s.id]}</span> · {s.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

export function SkriptTrainer() {
  const [stage, setStage] = useState(1);

  return (
    <div className="space-y-12 pb-16">
      {/* ---- шапка ---- */}
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent-cyan)]">
          Тренажор · само за Ивайло
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Разговорът
        </h1>
        <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
          Целият скрипт за AI автоматизациите, подреден по това{" "}
          <b className="text-[var(--color-text-primary)]">къде стои клиентът във времето</b> на всеки етап.
          Разговорът е движение: изкарваш го от гадното сега, връщаш го в гадното минало да си признае
          защо, вдигаш го в хубавото бъдеще — и после му го отнемаш. Оттам решението се взима само.
        </p>
      </header>

      {/* ---- картата ---- */}
      <section>
        <SectionTitle kicker="Картата" title="Къде е клиентът във всеки момент" />
        <div className="cc-panel p-4 sm:p-6">
          <TimeMap
            activeNum={STAGES[stage]?.num}
            activeZone={STAGES[stage]?.zone}
            onPick={(num) => {
              const i = STAGES.findIndex((s) => s.num === num);
              if (i >= 0) setStage(i);
            }}
          />
          <p className="mt-3 text-center text-[12px] text-[var(--color-text-tertiary)]">
            Цъкни върху номер, за да отвориш етапа. Червената линия надолу е моментът, в който му
            отнемаш хубавото бъдеще — там се ражда решението.
          </p>
        </div>
      </section>

      {/* ---- етапите ---- */}
      <section>
        <SectionTitle kicker="Етапите" title="Четирите писти на всеки етап" />
        <div className="mb-4 flex flex-wrap gap-1.5">
          {STAGES.map((s, i) => {
            const on = i === stage;
            const z = ZONE_META[s.zone];
            return (
              <button
                key={s.id}
                onClick={() => setStage(i)}
                className="rounded-lg border px-3 py-1.5 text-left transition"
                style={{
                  borderColor: on ? z.color : "rgba(120,160,220,0.22)",
                  background: on ? z.bg : "transparent",
                }}
              >
                <span
                  className="font-mono text-[11px] font-bold"
                  style={{ color: on ? z.color : "var(--color-text-tertiary)" }}
                >
                  {s.num}
                </span>
                <span
                  className="ml-1.5 text-[12.5px]"
                  style={{ color: on ? "#fff" : "var(--color-text-secondary)" }}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
        <StageCard index={stage} />
        <div className="mt-3 flex justify-between">
          <button
            onClick={() => setStage((s) => Math.max(0, s - 1))}
            disabled={stage === 0}
            className="cc-btn px-4 py-2 text-[13px] disabled:opacity-30"
          >
            ← Назад
          </button>
          <button
            onClick={() => setStage((s) => Math.min(STAGES.length - 1, s + 1))}
            disabled={stage === STAGES.length - 1}
            className="cc-btn cc-btn-primary px-4 py-2 text-[13px] disabled:opacity-30"
          >
            Напред →
          </button>
        </div>
      </section>

      {/* ---- възражения ---- */}
      <section>
        <SectionTitle kicker="Когато се дръпне" title="Възраженията" />
        <Objections />
      </section>

      {/* ---- превенция ---- */}
      <section>
        <SectionTitle kicker="Преди да се появи" title="Превенция" />
        <div className="grid gap-4 lg:grid-cols-2">
          {PREVENTION.map((p) => (
            <div key={p.id} className="cc-panel p-5">
              <div className="mb-3 flex items-start gap-2.5">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">{p.title}</h3>
                  <p className="text-[12.5px] text-[var(--color-text-tertiary)]">{p.sub}</p>
                </div>
              </div>
              <div className="space-y-2">
                {p.lines.map((l, i) =>
                  l.who === "ти" ? (
                    <p
                      key={i}
                      className="border-l-2 border-emerald-400/70 pl-3 text-[13.5px] leading-relaxed text-[var(--color-text-primary)]"
                    >
                      {l.text}
                    </p>
                  ) : (
                    <p
                      key={i}
                      className="ml-3 rounded-md bg-white/[0.04] px-3 py-1.5 text-[13px] italic text-[var(--color-text-secondary)]"
                    >
                      {l.text}
                    </p>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- моите грешки ---- */}
      <section>
        <SectionTitle kicker="От записите на моите разговори" title="Грешките, които правя аз" />
        <div className="grid gap-3 md:grid-cols-2">
          {MY_MISTAKES.map((m) => (
            <div key={m.id} className="cc-panel p-4">
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded bg-rose-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                  {m.where}
                </span>
                <h3 className="text-[14.5px] font-bold text-[var(--color-text-primary)]">{m.title}</h3>
              </div>
              <p className="mb-2 text-[12.5px] italic leading-relaxed text-[var(--color-text-tertiary)]">
                {m.evidence}
              </p>
              <p className="flex gap-2 text-[13px] leading-relaxed text-[#a7f3d0]">
                <Sparkles className="mt-0.5 size-3.5 shrink-0" />
                {m.fix}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- числата ---- */}
      <section>
        <SectionTitle kicker="Мярката" title="Двете сметки, които показват къде съм" />
        <div className="cc-panel p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-cyan-400/25 bg-cyan-500/[0.06] p-4">
              <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                <Calculator className="size-3.5" /> Успеваемост
              </p>
              <p className="font-mono text-[13.5px] text-[var(--color-text-primary)]">
                {NUMBERS_NOTE.formula1}
              </p>
              <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
                {NUMBERS_NOTE.example}
              </p>
            </div>
            <div className="rounded-lg border border-violet-400/25 bg-violet-500/[0.06] p-4">
              <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-violet-300">
                <Calculator className="size-3.5" /> Стойност на един разговор
              </p>
              <p className="font-mono text-[13.5px] text-[var(--color-text-primary)]">
                {NUMBERS_NOTE.formula2}
              </p>
              <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
                Показва колко струва всеки проведен разговор — включително изгубените.
              </p>
            </div>
          </div>
          <p className="mt-3 text-[12.5px] text-[var(--color-text-tertiary)]">
            {NUMBERS_NOTE.benchmark}
          </p>
        </div>
      </section>

      {/* ---- самооценка ---- */}
      <section>
        <SectionTitle kicker="След всеки разговор" title="Самооценка" />
        <Scorecard />
      </section>
    </div>
  );
}
