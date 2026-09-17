import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { loadSetterQueue, searchLeads } from "@/lib/team/queue";
import { fmtSofia } from "@/lib/team/time";
import type { QueueLead } from "@/lib/team/types";
import { LeadCard } from "@/components/ekip/LeadCard";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { ScriptPanel } from "@/components/ekip/ScriptPanel";

export const dynamic = "force-dynamic";

/**
 * Опашката за звънене — „Моят ден“ на човека за срещите.
 * Отгоре: търсачката (върнал е обаждане — кой е?), после за повторно (обещал е
 * да звънне днес), после „чакат обратно обаждане“ (не вдигнаха — картата стои,
 * докато той сам не я скрие), после новите, най-новите най-горе. Накрая е
 * купчината от Ивайло — стари картони, които той е дал на екипа: работи се
 * след живия списък за деня. Всяка карта е един разговор: набираш, говориш,
 * натискаш изхода.
 */
export default async function EkipPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");

  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const [queue, found] = await Promise.all([loadSetterQueue(), q ? searchLeads(q) : Promise.resolve([] as QueueLead[])]);
  const todayMeetings = queue.booked;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} />

      <main className="space-y-6 px-4 py-4">
        <section className="grid grid-cols-5 gap-2 text-center">
          <Stat label="нови" value={queue.fresh.length} accent="cyan" />
          <Stat label="от Ивайло" value={queue.given.length} accent="violet" />
          <Stat label="за повторно" value={queue.retry.length} accent="amber" />
          <Stat label="чакат обратно" value={queue.waiting.length} accent="amber" />
          <Stat label="срещи напред" value={todayMeetings.length} accent="emerald" />
        </section>

        <SearchForm q={q} />

        {q && (
          <section className="space-y-3">
            <h2 className="flex items-baseline justify-between gap-3 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-text-primary)]">
              <span>
                🔍 „{q}“ · {found.length}
              </span>
              <Link href="/ekip" className="text-xs normal-case tracking-normal text-[var(--color-text-tertiary)] underline">
                ✕ изчисти
              </Link>
            </h2>
            {found.length === 0 ? (
              <p className="rounded-2xl border border-white/10 p-4 text-center text-sm text-[var(--color-text-secondary)]">
                Няма такъв човек. Пробвай само последните 6 цифри от номера или част от името.
              </p>
            ) : (
              found.map((l) => <LeadCard key={`s-${l.id}`} lead={l} mode="search" />)
            )}
          </section>
        )}

        <ScriptPanel />

        {queue.retry.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-300">
              🔁 За повторно днес · {queue.retry.length}
            </h2>
            {queue.retry.map((l) => (
              <LeadCard key={l.id} lead={l} mode="retry" />
            ))}
          </section>
        )}

        {queue.waiting.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-amber-200/80">
              📵 Чакат обратно обаждане · {queue.waiting.length}
            </h2>
            <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">
              Не вдигнаха или чуване по-късно. Ако върнат обаждане, картата е тук — запиши срещата от нея. „Скрий“ я,
              когато вече не ти трябва; за повторно излиза сама, когато ѝ дойде часът.
            </p>
            {queue.waiting.map((l) => (
              <LeadCard key={l.id} lead={l} mode="waiting" />
            ))}
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-accent-cyan)]">
            🆕 Нови за първи разговор · {queue.fresh.length}
          </h2>
          {queue.fresh.length === 0 ? (
            <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-[var(--color-text-secondary)]">
              Няма нови. Всеки нов лийд от рекламата идва тук сам — и на имейла ти.
            </p>
          ) : (
            queue.fresh.map((l) => <LeadCard key={l.id} lead={l} mode="fresh" />)
          )}
        </section>

        {queue.given.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-violet-300">
              🤝 От Ивайло · {queue.given.length}
            </h2>
            <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">
              Хора, с които Ивайло вече е говорил веднъж — не вдигат, разбрали са се да се чуят и не са се обадили, или
              контактът е бил съвсем кратък. Влизаш с повода отдолу („преди време говорихте с Ивайло…“) и търсиш час за
              среща. Щом натиснеш изход, картата тръгва по обичайния път и излиза оттук.
            </p>
            {queue.given.map((l) => (
              <LeadCard key={`g-${l.id}`} lead={l} mode="given" />
            ))}
          </section>
        )}

        {queue.later > 0 && (
          <p className="text-center text-xs text-[var(--color-text-tertiary)]">
            + {queue.later} насрочени за следващите дни — ще излязат тук, когато денят им дойде. Дотогава ги намираш с
            търсачката.
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

/** Обикновена GET форма — работи и без JavaScript, на всеки телефон. */
function SearchForm({ q }: { q: string }) {
  return (
    <form method="get" action="/ekip" className="flex gap-2" role="search">
      <input
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Върна ли ти обаждане? Търси по телефон или име"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        aria-label="Търси по телефон или име"
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-cyan)]/60"
      />
      <button
        type="submit"
        className="rounded-xl border border-[var(--color-accent-cyan)]/50 px-4 text-sm font-semibold text-[var(--color-accent-cyan)]"
      >
        🔍
      </button>
    </form>
  );
}

const STAT_COLOR = {
  cyan: "var(--color-accent-cyan)",
  amber: "rgb(252 211 77)",
  emerald: "rgb(110 231 183)",
  violet: "rgb(196 181 253)",
} as const;

function Stat({ label, value, accent }: { label: string; value: number; accent: keyof typeof STAT_COLOR }) {
  const color = STAT_COLOR[accent];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-3">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase leading-tight tracking-[0.12em] text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}
