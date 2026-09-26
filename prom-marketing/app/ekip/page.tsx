import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { getMemberById } from "@/lib/team/repository";
import { loadSetterQueue, searchLeads } from "@/lib/team/queue";
import { fmtSofia } from "@/lib/team/time";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import type { QueueLead } from "@/lib/team/types";
import { loadMeetingMessages } from "@/lib/team/sreshti";
import { parseZvaneneView, urgentBanner, zvaneneHref, zvaneneTabs } from "@/lib/team/zvanene-vidove";
import { LeadCard } from "@/components/ekip/LeadCard";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { ZvaneneTabs } from "@/components/ekip/ZvaneneTabs";
import { ScriptPanel } from "@/components/ekip/ScriptPanel";
import { MeetingMessages } from "@/components/ekip/MeetingMessages";
import { NapredakStrip } from "@/components/ekip/NapredakStrip";

export const dynamic = "force-dynamic";

/**
 * Опашката за звънене — „Моят ден“ на човека за срещите, разделена на четири
 * подкатегории (заявка на Димитър, 23.09.2026: един списък с всичко беше
 * пренаселен на телефон):
 *
 *   🆕 Първо обаждане — новите, най-новите най-горе
 *   🔁 За повторно    — отказали срещата, неявили се, обещано чуване за днес,
 *                       не вдигнали (картата стои, докато той сам не я скрие)
 *   🤝 От Ивайло      — стари картони, които Ивайло е дал на екипа
 *   💜 Срещите        — съобщенията по Viber и уговорените часове
 *
 * Търсачката (върнал е обаждане — кой е?) стои на всеки изглед. Отказаната и
 * пропуснатата среща са прясна рана: лекуват се същия ден, затова червената
 * лента с линк към тях излиза на всеки изглед.
 *
 * Човек, който няма модула „Звънене“ (продавач, изпълнение, маркетинг), не
 * вижда чужд екран — /ekip го праща на неговия дом.
 */
export default async function EkipPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; vid?: string | string[]; as?: string | string[] }>;
}) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "zvanene")) redirect(homeFor(actor.member));

  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q ?? "").trim();
  const view = parseZvaneneView(sp.vid);
  // Всеки вижда своите лийдове (ротацията 50/50). Собственикът вижда всички, а с
  // ?as=<id> — точно опашката на човека, за да провери какво вижда той.
  const asId = actor.kind === "owner" ? ((Array.isArray(sp.as) ? sp.as[0] : sp.as) ?? "").trim() : "";
  const preview = asId ? await getMemberById(asId).catch(() => null) : null;
  const viewerId = actor.kind === "member" ? actor.member.id : (preview?.id ?? null);
  const callerName = actor.kind === "member" ? actor.name : (preview?.full_name ?? actor.name);
  const [queue, found, nav, msgs] = await Promise.all([
    loadSetterQueue(new Date(), viewerId),
    q ? searchLeads(q) : Promise.resolve([] as QueueLead[]),
    ekipNav(actor),
    loadMeetingMessages().catch(() => []),
  ]);
  const todayMeetings = queue.booked;
  const msgsDue = msgs.filter((m) => m.due).length;
  const counts = {
    fresh: queue.fresh.length,
    cancelled: queue.cancelled.length,
    noshow: queue.noshow.length,
    retry: queue.retry.length,
    waiting: queue.waiting.length,
    given: queue.given.length,
    msgsDue,
    booked: todayMeetings.length,
  };
  const tabs = zvaneneTabs(counts);
  const urgent = urgentBanner(view, counts);

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="zvanene" unread={nav.unread} />

      <main className="space-y-6 px-4 py-4">
        {preview && (
          <p className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-[var(--color-text-secondary)]">
            👀 Преглед: това е опашката на <b className="text-[var(--color-text-primary)]">{preview.full_name}</b> — само нейните/неговите
            лийдове от ротацията. <Link href="/ekip" className="underline">Обратно към целия екип</Link>
          </p>
        )}
        <ZvaneneTabs tabs={tabs} active={view} />

        {urgent && (
          <Link
            href={zvaneneHref("povtorno")}
            className="flex items-center justify-between gap-3 rounded-2xl border border-rose-400/40 bg-rose-400/10 px-4 py-3 text-sm font-semibold text-rose-200"
          >
            <span>🔥 {urgent}</span>
            <span className="shrink-0 text-xs font-normal text-rose-200/70">виж ги →</span>
          </Link>
        )}

        <SearchForm q={q} view={view} />

        {q && (
          <section className="space-y-3">
            <h2 className="flex items-baseline justify-between gap-3 text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-text-primary)]">
              <span>
                🔍 „{q}“ · {found.length}
              </span>
              <Link href={zvaneneHref(view)} className="text-xs normal-case tracking-normal text-[var(--color-text-tertiary)] underline">
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

        {view === "novi" && (
          <>
            <NapredakStrip actor={actor} />
            <ScriptPanel name={callerName} />
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
          </>
        )}

        {view === "povtorno" && (
          <>
            {queue.cancelled.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-rose-300">
                  ❌ Отказаха срещата · {queue.cancelled.length}
                </h2>
                <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">
                  Отмениха си часа. Звънни им ДНЕС и го премести — отказът най-често е за часа, не за разговора. Новият
                  час се записва от същата карта с „Записах среща“.
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
                  Имаха час с Ивайло и не влязоха. Звънни, разбери какво е станало и запиши нов час от същата карта. Ако
                  не вдига — прати готовото съобщение по Viber и натисни „Не вдигна“.
                </p>
                {queue.noshow.map((l) => (
                  <LeadCard key={`n-${l.id}`} lead={l} mode="noshow" setterName={callerName} />
                ))}
              </section>
            )}

            <ScriptPanel name={callerName} />

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

            {counts.cancelled + counts.noshow + counts.retry + counts.waiting === 0 && (
              <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-[var(--color-text-secondary)]">
                Нищо за повторно днес. Картите излизат тук сами, когато им дойде часът.
              </p>
            )}

            {queue.later > 0 && (
              <p className="text-center text-xs text-[var(--color-text-tertiary)]">
                + {queue.later} насрочени за следващите дни — ще излязат тук, когато денят им дойде. Дотогава ги намираш
                с търсачката.
              </p>
            )}
          </>
        )}

        {view === "ivailo" && (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-violet-300">
              🤝 От Ивайло · {queue.given.length}
            </h2>
            {queue.given.length === 0 ? (
              <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-[var(--color-text-secondary)]">
                Няма картони от Ивайло в момента. Като ти даде, излизат тук.
              </p>
            ) : (
              <>
                <p className="-mt-1 text-xs text-[var(--color-text-tertiary)]">
                  Хора, с които Ивайло вече е говорил веднъж — не вдигат, разбрали са се да се чуят и не са се обадили,
                  или контактът е бил съвсем кратък. Влизаш с повода отдолу („преди време говорихте с Ивайло…“) и търсиш
                  час за среща. Щом натиснеш изход, картата тръгва по обичайния път и излиза оттук.
                </p>
                {queue.given.map((l) => (
                  <LeadCard key={`g-${l.id}`} lead={l} mode="given" />
                ))}
              </>
            )}
          </section>
        )}

        {view === "sreshti" && (
          <>
            {msgs.length === 0 ? (
              <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-[var(--color-text-secondary)]">
                Няма предстоящи срещи с телефон за следващите дни.
              </p>
            ) : (
              <MeetingMessages rows={msgs} setterName={callerName} />
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
          </>
        )}
      </main>
    </div>
  );
}

/** Обикновена GET форма — работи и без JavaScript, на всеки телефон. */
function SearchForm({ q, view }: { q: string; view: string }) {
  return (
    <form method="get" action="/ekip" className="flex gap-2" role="search">
      <input type="hidden" name="vid" value={view} />
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
