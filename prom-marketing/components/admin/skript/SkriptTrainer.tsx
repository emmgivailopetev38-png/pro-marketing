"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  Map as MapIcon,
  Layers,
  ShieldQuestion,
  ClipboardCheck,
  PenLine,
  LineChart,
  Tag,
  Info,
} from "lucide-react";
import { TimeMap } from "./TimeMap";
import { Pricing } from "./Pricing";
import { Progress } from "./Progress";
import { CallReviewForm } from "./CallReviewForm";
import type { CallReview } from "@/app/admin/(protected)/skript/actions";
import {
  STAGES,
  OBJECTIONS,
  OBJECTION_FRAME,
  PREVENTION,
  MY_MISTAKES,
  NUMBERS_NOTE,
  PREP_CHECKLIST,
  type TimeZone,
} from "./data";

const ZONE_META: Record<TimeZone, { label: string; color: string; bg: string }> = {
  past: { label: "ГАДНО МИНАЛО", color: "#fbbf24", bg: "rgba(180,83,9,0.16)" },
  now: { label: "ГАДНО СЕГА", color: "#cbd5e1", bg: "rgba(100,116,139,0.16)" },
  badFuture: { label: "ГАДНО БЪДЕЩЕ", color: "#fda4af", bg: "rgba(225,29,72,0.16)" },
  goodFuture: { label: "ХУБАВО БЪДЕЩЕ", color: "#67e8f9", bg: "rgba(6,182,212,0.16)" },
  decision: { label: "РЕШЕНИЕТО", color: "#d8b4fe", bg: "rgba(168,85,247,0.16)" },
};

type TabId = "karta" | "etapi" | "vazrazheniya" | "predi" | "sled" | "napredak" | "ceni";

const TABS: { id: TabId; label: string; icon: typeof MapIcon; hint: string }[] = [
  { id: "karta", label: "Картата", icon: MapIcon, hint: "как е устроен разговорът" },
  { id: "etapi", label: "Етапите", icon: Layers, hint: "какво казваш на всеки етап" },
  { id: "vazrazheniya", label: "Възражения", icon: ShieldQuestion, hint: "когато се дръпне" },
  { id: "predi", label: "Преди срещата", icon: ClipboardCheck, hint: "15 минути подготовка" },
  { id: "sled", label: "След срещата", icon: PenLine, hint: "записваш разговора" },
  { id: "napredak", label: "Напредък", icon: LineChart, hint: "ставаш ли по-добър" },
  { id: "ceni", label: "Цени", icon: Tag, hint: "колко струва и защо" },
];

function Head({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--color-accent-cyan)]">
        {kicker}
      </p>
      <h2 className="mt-1 text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {title}
      </h2>
      {sub && (
        <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
          {sub}
        </p>
      )}
    </div>
  );
}

/* ================= ЕТАП ================= */

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

        <div className="bg-[#05050f] p-5">
          <p className="mb-3 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[#f0abfc]">
            <Brain className="size-3.5" /> Той мисли
          </p>
          <p className="rounded-lg border border-fuchsia-400/25 bg-fuchsia-500/[0.07] px-4 py-3 text-[13.5px] leading-relaxed text-[#f5d0fe]">
            {s.themThink}
          </p>
        </div>

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
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {s.trap}
            </p>
          </div>
        </div>
        <div className="flex gap-3 bg-[#050b10] p-4">
          <ArrowRight className="mt-0.5 size-4 shrink-0 text-cyan-400" />
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-400">
              Минаваш нататък, когато
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {s.exit}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= ВЪЗРАЖЕНИЯ ================= */

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
              <p className="text-[12.5px] leading-relaxed text-[var(--color-text-secondary)]">
                {f.line}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] text-[var(--color-text-tertiary)]">
          Възражението не е „не“ — то е „страх ме е“. Максимум три опита, после топъл отказ и дата.
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
            <li key={i} className="relative pb-4 pl-8 last:pb-0">
              {i < o.steps.length - 1 && (
                <span
                  className="absolute bottom-0 left-[11px] top-6 w-px"
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
              <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-text-primary)]">
                {s.line}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/* ================= ПРЕДИ СРЕЩАТА ================= */

function Prep() {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const all = PREP_CHECKLIST.flatMap((g) => g.items);
  const doneCount = all.filter((i) => checked[i.id]).length;

  return (
    <div className="space-y-5">
      <div className="cc-panel flex flex-wrap items-center justify-between gap-3 p-4">
        <p className="text-[13.5px] text-[var(--color-text-secondary)]">
          Мини през това преди всяка среща. Отнема 15 минути и решава първите пет.
        </p>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-[var(--color-accent-cyan)]">
            {doneCount} / {all.length}
          </span>
          <button
            onClick={() => setChecked({})}
            className="rounded-md border border-white/15 px-2.5 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:border-rose-400/50 hover:text-rose-300"
          >
            Изчисти
          </button>
        </div>
      </div>

      {PREP_CHECKLIST.map((g) => (
        <div key={g.group} className="cc-panel p-5">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
            {g.group}
          </p>
          <div className="space-y-1">
            {g.items.map((i) => {
              const on = !!checked[i.id];
              return (
                <button
                  key={i.id}
                  onClick={() => setChecked((p) => ({ ...p, [i.id]: !p[i.id] }))}
                  className="flex w-full gap-3 rounded-lg p-2.5 text-left transition hover:bg-white/[0.03]"
                >
                  <span
                    className="mt-0.5 grid size-[19px] shrink-0 place-items-center rounded-[5px] border text-[11px] font-bold transition"
                    style={{
                      borderColor: on ? "#22d3ee" : "rgba(120,160,220,0.3)",
                      background: on ? "#22d3ee" : "transparent",
                      color: "#04040c",
                    }}
                  >
                    {on ? "✓" : ""}
                  </span>
                  <span className="min-w-0">
                    <span
                      className="block text-[14px] transition"
                      style={{
                        color: on ? "var(--color-text-tertiary)" : "var(--color-text-primary)",
                        textDecoration: on ? "line-through" : "none",
                      }}
                    >
                      {i.label}
                    </span>
                    <span className="block text-[12px] text-[var(--color-text-tertiary)]">
                      {i.why}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-3 rounded-lg border border-cyan-400/25 bg-cyan-500/[0.06] p-4">
        <Info className="mt-0.5 size-4 shrink-0 text-cyan-300" />
        <p className="text-[13.5px] leading-relaxed text-[#a5f3fc]">
          Последното е най-важно и не се цъка — <b>влизаш да разбереш, не да продадеш</b>. Нагласата
          се чува в първите десет секунди и определя целия разговор.
        </p>
      </div>
    </div>
  );
}

/* ================= ГЛАВНИЯТ КОМПОНЕНТ ================= */

export function SkriptTrainer({ reviews }: { reviews: CallReview[] }) {
  const [tab, setTab] = useState<TabId>("karta");
  const [stage, setStage] = useState(1);
  const router = useRouter();

  function goStage(num: string) {
    const i = STAGES.findIndex((s) => s.num === num);
    if (i >= 0) {
      setStage(i);
      setTab("etapi");
    }
  }

  return (
    <div className="pb-16">
      {/* ---- шапка ---- */}
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-[var(--color-accent-cyan)]">
          Тренажор · само за Ивайло
        </p>
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Разговорът
        </h1>
      </header>

      {/* ---- табове ---- */}
      <nav className="sticky top-0 z-20 -mx-4 mb-7 border-b border-white/10 bg-[rgba(3,3,8,0.9)] px-4 py-2 backdrop-blur">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {TABS.map((t) => {
            const on = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex shrink-0 items-center gap-2 rounded-lg border px-3.5 py-2 text-[13px] font-medium transition"
                style={{
                  borderColor: on ? "var(--color-accent-cyan)" : "rgba(120,160,220,0.18)",
                  background: on ? "rgba(6,182,212,0.13)" : "transparent",
                  color: on ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                <Icon className="size-4" style={{ color: on ? "#22d3ee" : undefined }} />
                {t.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ================= КАРТАТА ================= */}
      {tab === "karta" && (
        <div className="space-y-8">
          <Head
            kicker="Картата"
            title="Къде стои клиентът във всеки момент"
            sub="Разговорът е движение във времето. Изкарваш го от гадното сега, връщаш го в гадното минало да си признае защо, вдигаш го в хубавото бъдеще — и после му го отнемаш. Оттам решението се взима само. Цъкни върху номер, за да отвориш етапа."
          />
          <div className="cc-panel p-4 sm:p-6">
            <TimeMap
              activeNum={STAGES[stage]?.num}
              activeZone={STAGES[stage]?.zone}
              onPick={goStage}
            />
          </div>

          <div>
            <Head kicker="Мярката" title="Двете сметки, които показват къде си" />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="cc-panel p-5">
                <p className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300">
                  <Calculator className="size-3.5" /> Успеваемост
                </p>
                <p className="font-mono text-[13.5px] text-[var(--color-text-primary)]">
                  {NUMBERS_NOTE.formula1}
                </p>
                <p className="mt-2 text-[13px] text-[var(--color-text-secondary)]">
                  {NUMBERS_NOTE.example}
                </p>
                <p className="mt-2 text-[12.5px] text-[var(--color-text-tertiary)]">
                  {NUMBERS_NOTE.benchmark}
                </p>
              </div>
              <div className="cc-panel p-5">
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
          </div>

          <div>
            <Head
              kicker="От записите на моите разговори"
              title="Грешките, които правя аз"
              sub="Извлечени от реалните записи. Това са шестте неща, които ми костват сделки."
            />
            <div className="grid gap-3 md:grid-cols-2">
              {MY_MISTAKES.map((m) => (
                <div key={m.id} className="cc-panel p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-rose-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-rose-300">
                      {m.where}
                    </span>
                    <h3 className="text-[14.5px] font-bold text-[var(--color-text-primary)]">
                      {m.title}
                    </h3>
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
          </div>
        </div>
      )}

      {/* ================= ЕТАПИТЕ ================= */}
      {tab === "etapi" && (
        <div>
          <Head
            kicker="Етапите"
            title="Четирите писти на всеки етап"
            sub="Какво казваш · какво казва той · какво мисли той · какво мислиш ти. Плюс капана и знака, че е време да минеш нататък."
          />
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

          <div className="mt-10">
            <Head
              kicker="Преди да се появи"
              title="Превенция"
              sub="Възражение, убито преди да е изречено, не иска оборване."
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {PREVENTION.map((p) => (
                <div key={p.id} className="cc-panel p-5">
                  <div className="mb-3 flex items-start gap-2.5">
                    <ShieldAlert className="mt-0.5 size-4 shrink-0 text-emerald-400" />
                    <div>
                      <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                        {p.title}
                      </h3>
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
          </div>
        </div>
      )}

      {/* ================= ВЪЗРАЖЕНИЯ ================= */}
      {tab === "vazrazheniya" && (
        <div>
          <Head
            kicker="Когато се дръпне"
            title="Възраженията"
            sub="Не се оборват — превръщат се във въпрос. Максимум три опита, после топъл отказ и дата за чуване."
          />
          <Objections />
        </div>
      )}

      {/* ================= ПРЕДИ ================= */}
      {tab === "predi" && (
        <div>
          <Head
            kicker="Преди срещата"
            title="Петнайсетте минути, които решават първите пет"
            sub="Влизаш с три факта и две хипотези — и не казваш нито един от тях в началото."
          />
          <Prep />
        </div>
      )}

      {/* ================= СЛЕД ================= */}
      {tab === "sled" && (
        <div>
          <Head
            kicker="След срещата"
            title="Записваш разговора, докато е топъл"
            sub="Веднага след затварянето, не вечерта. Всичко тук се пази в базата и след няколко разговора „Напредък“ ти показва дали наистина ставаш по-добър."
          />
          <CallReviewForm onSaved={() => router.refresh()} />
        </div>
      )}

      {/* ================= НАПРЕДЪК ================= */}
      {tab === "napredak" && (
        <div>
          <Head
            kicker="Напредък"
            title="Ставаш ли по-добър"
            sub="Числата идват от записаните разговори. Колкото по-честно оценяваш, толкова по-полезно е тук."
          />
          <Progress reviews={reviews} />
        </div>
      )}

      {/* ================= ЦЕНИ ================= */}
      {tab === "ceni" && (
        <div>
          <Head
            kicker="Цени"
            title="Колко струва и как се обосновава"
            sub="Цената се връзва за числото, което клиентът сам е изчислил — никога за часовете, които влагаме."
          />
          <Pricing />
        </div>
      )}
    </div>
  );
}
