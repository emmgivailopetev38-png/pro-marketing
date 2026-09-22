import Link from "next/link";
import { loadNapredak } from "@/lib/team/napredak";
import type { TeamActor } from "@/lib/team/session";
import { DUE_TONE_COLOR } from "@/lib/team/tasks-rules";

/**
 * „Моят напредък“ на всяко работно табло (звънене, проекти, продажби): шест
 * числа за последните 7 дни с промяната спрямо предходната седмица и първият
 * извод. Пълното табло е на /ekip/napredak. Ако числата не се заредят,
 * лентата просто не се показва — таблото не бива да пада заради нея.
 */
export async function NapredakStrip({ actor, days = 7 }: { actor: TeamActor; days?: number }) {
  let data;
  try {
    data = await loadNapredak({
      days,
      actorName: actor.name,
      actorKind: actor.kind,
      memberId: actor.member?.id ?? null,
      memberRole: actor.member?.role ?? null,
    });
  } catch {
    return null;
  }
  const me = data.me;
  const c = me.cur;
  const role = actor.member?.role ?? "owner";
  const caller = role === "owner" || role === "setter" || role === "sales" || c.volume.calls > 0;

  const items: Array<{ label: string; value: number; delta: number | null; color?: string }> = [
    ...(caller
      ? [
          { label: "обаждания", value: c.volume.calls, delta: me.deltas.calls },
          { label: "говорихме", value: c.volume.talked, delta: me.deltas.talked },
          { label: "срещи", value: c.meetings.booked, delta: me.deltas.meetings },
        ]
      : []),
    { label: "готови задачи", value: c.tasksDone, delta: me.deltas.tasksDone },
    { label: "отворени", value: me.tasks.open, delta: null },
    { label: "закъснели", value: me.tasks.overdue, delta: null, color: me.tasks.overdue > 0 ? DUE_TONE_COLOR.red : DUE_TONE_COLOR.green },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">📈 Моят напредък · последните {days} дни</p>
        <Link href="/ekip/napredak" className="text-[11px] text-[var(--color-accent-cyan)] underline-offset-2 hover:underline">
          цялото табло →
        </Link>
      </div>
      <div className={`mt-2 grid gap-2 text-center ${items.length > 4 ? "grid-cols-3 sm:grid-cols-6" : "grid-cols-3"}`}>
        {items.map((it) => (
          <div key={it.label} className="rounded-xl border border-white/10 px-1 py-2">
            <p className="text-xl font-bold" style={{ color: it.color ?? "var(--color-text-primary)" }}>
              {it.value}
            </p>
            <p className="text-[10px] uppercase leading-tight tracking-[0.1em] text-[var(--color-text-tertiary)]">{it.label}</p>
            {it.delta !== null && <p className="text-[10px]" style={{ color: it.delta > 0 ? "#22c55e" : it.delta < 0 ? "#ef4444" : "var(--color-text-tertiary)" }}>{it.delta > 0 ? `▲ ${it.delta}%` : it.delta < 0 ? `▼ ${Math.abs(it.delta)}%` : "="}</p>}
          </div>
        ))}
      </div>
      {me.insights[0] && <p className="mt-2 text-xs text-[var(--color-text-secondary)]">💡 {me.insights[0]}</p>}
    </section>
  );
}
