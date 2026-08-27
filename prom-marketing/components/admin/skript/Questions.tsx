"use client";
// Учене на въпросите: карти с припомняне, режим „на глас" и чист списък.
// Кое знаеш и кое не се пази в браузъра.

import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Check,
  X,
  RotateCcw,
  Layers,
  Mic,
  List,
  ChevronLeft,
  ChevronRight,
  Trophy,
} from "lucide-react";
import { STAGES } from "./data";

/** Какво се е случило точно преди този въпрос — куката за припомняне. */
const CUE: Record<string, string> = {
  "00": "Още не си вдигнал телефона. Какво проверяваш?",
  "01": "Току-що се чухте. Първите трийсет секунди.",
  "02": "Прие рамката и каза защо е тук. Сега?",
  "03": "Каза какво не работи. Време е за числото.",
  "04": "Числото е казано. Сега — чия е вината?",
  "05": "Призна, че причината е при него. Накъде?",
  "06": "Описа мечтата си. Сега му я отнемаш.",
  "07": "Каза „решен съм“. Какво следва?",
  "08": "Покани те да представиш решението.",
  "09": "Кимна на трите изречения. Затваряш.",
};

type Card = { id: string; stageNum: string; stageTitle: string; idx: number; total: number; text: string };

/** Чисти водещите номера, стрелки и репликата на клиента в скоби. */
function clean(t: string) {
  return t
    .replace(/^\d+\s·\s/, "")
    .replace(/^→\s/, "")
    .replace(/^\(той:[^)]*\)\s*→\s*/, "")
    .trim();
}

/** Режисьорска бележка, не реплика — не влиза в картите. */
function isDirection(t: string) {
  return /^И МЪЛЧИШ/i.test(t.trim());
}

// Етап 00 е подготовка, не реплики — той се учи в „Преди срещата".
const DECK: Card[] = STAGES.filter((s) => s.num !== "00").flatMap((s) => {
  const lines = s.you.filter((t) => !isDirection(t));
  return lines.map((t, i) => ({
    id: `${s.num}-${i}`,
    stageNum: s.num,
    stageTitle: s.title,
    idx: i + 1,
    total: lines.length,
    text: clean(t),
  }));
});

const LS = "pm-skript-questions-v1";

export function Questions() {
  const [mode, setMode] = useState<"karti" | "naglas" | "spisak">("karti");
  const [known, setKnown] = useState<Record<string, boolean>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS);
      if (raw) setKnown(JSON.parse(raw));
    } catch {
      /* няма страшно */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(LS, JSON.stringify(known));
    } catch {
      /* без запис пак работи */
    }
  }, [known, loaded]);

  const knownCount = DECK.filter((c) => known[c.id]).length;
  const pct = Math.round((knownCount / DECK.length) * 100);

  return (
    <div className="space-y-5">
      {/* лента с напредъка */}
      <div className="cc-panel p-4">
        <div className="mb-2.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {(
              [
                { id: "karti", label: "Карти", icon: Layers },
                { id: "naglas", label: "На глас", icon: Mic },
                { id: "spisak", label: "Списък", icon: List },
              ] as const
            ).map((m) => {
              const on = mode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12.5px] font-medium transition"
                  style={{
                    borderColor: on ? "var(--color-accent-cyan)" : "rgba(120,160,220,0.2)",
                    background: on ? "rgba(6,182,212,0.13)" : "transparent",
                    color: on ? "#fff" : "var(--color-text-secondary)",
                  }}
                >
                  <Icon className="size-3.5" />
                  {m.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-[13px] text-[var(--color-accent-cyan)]">
              знаеш {knownCount} от {DECK.length} · {pct}%
            </span>
            <button
              onClick={() => setKnown({})}
              className="flex items-center gap-1.5 rounded-md border border-white/15 px-2.5 py-1 text-[12px] text-[var(--color-text-secondary)] transition hover:border-rose-400/50 hover:text-rose-300"
            >
              <RotateCcw className="size-3.5" /> Нулирай
            </button>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct >= 80 ? "#22c55e" : pct >= 40 ? "#22d3ee" : "#f59e0b",
            }}
          />
        </div>
      </div>

      {mode === "karti" && <Cards known={known} setKnown={setKnown} />}
      {mode === "naglas" && <Aloud />}
      {mode === "spisak" && <SpisakView known={known} setKnown={setKnown} />}
    </div>
  );
}

/* ================= КАРТИ ================= */

function Cards({
  known,
  setKnown,
}: {
  known: Record<string, boolean>;
  setKnown: (fn: (p: Record<string, boolean>) => Record<string, boolean>) => void;
}) {
  // рундът съдържа само още ненаучените
  const queue = useMemo(() => DECK.filter((c) => !known[c.id]), [known]);
  const [pos, setPos] = useState(0);
  const [shown, setShown] = useState(false);

  const card = queue[Math.min(pos, Math.max(0, queue.length - 1))];

  if (queue.length === 0) {
    return (
      <div className="cc-panel p-10 text-center">
        <Trophy className="mx-auto mb-3 size-9 text-emerald-400" />
        <p className="text-lg font-bold text-[var(--color-text-primary)]">Знаеш ги всичките.</p>
        <p className="mt-1 text-[13.5px] text-[var(--color-text-secondary)]">
          Сега ги тренирай на глас — четенето и изричането са две различни умения.
        </p>
      </div>
    );
  }

  function answer(ok: boolean) {
    if (ok) setKnown((p) => ({ ...p, [card.id]: true }));
    setShown(false);
    setPos((p) => (ok ? p : p + 1) % Math.max(1, ok ? queue.length - 1 || 1 : queue.length));
  }

  return (
    <div className="cc-panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-5 py-3">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[var(--color-accent-cyan)]">
          ЕТАП {card.stageNum} · {card.stageTitle.toUpperCase()}
        </span>
        <span className="font-mono text-[11.5px] text-[var(--color-text-tertiary)]">
          въпрос {card.idx} от {card.total} · остават {queue.length}
        </span>
      </div>

      <div className="px-6 py-8">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-tertiary)]">
          Ситуацията
        </p>
        <p className="mb-8 text-[15.5px] italic leading-relaxed text-[var(--color-text-secondary)]">
          {CUE[card.stageNum]}
        </p>

        {!shown ? (
          <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center">
            <p className="mb-5 text-[15px] text-[var(--color-text-secondary)]">
              Кажи въпроса на глас — после провери.
            </p>
            <button
              onClick={() => setShown(true)}
              className="cc-btn cc-btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-[14px]"
            >
              <Eye className="size-4" /> Покажи
            </button>
          </div>
        ) : (
          <div>
            <div className="rounded-xl border border-[var(--color-accent-cyan)] bg-cyan-500/[0.08] px-6 py-6">
              <p className="text-[19px] leading-relaxed text-[var(--color-text-primary)]">
                {card.text}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => answer(true)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-emerald-400/50 bg-emerald-500/10 px-5 py-3 text-[14px] font-medium text-emerald-300 transition hover:bg-emerald-500/20"
              >
                <Check className="size-4" /> Знаех го
              </button>
              <button
                onClick={() => answer(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/10 px-5 py-3 text-[14px] font-medium text-amber-300 transition hover:bg-amber-500/20"
              >
                <X className="size-4" /> Още не — върни го
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= НА ГЛАС ================= */

function Aloud() {
  const [i, setI] = useState(0);
  const card = DECK[i];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === " ") setI((p) => Math.min(DECK.length - 1, p + 1));
      if (e.key === "ArrowLeft") setI((p) => Math.max(0, p - 1));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="cc-panel overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-3">
        <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[var(--color-accent-cyan)]">
          ЕТАП {card.stageNum} · {card.stageTitle.toUpperCase()}
        </span>
        <span className="font-mono text-[11.5px] text-[var(--color-text-tertiary)]">
          {i + 1} / {DECK.length}
        </span>
      </div>

      <div className="grid min-h-[260px] place-items-center px-6 py-10">
        <p className="max-w-3xl text-center text-[26px] font-medium leading-snug text-[var(--color-text-primary)]">
          {card.text}
        </p>
      </div>

      <div className="flex items-center justify-between border-t border-white/8 px-5 py-3">
        <button
          onClick={() => setI((p) => Math.max(0, p - 1))}
          disabled={i === 0}
          className="cc-btn flex items-center gap-1.5 px-4 py-2 text-[13px] disabled:opacity-30"
        >
          <ChevronLeft className="size-4" /> Назад
        </button>
        <span className="text-[12px] text-[var(--color-text-tertiary)]">
          интервал или → за следващия
        </span>
        <button
          onClick={() => setI((p) => Math.min(DECK.length - 1, p + 1))}
          disabled={i === DECK.length - 1}
          className="cc-btn cc-btn-primary flex items-center gap-1.5 px-4 py-2 text-[13px] disabled:opacity-30"
        >
          Напред <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ================= СПИСЪК ================= */

function SpisakView({
  known,
  setKnown,
}: {
  known: Record<string, boolean>;
  setKnown: (fn: (p: Record<string, boolean>) => Record<string, boolean>) => void;
}) {
  return (
    <div className="space-y-4">
      {STAGES.map((s) => {
        const cards = DECK.filter((c) => c.stageNum === s.num);
        const done = cards.filter((c) => known[c.id]).length;
        return (
          <div key={s.id} className="cc-panel p-5">
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-[15px] font-bold text-[var(--color-text-primary)]">
                <span className="font-mono text-[var(--color-accent-cyan)]">{s.num}</span> ·{" "}
                {s.title}
              </h3>
              <span className="font-mono text-[11.5px] text-[var(--color-text-tertiary)]">
                {done}/{cards.length}
              </span>
            </div>
            <ul className="space-y-1.5">
              {cards.map((c) => {
                const on = !!known[c.id];
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setKnown((p) => ({ ...p, [c.id]: !p[c.id] }))}
                      className="flex w-full gap-3 rounded-lg p-2 text-left transition hover:bg-white/[0.03]"
                    >
                      <span
                        className="mt-0.5 grid size-[18px] shrink-0 place-items-center rounded-[5px] border text-[10px] font-bold"
                        style={{
                          borderColor: on ? "#22c55e" : "rgba(120,160,220,0.3)",
                          background: on ? "#22c55e" : "transparent",
                          color: "#04040c",
                        }}
                      >
                        {on ? "✓" : ""}
                      </span>
                      <span
                        className="text-[14px] leading-relaxed"
                        style={{
                          color: on
                            ? "var(--color-text-tertiary)"
                            : "var(--color-text-primary)",
                        }}
                      >
                        {c.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
