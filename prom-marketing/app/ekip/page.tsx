import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { loadSetterQueue, searchLeads } from "@/lib/team/queue";
import { fmtSofia } from "@/lib/team/time";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import type { QueueLead } from "@/lib/team/types";
import { loadMeetingMessages } from "@/lib/team/sreshti";
import { LeadCard } from "@/components/ekip/LeadCard";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { ScriptPanel } from "@/components/ekip/ScriptPanel";
import { MeetingMessages } from "@/components/ekip/MeetingMessages";

export const dynamic = "force-dynamic";

/**
 * Опашката за звънене — „Моят ден“ на човека за срещите.
 * Отгоре: търсачката (върнал е обаждане — кой е?), после за повторно (обещал е
 * да звънне днес), после „чакат обратно обаждане“ (не вдигнаха — картата стои,
 * докато той сам не я скрие), после новите, най-новите най-горе. Най-отгоре
 * обаче са отказаните срещи: отказът е прясна рана и се лекува същия ден.
 * Накрая е купчината от Ивайло — стари картони, които той е дал на екипа.
 *
 * Човек, който няма модула „Звънене“ (продавач, изпълнение, маркетинг), не
 * вижда чужд екран — /ekip го праща на неговия дом.
 */
export default async function EkipPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "zvanene")) redirect(homeFor(actor.member));

  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const [queue, found, nav, msgs] = await Promise.all([
    loadSetterQueue(),
    q ? searchLeads(q) : Promise.resolve([] as QueueLead[]),
    ekipNav(actor),
    loadMeetingMessages().catch(() => []),
  ]);
  const todayMeetings = queue.booked;
  const msgsDue = msgs.filter((m) => m.due).length;

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="zvanene" unread={nav.unread} />

      <main className="space-y-6 px-4 py-4">
        <section className="grid grid-cols-4 gap-2 text-center sm:grid-cols-8">
          <Stat label="нови" value={queue.fresh.length} accent="cyan" />
          <Stat label="отказали" value={queue.cancelled.length} accent="rose" />
          <Stat label="не се явиха" value={queue.noshow.length} accent="rose" />
          <Stat label="от Ивайло" value={queue.given.length} accent="violet" />
          <Stat label="за повторно" value={queue.retry.length} accent="amber" />
          <Stat label="чакат обратно" value={queue.waiting.length} accent="amber" />
          <Stat label="срещи" value={todayMeetings.length} accent="emerald" />
          <Stat label="съобщения" value={msgsDue} accent="fuchsia" />
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

        {queue.cancelled.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-rose-300">
              ❌ Отказаха срещата · {queue.cancelled.length}
            </h2>
            <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">
              Отмениха си часа. Звънни им ДНЕС и го премести — отказът най-често е за часа, не за разговора. Новият час
              се записва от същата карта с „Записах среща“.
            </p>
            {queue.cancelled.map((l) => (
              <LeadCard key={`c-${l.id}`} lead={l} mode="cancelled" />
            ))}
          </section>
        )}

        {queue.noshow.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-rose-300">
              🙈 Не се явиха на срещата · {queue.noshow.length}
            </h2>
            <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">
              Имаха час с Ивайло и не влязоха. Звънни, разбери какво е станало и запиши нов час от същата карта. Ако не
              вдига — прати готовото съобщение по Viber и натисни „Не вдигна“.
            </p>
            {queue.noshow.map((l) => (
              <LeadCard key={`n-${l.id}`} lead={l} mode="noshow" setterName={actor.name} />
            ))}
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

        <MeetingMessages rows={msgs} setterName={actor.name} />

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
  rose: "rgb(253 164 175)",
  fuchsia: "rgb(240 171 252)",
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
