"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveGrafikAction } from "@/app/ekip/kalendar/actions";
import {
  HOURS,
  PRESETS,
  WEEK_DAYS,
  WEEK_DAY_SHORT,
  applyPreset,
  emptyGrafik,
  hasAnyHour,
  hoursFor,
  isDayOverride,
  nextDays,
  resetDay,
  toggleDayHour,
  toggleWeekHour,
  toggleWeekRow,
  withDayHours,
  type Grafik,
} from "@/lib/team/grafik-rules";
import { isoToSofiaLocal } from "@/lib/team/time";

export interface GrafikMeeting {
  at: string;
  minutes: number;
  name: string;
}

type Tab = "kal" | "sedmica";
type Status = { kind: "idle" | "saving" | "saved" } | { kind: "error"; text: string };

const dayHead = (day: string) => {
  const d = new Date(`${day}T12:00:00Z`);
  return {
    wd: d.toLocaleDateString("bg-BG", { weekday: "short", timeZone: "UTC" }),
    date: `${day.slice(8, 10)}.${day.slice(5, 7)}`,
  };
};

/**
 * „🗓 Моят график“ — решетка за цъкане (25.11.2026, Теодор: „не виждам как мога
 * да си менижирам графикът“). Зелено = на линия за срещи. Цъкаш клетка (или
 * влачиш с мишката) — записва се само. „Моят календар“ е за конкретните дни
 * (със срещите вътре), „Обичайната седмица“ — повтаря се всяка седмица.
 */
export function GrafikGrid({
  memberId,
  name,
  initial,
  meetings,
  nowIso,
  editable,
  self,
  role = "sales",
}: {
  role?: "sales" | "setter";
  memberId: string;
  name: string;
  initial: Grafik | null;
  meetings: GrafikMeeting[];
  nowIso: string;
  editable: boolean;
  self: boolean;
}) {
  const [g, setG] = useState<Grafik | null>(initial);
  const gRef = useRef<Grafik | null>(initial);
  const [tab, setTab] = useState<Tab>(initial && Object.keys(initial.week).length ? "kal" : "sedmica");
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Влаченето с мишката: какво състояние „рисува“ (null = не се влачи).
  const [paint, setPaint] = useState<boolean | null>(null);

  const nowLocal = isoToSofiaLocal(nowIso);
  const today = nowLocal.slice(0, 10);
  const nowHour = Number(nowLocal.slice(11, 13));
  const days = useMemo(() => nextDays(new Date(nowIso), 14), [nowIso]);
  const shown = days.slice(page * 7, page * 7 + 7);

  // Срещите по клетки: „2026-11-26|18“ → името.
  const meetingAt = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of meetings) {
      const local = isoToSofiaLocal(m.at);
      const day = local.slice(0, 10);
      const m0 = Number(local.slice(11, 13)) * 60 + Number(local.slice(14, 16));
      const m1 = m0 + Math.max(1, m.minutes);
      for (let h = Math.floor(m0 / 60); h <= Math.floor((m1 - 1) / 60); h++) map.set(`${day}|${h}`, m.name.split(/\s+/)[0] || "среща");
    }
    return map;
  }, [meetings]);

  useEffect(() => {
    const up = () => setPaint(null);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function save(next: Grafik | null) {
    setStatus({ kind: "saving" });
    const r = await saveGrafikAction({ memberId, grafik: next }).catch(() => ({ ok: false as const, error: "Няма връзка — опитай пак." }));
    setStatus(r.ok ? { kind: "saved" } : { kind: "error", text: "error" in r && r.error ? r.error : "Не се записа." });
  }

  function change(fn: (cur: Grafik) => Grafik) {
    if (!editable) return;
    const next = fn(gRef.current ?? emptyGrafik());
    gRef.current = next;
    setG(next);
    setStatus({ kind: "saving" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(next), 500);
  }

  function removeAll() {
    if (!editable) return;
    if (timer.current) clearTimeout(timer.current);
    gRef.current = null;
    setG(null);
    setTab("sedmica");
    void save(null);
  }

  const base = "h-8 w-full rounded-[5px] border text-[10px] leading-none transition-colors select-none touch-manipulation";
  const onCls = "border-emerald-400/60 bg-emerald-500/60 text-emerald-50";
  const offCls = "border-white/10 bg-white/[0.04] hover:bg-white/[0.09]";
  const who = self ? "ти" : name;
  const tabCls = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`;
  const cols = { gridTemplateColumns: "2.9rem repeat(7, minmax(0, 1fr))" };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav className="flex flex-wrap gap-1.5" aria-label="Изглед на графика">
          <button type="button" className={tabCls(tab === "kal")} onClick={() => setTab("kal")}>
            📅 {self ? "Моят календар" : "Календарът"} · 2 седмици
          </button>
          <button type="button" className={tabCls(tab === "sedmica")} onClick={() => setTab("sedmica")}>
            🔁 Обичайната седмица
          </button>
        </nav>
        <span className="text-[11px]" aria-live="polite">
          {status.kind === "saving" && <span className="text-[var(--color-text-tertiary)]">Записва се…</span>}
          {status.kind === "saved" && <span className="text-emerald-300">✓ Записано</span>}
          {status.kind === "error" && <span className="text-rose-300">⚠️ {status.text}</span>}
        </span>
      </div>

      {!g ? (
        <p className="mt-2 rounded-xl border border-amber-400/30 bg-amber-400/10 p-2.5 text-xs text-amber-100">
          {self ? "Още нямаш график" : `${name} още няма график`} —{" "}
          {role === "sales" ? "сега сетърът може да запише среща по всяко време от 10:00." : "екипът не знае кога си на линия."}{" "}
          {editable ? "Избери готова седмица или цъкни часовете отдолу — записва се само." : ""}
        </p>
      ) : !hasAnyHour(g) ? (
        <p className="mt-2 rounded-xl border border-rose-400/30 bg-rose-400/10 p-2.5 text-xs text-rose-100">
          ⚠️ Няма нито един час на линия —{" "}
          {role === "sales" ? `сетърът не може да запише среща на ${who}.` : "екипът ще те вижда като „не е на линия“."} Цъкни поне няколко часа.
        </p>
      ) : (
        <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
          {role === "sales" ? (
            <>
              <b className="text-emerald-300">Зелено</b> = на линия за срещи. Сетърът записва срещи само в зелените часове и вижда свободните под „Записах среща“.{" "}
            </>
          ) : (
            <>
              <b className="text-emerald-300">Зелено</b> = на линия (звъниш). Целият екип вижда кога си на линия в „Кой кога е на линия“.{" "}
            </>
          )}
          {editable ? "Цъкни клетка, за да я смениш (с мишката може и да влачиш)." : ""}
        </p>
      )}

      {tab === "sedmica" ? (
        <div className="mt-3">
          {editable && (
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-[var(--color-text-tertiary)]">Бързо:</span>
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => change((cur) => applyPreset(cur, p.id))}
                  className="rounded-md border border-emerald-400/40 px-2 py-1 text-[11px] font-semibold text-emerald-200"
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => change((cur) => applyPreset(cur, ""))}
                className="rounded-md border border-white/15 px-2 py-1 text-[11px] text-[var(--color-text-secondary)]"
              >
                Изчисти седмицата
              </button>
            </div>
          )}
          <div className="grid gap-1" style={cols} role="grid" aria-label="Обичайната седмица">
            <div />
            {WEEK_DAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-semibold text-[var(--color-text-secondary)]">
                {WEEK_DAY_SHORT[d]}
              </div>
            ))}
            {HOURS.map((h) => (
              <Row key={h}>
                <button
                  type="button"
                  disabled={!editable}
                  onClick={() => change((cur) => toggleWeekRow(cur, h))}
                  title={editable ? `${h}:00 — за всички дни` : undefined}
                  className="pr-1 text-right text-[11px] tabular-nums text-[var(--color-text-tertiary)] enabled:hover:text-[var(--color-text-primary)]"
                >
                  {h}:00
                </button>
                {WEEK_DAYS.map((d) => {
                  const on = (g?.week[d] ?? []).includes(h);
                  return (
                    <Cell
                      key={d}
                      on={on}
                      disabled={!editable}
                      label={`${WEEK_DAY_SHORT[d]} ${h}:00 — ${on ? "на линия" : "не е на линия"}`}
                      className={`${base} ${on ? onCls : offCls}`}
                      paint={paint}
                      onPaint={setPaint}
                      onSet={(v) => change((cur) => toggleWeekHour(cur, d, h, v))}
                    />
                  );
                })}
              </Row>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            Повтаря се всяка седмица. Отпуска или зает ден — в „📅 {self ? "Моят календар" : "Календарът"}“: там се сменя само конкретният ден. Цъкни часа вляво — сменя
            целия ред.
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage(0)}
              className="rounded-md border border-white/15 px-2 py-1 text-[11px] disabled:opacity-30"
            >
              ← Тази седмица
            </button>
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              {dayHead(shown[0]).date} – {dayHead(shown[shown.length - 1]).date}
            </span>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(1)}
              className="rounded-md border border-white/15 px-2 py-1 text-[11px] disabled:opacity-30"
            >
              Следващата →
            </button>
          </div>
          <div className="grid gap-1" style={cols} role="grid" aria-label="Конкретните дни">
            <div />
            {shown.map((day) => {
              const head = dayHead(day);
              const own = g ? isDayOverride(g, day) : false;
              const any = g ? hoursFor(g, day).length > 0 : false;
              return (
                <div key={day} className="text-center leading-tight">
                  <div className={`text-[11px] font-semibold ${own ? "text-amber-200" : "text-[var(--color-text-secondary)]"}`}>
                    {head.wd}
                    {own ? " •" : ""}
                  </div>
                  <div className="text-[10px] tabular-nums text-[var(--color-text-tertiary)]">{head.date}</div>
                  {editable && g && (any || own) && (
                    <button
                      type="button"
                      onClick={() => change((cur) => (any ? withDayHours(cur, day, []) : resetDay(cur, day)))}
                      title={any ? "Не съм на линия този ден" : "Като обичайната седмица"}
                      className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                    >
                      {any ? "🚫" : "↺"}
                    </button>
                  )}
                </div>
              );
            })}
            {HOURS.map((h) => (
              <Row key={h}>
                <div className="pr-1 text-right text-[11px] tabular-nums leading-8 text-[var(--color-text-tertiary)]">{h}:00</div>
                {shown.map((day) => {
                  const on = g ? hoursFor(g, day).includes(h) : false;
                  const meet = meetingAt.get(`${day}|${h}`);
                  const past = day < today || (day === today && h < nowHour);
                  if (meet) {
                    return (
                      <div
                        key={day}
                        title={`Среща: ${meet}. Тя си остава — ако не можеш, кажи на сетъра да я премести.`}
                        className="flex h-8 items-center justify-center overflow-hidden rounded-[5px] border border-violet-400/60 bg-violet-500/50 px-0.5 text-[10px] font-semibold text-violet-50"
                      >
                        <span className="truncate">📅 {meet}</span>
                      </div>
                    );
                  }
                  return (
                    <Cell
                      key={day}
                      on={on}
                      disabled={past || !editable}
                      label={`${dayHead(day).wd} ${dayHead(day).date} ${h}:00 — ${on ? "на линия" : "не е на линия"}`}
                      className={`${base} ${on ? onCls : offCls} ${past ? "opacity-30" : ""}`}
                      paint={paint}
                      onPaint={setPaint}
                      onSet={(v) => change((cur) => toggleDayHour(cur, day, h, v))}
                    />
                  );
                })}
              </Row>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--color-text-tertiary)]">
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500/70 align-middle" />
              на линия
            </span>
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm border border-white/20 bg-white/[0.04] align-middle" />
              не е на линия
            </span>
            <span>
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-violet-500/70 align-middle" />
              среща
            </span>
            <span>• = денят е сменен отделно (↺ го връща като обичайната седмица)</span>
          </div>
        </div>
      )}

      {editable && g && (
        <button type="button" onClick={removeAll} className="mt-3 text-[11px] text-[var(--color-text-tertiary)] underline">
          {role === "sales" ? `Махни графика (могат да ${self ? "те" : "го"} записват по всяко време от 10:00)` : "Махни графика"}
        </button>
      )}
    </div>
  );
}

/** Един ред от решетката: часът + 7 клетки (display: contents пази колоните на мрежата). */
function Row({ children }: { children: React.ReactNode }) {
  return (
    <div role="row" className="contents">
      {children}
    </div>
  );
}

/** Една клетка: цъкване (и влачене с мишката) — влаченето „рисува“ едно и също състояние. */
function Cell({
  on,
  disabled,
  label,
  className,
  paint,
  onPaint,
  onSet,
}: {
  on: boolean;
  disabled: boolean;
  label: string;
  className: string;
  paint: boolean | null;
  onPaint: (v: boolean | null) => void;
  onSet: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      disabled={disabled}
      className={className}
      onPointerDown={(e) => {
        if (disabled) return;
        e.preventDefault();
        onSet(!on);
        onPaint(e.pointerType === "mouse" ? !on : null);
      }}
      onPointerEnter={() => {
        if (paint !== null && !disabled && on !== paint) onSet(paint);
      }}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          onSet(!on);
        }
      }}
    />
  );
}
