import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { feedUrlFor, loadCalendar } from "@/lib/team/kalendar";
import { busyByCloser, defaultScope, groupByDay, isLive, visibleMeetings, type CalMeeting, type CalScope, type CalViewer } from "@/lib/team/kalendar-rules";
import { googleCalendarTemplateUrl } from "@/lib/cal/ics";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { CopyLink, MeetUrlForm } from "@/components/ekip/KalendarTools";

export const dynamic = "force-dynamic";

const TZ = "Europe/Sofia";
const hhmm = (iso: string) => new Date(iso).toLocaleTimeString("bg-BG", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
const dayLabel = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString("bg-BG", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
const shortDay = (key: string) => new Date(`${key}T12:00:00Z`).toLocaleDateString("bg-BG", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "✅ проведена", cls: "text-emerald-300" },
  no_show: { label: "🙈 не се яви", cls: "text-rose-300" },
};

function Meeting({ m, past, canOpen }: { m: CalMeeting; past: boolean; canOpen: boolean }) {
  const st = STATUS[m.status] ?? (past ? { label: "⚠️ без отбелязан изход", cls: "text-amber-300" } : null);
  const add = googleCalendarTemplateUrl({
    startISO: m.at,
    minutes: m.minutes,
    title: `👤 Среща · ${m.name}${m.business ? ` (${m.business})` : ""}`,
    details: [m.phone ? `Телефон: ${m.phone}` : null, m.meetUrl ? `Meet: ${m.meetUrl}` : null, m.closer ? `Води: ${m.closer}` : null].filter(Boolean).join("\n"),
    location: m.meetUrl,
  });
  return (
    <li className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-semibold">
          <span className="tabular-nums text-[var(--color-accent-cyan)]">{hhmm(m.at)}</span> · {m.name}
          {st && <span className={`ml-2 text-[11px] font-normal ${st.cls}`}>{st.label}</span>}
        </p>
        <p className="text-[11px] text-[var(--color-text-tertiary)]">
          води <b className="text-[var(--color-text-secondary)]">{m.closer ?? "Ивайло"}</b>
          {m.bookedBy ? ` · записа ${m.bookedBy}` : ""}
        </p>
      </div>
      <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
        {m.phone ? (
          <a href={`tel:${m.phone}`} className="text-[var(--color-accent-cyan)]">
            {m.phone}
          </a>
        ) : (
          "без телефон"
        )}
        {m.business ? ` · ${m.business}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
        {m.meetUrl && !past && (
          <>
            <a href={m.meetUrl} target="_blank" rel="noreferrer" className="rounded-md border border-emerald-400/50 px-2.5 py-1 font-semibold text-emerald-200">
              🎥 Влез в срещата
            </a>
            <CopyLink url={m.meetUrl} label="📋 Линк за клиента" />
          </>
        )}
        {!m.meetUrl && !past && <span className="text-amber-300">⚠️ няма Meet линк — клоузърът да си го сложи долу</span>}
        {!past && (
          <a href={add} target="_blank" rel="noreferrer" className="rounded-md border border-white/15 px-2.5 py-1 text-[var(--color-text-secondary)]">
            ➕ В моя Google Календар
          </a>
        )}
        {m.recording && (
          <a href={m.recording} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)] underline">
            🎥 запис
          </a>
        )}
        {canOpen && m.phone && (
          <Link href={`/ekip?q=${encodeURIComponent(m.phone)}`} className="text-[var(--color-text-tertiary)] underline">
            картата →
          </Link>
        )}
      </div>
    </li>
  );
}

/**
 * „📅 Календар“ — всички срещи на екипа на едно място: кой кога е зает, с кой
 * линк е срещата, как влиза в личния календар на всеки и как се записва (Fathom).
 */
export default async function KalendarPage({ searchParams }: { searchParams: Promise<{ v?: string; c?: string }> }) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "kalendar")) redirect(homeFor(actor.member));
  const sp = await searchParams;
  const now = new Date();
  const [nav, data] = await Promise.all([ekipNav(actor), loadCalendar(now)]);
  const viewer: CalViewer =
    actor.kind === "owner" ? { kind: "owner", id: null, name: actor.name, role: "owner" } : { kind: "member", id: actor.member.id, name: actor.member.full_name, role: actor.member.role };
  const closerIds = new Set(data.closers.map((c) => c.id));
  const scope: CalScope = sp.v === "all" ? "all" : sp.v === "mine" ? "mine" : defaultScope(viewer);
  let list = visibleMeetings(data.meetings, viewer, scope, closerIds);
  const pick = sp.c && closerIds.has(sp.c) ? sp.c : null;
  if (pick) list = list.filter((m) => m.closerId === pick);

  const nowIso = now.toISOString();
  const upcoming = groupByDay(list.filter((m) => m.at >= nowIso && isLive(m.status)));
  const past = list.filter((m) => m.at < nowIso).sort((a, b) => b.at.localeCompare(a.at));
  const unmarked = past.filter((m) => isLive(m.status)).length;
  const busy = busyByCloser(
    data.meetings.filter((m) => m.closerId && closerIds.has(m.closerId)),
    data.closers,
    now
  );
  const me = actor.kind === "member" ? actor.member : null;
  const isCloser = me?.role === "sales";
  const feed = isCloser ? null : feedUrlFor(me ? me.id : "owner");
  const webcal = feed ? feed.replace(/^https:/, "webcal:") : null;
  const canOpen = allowed(actor, "zvanene");
  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`;
  const href = (v: CalScope, c: string | null) => `/ekip/kalendar?v=${v}${c ? `&c=${c}` : ""}`;
  const total = upcoming.reduce((s, d) => s + d.meetings.length, 0);

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="kalendar" unread={nav.unread} />
      <main className="space-y-5 px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Календар · срещите</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Кой кога има среща, с кой линк е и как влиза в твоя календар. Нова среща се записва от картата на човека — „Записах среща“.
            </p>
          </div>
          <nav className="flex flex-wrap gap-1.5" aria-label="Изглед">
            {viewer.kind === "member" && (viewer.role === "sales" || viewer.role === "setter") && (
              <Link href={href("mine", null)} className={chip(scope === "mine" && !pick)}>
                Моите
              </Link>
            )}
            <Link href={href("all", null)} className={chip(scope === "all" && !pick)}>
              Целият екип
            </Link>
            {data.closers.map((c) => (
              <Link key={c.id} href={href("all", c.id)} className={chip(pick === c.id)}>
                {c.name}
              </Link>
            ))}
          </nav>
        </div>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🕒 Кой кога е зает · следващите 7 дни</h2>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Преди да запишеш час, виж кой клоузър е свободен. Двамата клоузъри могат да имат срещи по едно и също време; при „По ред“ системата дава срещата на свободния.
          </p>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  <th className="px-2 py-2">Ден</th>
                  {data.closers.map((c) => (
                    <th key={c.id} className="px-2 py-2">
                      {c.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {busy.map((d) => (
                  <tr key={d.day} className="border-b border-white/5 align-top">
                    <td className="px-2 py-2 text-xs capitalize text-[var(--color-text-secondary)]">{shortDay(d.day)}</td>
                    {d.slots.map((s) => (
                      <td key={s.closer} className="px-2 py-2 text-xs tabular-nums">
                        {s.times.length ? s.times.join(" · ") : <span className="text-emerald-300/70">свободен</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.closers.length === 0 && <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Още няма клоузър с вход.</p>}
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">📅 Предстоящи срещи · {total}</h2>
          {upcoming.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Няма записани срещи напред. Щом сетърът натисне „Записах среща“, срещата излиза тук и в календарите.</p>
          ) : (
            <div className="mt-2 space-y-4">
              {upcoming.map((d) => (
                <div key={d.day}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">{dayLabel(d.day)}</p>
                  <ul className="space-y-2">
                    {d.meetings.map((m) => (
                      <Meeting key={m.id} m={m} past={false} canOpen={canOpen} />
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <details className={card}>
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.15em]">
            🎥 Минали срещи · последните 7 дни · {past.length}
            {unmarked > 0 ? <span className="ml-2 text-xs font-normal normal-case text-amber-300">⚠️ {unmarked} без отбелязан изход</span> : null}
          </summary>
          <ul className="mt-3 space-y-2">
            {past.map((m) => (
              <li key={m.id} className="list-none">
                <p className="mb-1 text-[11px] text-[var(--color-text-tertiary)]">{shortDay(new Date(m.at).toLocaleDateString("sv-SE", { timeZone: TZ }))}</p>
                <ul>
                  <Meeting m={m} past canOpen={canOpen} />
                </ul>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">Изходът (проведена · не се яви · DQ) се отбелязва от водещия в „💼 Продажби“.</p>
        </details>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className={card}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">📲 Срещите в твоя календар</h2>
            {isCloser ? (
              <div className="mt-2 space-y-2 text-sm text-[var(--color-text-secondary)]">
                <p>
                  Всяка твоя среща идва като <b>покана на имейла ти</b> и влиза сама в календара ти, с напомняне 15 минути преди. Само първия път натисни „Add to calendar“ в
                  писмото — после влизат сами. Преместена среща се мести сама, отменена — изчезва.
                </p>
                <p className="font-semibold text-[var(--color-text-primary)]">Моят постоянен Meet линк</p>
                <p className="text-xs">
                  С него са всичките ти срещи — ти си домакинът. Направи го веднъж: meet.google.com → „Нова среща“ → „Създай среща за по-късно“ → копирай линка и го постави тук.
                </p>
                <MeetUrlForm current={me?.meet_url ?? null} />
              </div>
            ) : feed && webcal ? (
              <div className="mt-2 space-y-2 text-sm text-[var(--color-text-secondary)]">
                <p>Добави личния си линк веднъж — срещите на екипа се обновяват сами в твоя календар (Google, Apple, Outlook).</p>
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={`https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcal)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md border border-emerald-400/50 px-3 py-1.5 text-xs font-semibold text-emerald-200"
                  >
                    ➕ Добави в Google Календар
                  </a>
                  <a href={webcal} className="rounded-md border border-white/15 px-3 py-1.5 text-xs font-semibold">
                     Apple / Outlook
                  </a>
                  <CopyLink url={feed} label="📋 Копирай линка" />
                </div>
                <p className="break-all font-mono text-[10px] text-[var(--color-text-tertiary)]">{feed}</p>
                <p className="text-xs">
                  Линкът е личен — не го препращай. Google обновява абонираните календари на няколко часа; най-точното е тази страница. За една конкретна среща — „➕ В моя Google
                  Календар“ до нея.
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Линкът за абонамент не е наличен в момента.</p>
            )}
          </div>

          <div className={card}>
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🧭 Как върви една среща</h2>
            <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-[var(--color-text-secondary)]">
              <li>Сетърът записва часа от картата на човека — „Записах среща“ (от 10:00 нататък). Избира клоузър или оставя „По ред“.</li>
              <li>Клоузърът получава поканата в календара си. Клиентът получава покана с Meet линка на имейла си; сетърът му праща и напомнянето по Viber от „💜 Срещите“.</li>
              <li>
                Срещата влиза и в календара на Ивайло. В началото в Meet иска да влезе <b>„Fathom Notetaker“</b> — пусни го: той записва срещата и записът се връзва към нея тук.
              </li>
              <li>След срещата клоузърът отбелязва изхода в „💼 Продажби“: проведена, не се яви или DQ.</li>
              <li>Нов час = пак „Записах среща“ с новия час. Старият се маха сам от всички календари.</li>
            </ol>
          </div>
        </section>

        {actor.kind === "owner" && (
          <section className="rounded-2xl border border-violet-400/30 bg-violet-500/[0.06] p-4 text-sm text-[var(--color-text-secondary)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-text-primary)]">🎥 Твоят календар и Fathom</h2>
            <p className="mt-1">
              Всяка среща на екипа идва при теб като покана за календара — отбелязана като <b>свободно време</b>, за да не затваря часове в Cal.com. Fathom е на „Auto-record: All
              meetings“ и влиза в срещата от линка в събитието; записът се връзва към срещата от задачата „Календар ↔ CRM“. Първия път натисни „Add to calendar“ в писмото — после
              влизат сами.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
