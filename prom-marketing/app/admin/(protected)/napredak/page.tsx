import Link from "next/link";
import { loadNapredakAll } from "@/lib/team/napredak";
import { PERIODS, dataFor, humanMinutes, parsePeriod, type PersonNapredak } from "@/lib/team/napredak-rules";
import { TEAM_ROLE_SHORT } from "@/lib/team/types";
import { NapredakBoard } from "@/components/ekip/NapredakBoard";

export const dynamic = "force-dynamic";

/**
 * „Напредък на екипа“ — всички един до друг: обаждания, говорихме, срещи,
 * явяемост, задачи, и промяната спрямо предходния период. Клик върху човек
 * отваря пълното му табло — същото, което той вижда на /ekip/napredak.
 */
export default async function AdminNapredakPage({ searchParams }: { searchParams: Promise<{ d?: string; who?: string }> }) {
  const sp = await searchParams;
  const days = parsePeriod(sp.d);
  const all = await loadNapredakAll(days);
  const who = sp.who && all.people.some((p) => p.person.key === sp.who) ? sp.who : null;
  const detail = who ? dataFor(all, who) : null;
  const detailMember = detail?.me.person.memberId ?? null;

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Напредък на екипа</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Кой колко е свършил за периода и как стои спрямо предходния. Броят се само човешки действия: бутоните в опашката,
            записаните срещи, отметнатите задачи. Всеки вижда същите числа за себе си на /ekip/napredak.
          </p>
          <div className="mt-4 flex gap-2">
            {PERIODS.map((p) => (
              <Link
                key={p}
                href={`/admin/napredak?d=${p}${who ? `&who=${who}` : ""}`}
                className="rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  borderColor: days === p ? "var(--color-accent-cyan)" : "var(--color-border-default)",
                  background: days === p ? "rgba(0,212,255,0.10)" : "transparent",
                  color: days === p ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
                }}
              >
                {p} дни
              </Link>
            ))}
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {all.people.map((p) => (
            <PersonCard key={p.person.key} p={p} days={days} active={p.person.key === who} />
          ))}
        </section>

        {detail ? (
          <section id="detail" className="space-y-3">
            <NapredakBoard
              data={detail}
              tone="admin"
              basePath="/admin/napredak"
              who={who}
              switcher={false}
              tasksHref={detailMember ? `/admin/zadachi?who=${detailMember}` : "/admin/zadachi?who=owner"}
            />
          </section>
        ) : (
          <p className="text-sm text-[var(--color-text-tertiary)]">Избери човек от картите, за да видиш пълното му табло.</p>
        )}
      </div>
    </div>
  );
}

function Num({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div>
      <p className="text-2xl font-bold" style={{ color: color ?? "var(--color-text-primary)" }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}

function delta(v: number | null): string {
  if (v === null) return "ново";
  if (v === 0) return "без промяна";
  return `${v > 0 ? "▲" : "▼"} ${Math.abs(v)}%`;
}

function PersonCard({ p, days, active }: { p: PersonNapredak; days: number; active: boolean }) {
  const v = p.cur.volume;
  const m = p.cur.meetings;
  const callsFirst = p.person.role !== "delivery" && p.person.role !== "marketing";
  return (
    <Link
      href={`/admin/napredak?d=${days}&who=${p.person.key}#detail`}
      className="cc-panel block p-5 transition-colors hover:border-[var(--color-accent-cyan)]/60"
      style={active ? { borderColor: "var(--color-accent-cyan)" } : undefined}
    >
      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">{TEAM_ROLE_SHORT[p.person.role]}</p>
      <p className="font-display text-lg font-bold">
        {p.person.kind === "owner" ? "🧭 " : "👤 "}
        {p.person.name}
      </p>
      <div className="mt-3 grid grid-cols-3 gap-3">
        {callsFirst ? (
          <>
            <Num value={String(v.calls)} label="обаждания" color="var(--color-accent-cyan)" />
            <Num value={String(v.talked)} label="говорихме" color="#22c55e" />
            <Num value={String(m.booked)} label="срещи" color="#a78bfa" />
            <Num value={m.showRate === null ? "—" : `${m.showRate}%`} label="явяемост" color={m.showRate === null ? undefined : m.showRate >= 70 ? "#22c55e" : "#facc15"} />
            <Num value={humanMinutes(p.cur.speed.medianMinutes)} label="до лийда" />
            <Num value={`${p.cur.tasksDone} / ${p.tasks.overdue}`} label="задачи ✓ / ⏰" color={p.tasks.overdue > 0 ? "#f87171" : undefined} />
          </>
        ) : (
          <>
            <Num value={String(p.cur.tasksDone)} label="готови задачи" color="#22c55e" />
            <Num value={String(p.tasks.overdue)} label="просрочени" color={p.tasks.overdue > 0 ? "#f87171" : "#22c55e"} />
            <Num value={String(p.tasks.today)} label="за днес" color="#facc15" />
            <Num value={String(v.projectUpdates)} label="обновления" color="var(--color-accent-cyan)" />
            <Num value={String(p.tasks.open)} label="отворени" />
            <Num value={String(v.calls)} label="обаждания" />
          </>
        )}
      </div>
      <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]">
        {callsFirst
          ? `обаждания ${delta(p.deltas.calls)} · срещи ${delta(p.deltas.meetings)} · задачи ${delta(p.deltas.tasksDone)}`
          : `задачи ${delta(p.deltas.tasksDone)} · обновления ${delta(p.deltas.projectUpdates)}`}{" "}
        спрямо предходните {days} дни
      </p>
      {p.insights[0] && <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{p.insights[0]}</p>}
      <p className="mt-2 text-[11px] text-[var(--color-accent-cyan)]">{active ? "показан долу" : "подробности →"}</p>
    </Link>
  );
}
