import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { loadSetterQueue } from "@/lib/team/queue";
import { fmtSofia } from "@/lib/team/time";
import { LeadCard } from "@/components/ekip/LeadCard";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { ScriptPanel } from "@/components/ekip/ScriptPanel";

export const dynamic = "force-dynamic";

/**
 * Опашката за звънене — „Моят ден“ на човека за срещите.
 * Отгоре: за повторно (обещал е да звънне днес), после новите, най-новите
 * най-горе. Всяка карта е един разговор: набираш, говориш, натискаш изхода.
 */
export default async function EkipPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");

  const q = await loadSetterQueue();
  const todayMeetings = q.booked;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} />

      <main className="space-y-6 px-4 py-4">
        <section className="grid grid-cols-3 gap-2 text-center">
          <Stat label="нови" value={q.fresh.length} accent="cyan" />
          <Stat label="за повторно" value={q.retry.length} accent="amber" />
          <Stat label="срещи напред" value={todayMeetings.length} accent="emerald" />
        </section>

        <ScriptPanel />

        {q.retry.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-300">
              🔁 За повторно днес · {q.retry.length}
            </h2>
            {q.retry.map((l) => (
              <LeadCard key={l.id} lead={l} mode="retry" />
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-accent-cyan)]">
            🆕 Нови за първи разговор · {q.fresh.length}
          </h2>
          {q.fresh.length === 0 ? (
            <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-[var(--color-text-secondary)]">
              Няма нови. Всеки нов лийд от рекламата идва тук сам — и на имейла ти.
            </p>
          ) : (
            q.fresh.map((l) => <LeadCard key={l.id} lead={l} mode="fresh" />)
          )}
        </section>

        {q.later > 0 && (
          <p className="text-center text-xs text-[var(--color-text-tertiary)]">
            + {q.later} насрочени за следващите дни — ще излязат тук, когато денят им дойде.
          </p>
        )}

        {todayMeetings.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-300">📅 Уговорени срещи</h2>
            <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
              {todayMeetings.map((b) => (
                <li key={b.id} className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-2 text-sm">
                  <span className="font-medium">{b.attendee_name}</span>
                  <span className="text-[var(--color-text-secondary)]">{fmtSofia(b.scheduled_at)}</span>
                  {b.business && <span className="w-full text-xs text-[var(--color-text-tertiary)]">🧭 {b.business}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent: "cyan" | "amber" | "emerald" }) {
  const color =
    accent === "cyan" ? "var(--color-accent-cyan)" : accent === "amber" ? "rgb(252 211 77)" : "rgb(110 231 183)";
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-2 py-3">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}
