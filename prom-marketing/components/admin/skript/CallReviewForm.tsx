"use client";

import { useState, useTransition } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { saveCallReview, type ReviewInput } from "@/app/admin/(protected)/skript/actions";
import { SKILLS, OBJECTIONS, OUTCOMES, CHANNELS, STAGES } from "./data";

const EMPTY: ReviewInput = {
  call_date: "",
  client_name: "",
  channel: "onlain",
  reached_stage: "",
  client_words: "",
  client_number: "",
  root_cause: "",
  client_picture: "",
  objections: [],
  outcome: "sledvashta_stapka",
  deal_value: "",
  next_step: "",
  next_step_at: "",
  prep: {},
  scores: {},
  lesson: "",
  notes: "",
};

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const inputCls =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2 text-[14px] text-[var(--color-text-primary)] outline-none transition placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-cyan)]";
const labelCls =
  "mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11.5px] text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  );
}

export function CallReviewForm({ onSaved }: { onSaved?: () => void }) {
  const [v, setV] = useState<ReviewInput>({ ...EMPTY, call_date: today() });
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = <K extends keyof ReviewInput>(k: K, val: ReviewInput[K]) =>
    setV((p) => ({ ...p, [k]: val }));

  const filled = Object.values(v.scores).filter((n) => n > 0);
  const avg = filled.length ? filled.reduce((a, b) => a + b, 0) / filled.length : 0;

  function submit() {
    setErr(null);
    start(async () => {
      try {
        await saveCallReview(v);
        setDone(true);
        setV({ ...EMPTY, call_date: today() });
        onSaved?.();
        setTimeout(() => setDone(false), 4000);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Нещо се обърка");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* --- кой и кога --- */}
      <div className="cc-panel p-5">
        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
          1 · Разговорът
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Дата">
            <input
              type="date"
              className={inputCls}
              value={v.call_date}
              onChange={(e) => set("call_date", e.target.value)}
            />
          </Field>
          <Field label="С кого">
            <input
              className={inputCls}
              placeholder="Име или фирма"
              value={v.client_name}
              onChange={(e) => set("client_name", e.target.value)}
            />
          </Field>
          <Field label="Канал">
            <select
              className={inputCls}
              value={v.channel}
              onChange={(e) => set("channel", e.target.value)}
            >
              {CHANNELS.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#0a0a1f]">
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Докъде стигна" hint="Последният етап, който наистина мина">
            <select
              className={inputCls}
              value={v.reached_stage}
              onChange={(e) => set("reached_stage", e.target.value)}
            >
              <option value="" className="bg-[#0a0a1f]">
                —
              </option>
              {STAGES.map((s) => (
                <option key={s.id} value={s.num} className="bg-[#0a0a1f]">
                  {s.num} · {s.title}
                </option>
              ))}
            </select>
          </Field>
        </div>
      </div>

      {/* --- четирите изречения --- */}
      <div className="cc-panel p-5">
        <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-violet)]">
          2 · Четирите изречения
        </p>
        <p className="mb-4 text-[12.5px] text-[var(--color-text-tertiary)]">
          С неговите думи, дословно. Тези четири реда правят следващия разговор вместо теб.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label="Думите му за проблема" hint="В кавички, както ги каза">
            <textarea
              rows={2}
              className={inputCls}
              placeholder="„Отговарям на запитванията, когато остане време.“"
              value={v.client_words}
              onChange={(e) => set("client_words", e.target.value)}
            />
          </Field>
          <Field label="Числото, което сам изчисли" hint="И как го сметна">
            <textarea
              rows={2}
              className={inputCls}
              placeholder="7,5 часа месечно × 100 лв. = 750 лв."
              value={v.client_number}
              onChange={(e) => set("client_number", e.target.value)}
            />
          </Field>
          <Field label="Причината, която сам призна" hint="Етап 04. Ако е празно — не си минал етапа.">
            <textarea
              rows={2}
              className={inputCls}
              placeholder="„Реално нямаме такъв процес.“"
              value={v.root_cause}
              onChange={(e) => set("root_cause", e.target.value)}
            />
          </Field>
          <Field label="Картината му" hint="Етап 05. Осезаема, не „повече свобода“.">
            <textarea
              rows={2}
              className={inputCls}
              placeholder="„Да не отварям лаптопа в неделя.“"
              value={v.client_picture}
              onChange={(e) => set("client_picture", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* --- възражения --- */}
      <div className="cc-panel p-5">
        <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300">
          3 · Възражения, които се появиха
        </p>
        <p className="mb-4 text-[12.5px] text-[var(--color-text-tertiary)]">
          Едно и също възражение, чуто три пъти, не е възражение — а дупка в скрипта.
        </p>
        <div className="flex flex-wrap gap-2">
          {OBJECTIONS.map((o) => {
            const on = v.objections.includes(o.id);
            return (
              <button
                key={o.id}
                type="button"
                onClick={() =>
                  set(
                    "objections",
                    on ? v.objections.filter((x) => x !== o.id) : [...v.objections, o.id],
                  )
                }
                className="rounded-full border px-3 py-1.5 text-[12.5px] transition"
                style={{
                  borderColor: on ? o.tint : "rgba(120,160,220,0.25)",
                  background: on ? `${o.tint}22` : "transparent",
                  color: on ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {on && "✓ "}
                {o.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* --- изход --- */}
      <div className="cc-panel p-5">
        <p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
          4 · Как завърши
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          {OUTCOMES.map((o) => {
            const on = v.outcome === o.id;
            return (
              <button
                key={o.id}
                type="button"
                onClick={() => set("outcome", o.id)}
                className="rounded-lg border px-4 py-2 text-[13px] font-medium transition"
                style={{
                  borderColor: on ? o.tint : "rgba(120,160,220,0.25)",
                  background: on ? `${o.tint}22` : "transparent",
                  color: on ? "#fff" : "var(--color-text-secondary)",
                }}
              >
                {o.label}
              </button>
            );
          })}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Стойност (€)" hint="Ако е спечелена или е дадена оферта">
            <input
              className={inputCls}
              inputMode="decimal"
              placeholder="4900"
              value={v.deal_value}
              onChange={(e) => set("deal_value", e.target.value)}
            />
          </Field>
          <Field label="Следваща стъпка">
            <input
              className={inputCls}
              placeholder="Пращам оферта, чуваме се"
              value={v.next_step}
              onChange={(e) => set("next_step", e.target.value)}
            />
          </Field>
          <Field label="Кога" hint="Ден и час, не „ще се чуем“">
            <input
              type="date"
              className={inputCls}
              value={v.next_step_at}
              onChange={(e) => set("next_step_at", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {/* --- самооценка --- */}
      <div className="cc-panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-accent-cyan)]">
              5 · Самооценка
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--color-text-tertiary)]">
              Честно, не любезно. Слабото място се вижда само ако си го признаеш.
            </p>
          </div>
          {filled.length > 0 && (
            <span className="font-mono text-lg text-[var(--color-accent-cyan)]">
              {avg.toFixed(1)}{" "}
              <span className="text-[12px] text-[var(--color-text-tertiary)]">
                / {filled.length} от {SKILLS.length}
              </span>
            </span>
          )}
        </div>

        <div className="space-y-1">
          {SKILLS.map((s) => {
            const val = v.scores[s.id] ?? 0;
            return (
              <div
                key={s.id}
                className="grid grid-cols-1 items-center gap-2 rounded-lg px-2 py-1.5 transition hover:bg-white/[0.03] sm:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-medium text-[var(--color-text-primary)]">
                    {s.label}
                  </p>
                  <p className="text-[11.5px] text-[var(--color-text-tertiary)]">{s.hint}</p>
                </div>
                <div className="flex gap-[3px]">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                    const on = val >= n;
                    const hue = n <= 4 ? "#e11d48" : n <= 7 ? "#f59e0b" : "#22d3ee";
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${s.label}: ${n}`}
                        onClick={() =>
                          set("scores", { ...v.scores, [s.id]: val === n ? 0 : n })
                        }
                        className="size-[20px] rounded-[4px] border text-[9px] font-bold transition"
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
      </div>

      {/* --- поуката --- */}
      <div className="cc-panel p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <Field
            label="Какво тренирам следващия път"
            hint="Едно нещо. Не пет — едно."
          >
            <textarea
              rows={2}
              className={inputCls}
              placeholder="Да не давам цена, преди да съм чул числото."
              value={v.lesson}
              onChange={(e) => set("lesson", e.target.value)}
            />
          </Field>
          <Field label="Свободни бележки">
            <textarea
              rows={2}
              className={inputCls}
              placeholder="Каквото друго си струва да се помни"
              value={v.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </Field>
        </div>
      </div>

      {err && (
        <p className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-[13px] text-rose-200">
          {err}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="cc-btn cc-btn-primary flex items-center gap-2 px-5 py-2.5 text-[14px] disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Запиши разговора
        </button>
        {done && (
          <span className="flex items-center gap-1.5 text-[13.5px] text-emerald-300">
            <Check className="size-4" /> Записано. Виж го в „Напредък“.
          </span>
        )}
      </div>
    </div>
  );
}
