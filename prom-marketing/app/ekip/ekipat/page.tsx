import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { loadManagerBoard } from "@/lib/team/manager";
import { dealSplit, feeInstallment, type Viewer } from "@/lib/team/manager-rules";
import { TEAM_ORG_LABEL, TEAM_ROLE_SHORT } from "@/lib/team/types";
import { fmtSofia } from "@/lib/team/time";
import { EkipHeader } from "@/components/ekip/EkipHeader";
import { PROGRAM_PRICE_EUR, TEAM_PAY_LINKS } from "@/lib/stripe/team-links";
import { PERIODS, humanMinutes, parsePeriod, periodLabel } from "@/lib/team/napredak-rules";
import { TbiBox } from "@/components/ekip/TbiBox";

export const dynamic = "force-dynamic";

const eur = (n: number) => `${n.toLocaleString("bg-BG", { maximumFractionDigits: 2 })} €`;
const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n)}%`);

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: { label: "проведена", cls: "text-emerald-300" },
  no_show: { label: "не се яви", cls: "text-rose-300" },
  cancelled: { label: "отменена", cls: "text-[var(--color-text-tertiary)]" },
  accepted: { label: "без отбелязан изход", cls: "text-amber-300" },
  pending: { label: "без отбелязан изход", cls: "text-amber-300" },
  confirmed: { label: "без отбелязан изход", cls: "text-amber-300" },
};

/**
 * „Екипът“ — нивото на мениджъра на продажбите: всички сетъри и клоузъри един до
 * друг, срещите им и сделките по договора. Отварят го само мениджър и собственикът.
 */
export default async function EkipatPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "ekipat")) redirect(homeFor(actor.member));
  const sp = await searchParams;
  const days = parsePeriod(sp.d, 30);
  const viewer: Viewer = actor.kind === "owner" ? { kind: "owner" } : { kind: "member", member: actor.member };
  const [nav, board] = await Promise.all([ekipNav(actor), loadManagerBoard(viewer, days)]);
  const isOwner = actor.kind === "owner";
  const th = "px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]";
  const td = "px-2 py-2 text-sm tabular-nums";
  const example = board.statement ? dealSplit(3900, board.statement.terms, { setter: true, closer: true }) : null;

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <EkipHeader name={actor.name} isOwner={isOwner} nav={nav.items} section="ekipat" unread={nav.unread} />
      <main className="space-y-6 px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Екипът по продажбите</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Хора, срещи и сделки — {board.days === 1 ? "днес (от полунощ)" : `последните ${board.days} дни`}. Числата се смятат на живо от CRM-а.
            </p>
          </div>
          <div className="flex gap-1.5">
            {PERIODS.map((d) => (
              <Link
                key={d}
                href={`/ekip/ekipat?d=${d}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${d === board.days ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`}
              >
                {periodLabel(d)}
              </Link>
            ))}
          </div>
        </div>

        <nav className="flex flex-wrap gap-2 text-xs">
          <Link href="/ekip/kalendar" className="rounded-full border border-white/15 px-3 py-1.5 font-semibold text-[var(--color-text-secondary)] hover:text-white">
            📅 Календар на срещите
          </Link>
          <Link href="/ekip/liidove" className="rounded-full border border-white/15 px-3 py-1.5 font-semibold text-[var(--color-text-secondary)] hover:text-white">
            📋 Всички лийдове
          </Link>
          <Link href="/ekip/biznes" className="rounded-full border border-white/15 px-3 py-1.5 font-semibold text-[var(--color-text-secondary)] hover:text-white">
            📊 Бизнесът · реклами и цена на лийд
          </Link>
          <Link href="/ekip/materiali" className="rounded-full border border-white/15 px-3 py-1.5 font-semibold text-[var(--color-text-secondary)] hover:text-white">
            🎬 Видеа, отзиви и как работи системата
          </Link>
        </nav>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">👥 Хората · {periodLabel(board.days)}</h2>
          {board.people.length === 0 ? (
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Още няма сетър или клоузър с вход. Щом приемат поканите си, излизат тук.</p>
          ) : (
            <div className="mt-2 overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className={th}>Човек</th>
                    <th className={th} title="всяко натискане на изход в картата; „Записах среща“ също">Обаждания</th>
                    <th className={th} title="говорихме + не се интересува + DQ, % от обажданията с изход">Вдигнали</th>
                    <th className={th} title="срещи, записани от човека; booking rate = записани / вдигнали">Записа срещи</th>
                    <th className={th} title="срещите, които ВОДИ (клоузърът на картона), по часа на срещата">Води: дошли · не</th>
                    <th className={th} title="дошли / (дошли + не дошли) на срещите, които води">Явяване</th>
                    <th className={th} title="неквалифицирани: на разговора (% от вдигналите) и на срещата">DQ</th>
                    <th className={th}>До лийда</th>
                    <th className={th}>В опашката</th>
                    <th className={th}>Води хора</th>
                    <th className={th}>Оферти</th>
                    <th className={th}>Сделки</th>
                  </tr>
                </thead>
                <tbody>
                  {board.people.map((p) => (
                    <tr key={p.id} className="border-b border-white/5 align-top">
                      <td className="px-2 py-2">
                        <p className="text-sm font-semibold">
                          {isOwner ? (
                            <Link href={`/ekip/napredak?who=${encodeURIComponent(p.slug)}`} className="hover:underline">
                              {p.name}
                            </Link>
                          ) : (
                            p.name
                          )}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-tertiary)]">
                          {TEAM_ROLE_SHORT[p.role]} · {TEAM_ORG_LABEL[p.org] ?? p.org}
                          {p.intake && p.role === "setter" ? " · поема новите лийдове" : ""}
                          {p.defaultCloser ? " · тук записва и сайтът" : ""}
                        </p>
                        <p className="text-[11px] text-[var(--color-text-tertiary)]">
                          {p.lastLogin ? `вход ${fmtSofia(p.lastLogin)}` : "без вход досега"}
                          {p.role === "sales" && !p.hasMeetUrl && !p.defaultCloser ? " · ⚠️ няма Meet линк" : ""}
                        </p>
                      </td>
                      <td className={td}>{p.calls}</td>
                      <td className={td}>
                        {p.reached}
                        <span className="block text-[11px] text-[var(--color-text-tertiary)]">{pct(p.reachedPct)}</span>
                      </td>
                      <td className={td}>
                        {p.booked}
                        <span className="block text-[11px] text-[var(--color-text-tertiary)]">booking {pct(p.bookingRate)}</span>
                        {p.completed + p.noShow > 0 ? (
                          <span className="block text-[11px] text-[var(--color-text-tertiary)]">
                            дошли {p.completed} · не {p.noShow}
                          </span>
                        ) : null}
                      </td>
                      <td className={td}>
                        {p.held}
                        {p.closerNoShow ? <span className="text-rose-300"> · {p.closerNoShow} не</span> : null}
                        {p.closerUnmarked ? <span className="block text-[11px] text-amber-300">⚠️ {p.closerUnmarked} без изход</span> : null}
                        {p.closerUpcoming ? <span className="block text-[11px] text-[var(--color-text-tertiary)]">предстоят {p.closerUpcoming}</span> : null}
                      </td>
                      <td className={td}>{pct(p.closerShowRate ?? p.showRate)}</td>
                      <td className={td}>
                        {p.dq + p.meetingDq}
                        {p.dqPct !== null ? <span className="block text-[11px] text-[var(--color-text-tertiary)]">{pct(p.dqPct)} от вдигн.</span> : null}
                        {p.meetingDq ? <span className="block text-[11px] text-[var(--color-text-tertiary)]">{p.meetingDq} на среща</span> : null}
                      </td>
                      <td className={td}>{humanMinutes(p.medianMinutes === null ? null : Math.round(p.medianMinutes))}</td>
                      <td className={td}>{p.queue}</td>
                      <td className={td}>{p.people}</td>
                      <td className={td}>{p.offers}</td>
                      <td className={td}>
                        {p.won}
                        {p.won ? <span className="text-emerald-300"> · {eur(p.wonValue)}</span> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">
            Неразпределени отворени лийдове: <b className="text-[var(--color-text-secondary)]">{board.unrouted.count}</b>
            {board.unrouted.goesTo ? ` — излизат в опашката на ${board.unrouted.goesTo} („Стари и топли“).` : " — още няма сетър, който да ги поеме."}
          </p>
          <details className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
            <summary className="cursor-pointer font-semibold">ℹ️ Как се смята всяко число</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              <li><b>Обаждания</b> — всеки изход, натиснат в картата (не вдигна, говорихме, не се интересува, DQ, грешен номер…). „Записах среща“ също е обаждане.</li>
              <li><b>Вдигнали</b> — говорихме + не се интересува + DQ. Процентът е от обажданията с отбелязан изход.</li>
              <li><b>Записа срещи</b> — срещите, които човекът е записал („Записах среща“). <b>Booking rate</b> = записани / вдигнали.</li>
              <li><b>Води: дошли · не</b> — срещите, които човекът ВОДИ (клоузърът на картона), с час в периода. <b>Явяване</b> = дошли / (дошли + не дошли). Среща без отбелязан изход не влиза — отбележи я.</li>
              <li><b>DQ</b> — неквалифицирани: бутонът „🚫 Неквалифициран (DQ)“ в картата (на разговора) и в срещата (проведена, но не е за програмата). DQ % = DQ / вдигнали. Целта е DQ да е колкото може по-нисък — значи рекламата води правилните хора.</li>
              <li><b>Сделки</b> — „Спечелен“ в картона за периода, със сумата.</li>
            </ul>
          </details>
        </section>

        {board.people.some((p) => p.daily.some((d) => d.calls + d.booked + d.held + d.noShow > 0)) && (
          <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">📋 Ден по ден · дневният отчет (EOD)</h2>
            <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">Последните 10 дни на всеки човек — пише се само, от бутоните в картите. Няма какво да се попълва на ръка.</p>
            <div className="mt-2 space-y-2">
              {board.people
                .filter((p) => p.daily.some((d) => d.calls + d.booked + d.held + d.noShow > 0))
                .map((p) => (
                  <details key={p.id} className="rounded-xl border border-white/10 px-3 py-2">
                    <summary className="cursor-pointer text-sm font-semibold">
                      {p.name}{" "}
                      <span className="text-[11px] font-normal text-[var(--color-text-tertiary)]">
                        · днес {p.daily[0]?.calls ?? 0} обаждания, {p.daily[0]?.booked ?? 0} записани, {p.daily[0]?.held ?? 0} дошли
                      </span>
                    </summary>
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-[520px] border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className={th}>Ден</th>
                            <th className={th}>Обаждания</th>
                            <th className={th}>Вдигнали</th>
                            <th className={th}>Записани</th>
                            <th className={th}>Дошли</th>
                            <th className={th}>Не дошли</th>
                            <th className={th}>DQ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.daily.map((d) => (
                            <tr key={d.day} className="border-b border-white/5">
                              <td className="px-2 py-1.5 text-xs">{new Date(`${d.day}T12:00:00Z`).toLocaleDateString("bg-BG", { weekday: "short", day: "2-digit", month: "2-digit" })}</td>
                              <td className={td}>{d.calls || "·"}</td>
                              <td className={td}>{d.reached || "·"}</td>
                              <td className={td}>{d.booked || "·"}</td>
                              <td className={td}>{d.held || "·"}</td>
                              <td className={td}>{d.noShow ? <span className="text-rose-300">{d.noShow}</span> : "·"}</td>
                              <td className={td}>{d.dq || "·"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">📅 Предстоящи срещи · {board.upcoming.length}</h2>
            <ul className="mt-2 divide-y divide-white/5">
              {board.upcoming.length === 0 && <li className="py-3 text-sm text-[var(--color-text-secondary)]">Няма записани срещи напред.</li>}
              {board.upcoming.slice(0, 30).map((m) => (
                <li key={m.id} className="py-2">
                  <p className="text-sm font-semibold">
                    {fmtSofia(m.at)} · {m.name}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-tertiary)]">
                    води {m.closer ?? "—"}
                    {m.bookedBy ? ` · записа ${m.bookedBy}` : ""}
                    {m.business ? ` · ${m.business}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🎥 Последни срещи · 14 дни</h2>
            <ul className="mt-2 divide-y divide-white/5">
              {board.recent.length === 0 && <li className="py-3 text-sm text-[var(--color-text-secondary)]">Още няма минали срещи на екипа.</li>}
              {board.recent.map((m) => {
                const st = STATUS[m.status] ?? { label: m.status, cls: "text-[var(--color-text-tertiary)]" };
                return (
                  <li key={m.id} className="py-2">
                    <p className="text-sm font-semibold">
                      {fmtSofia(m.at)} · {m.name} <span className={`text-[11px] font-normal ${st.cls}`}>· {st.label}</span>
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">
                      води {m.closer ?? "—"}
                      {m.bookedBy ? ` · записа ${m.bookedBy}` : ""}
                      {m.recording ? (
                        <>
                          {" · "}
                          <a href={m.recording} target="_blank" rel="noreferrer" className="text-[var(--color-accent-cyan)] underline">
                            запис
                          </a>
                        </>
                      ) : m.status === "completed" ? (
                        " · ⚠️ няма запис"
                      ) : null}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {board.statement && example && (
          <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🤝 Сделки по договора с {board.statement.terms.label}</h2>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Сетър {board.statement.terms.setterPct}% + клоузър {board.statement.terms.closerPct}% + управление{" "}
              {board.statement.terms.managementPct}% от сумата без ДДС, върху получени пари. От всяка платена сделка —{" "}
              {eur(board.statement.terms.feePerDeal)} към еднократното, докато се изплати. Пример: 3 900 € с ДДС → основа {eur(example.base)} →{" "}
              {eur(example.setter)} + {eur(example.closer)} + {eur(example.management)} = {eur(example.total)}, плюс {eur(feeInstallment(1, board.statement.terms))} вноска.
            </p>
            {board.statement.rows.length === 0 ? (
              <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
                Още няма затворена сделка на екипа. Щом клоузърът натисне „Спечелен“ в картона, сделката излиза тук със сметката си.
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className={th}>Клиент</th>
                      <th className={th}>Сума с ДДС</th>
                      <th className={th}>Основа</th>
                      <th className={th}>Сетър</th>
                      <th className={th}>Клоузър</th>
                      <th className={th}>Управление</th>
                      <th className={th}>Вноска</th>
                      <th className={th}>Общо</th>
                    </tr>
                  </thead>
                  <tbody>
                    {board.statement.rows.map((r) => (
                      <tr key={r.contactId} className="border-b border-white/5">
                        <td className="px-2 py-2 text-sm">
                          {r.name}
                          <span className="block text-[11px] text-[var(--color-text-tertiary)]">
                            {fmtSofia(r.wonAt)} · {r.setterName ?? "без техен сетър"} → {r.closerName ?? "—"}
                          </span>
                        </td>
                        <td className={td}>{eur(r.amount)}</td>
                        <td className={td}>{eur(r.split.base)}</td>
                        <td className={td}>{eur(r.split.setter)}</td>
                        <td className={td}>{eur(r.split.closer)}</td>
                        <td className={td}>{eur(r.split.management)}</td>
                        <td className={td}>{eur(r.installment)}</td>
                        <td className={`${td} font-semibold`}>{eur(r.split.total + r.installment)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td className="px-2 py-2 text-sm font-semibold">Общо · {board.statement.totals.deals}</td>
                      <td className={td}>{eur(board.statement.totals.amount)}</td>
                      <td className={td}>{eur(board.statement.totals.base)}</td>
                      <td className={td}>{eur(board.statement.totals.setter)}</td>
                      <td className={td}>{eur(board.statement.totals.closer)}</td>
                      <td className={td}>{eur(board.statement.totals.management)}</td>
                      <td className={td}>{eur(board.statement.totals.installments)}</td>
                      <td className={`${td} font-semibold text-emerald-300`}>{eur(board.statement.totals.due)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
              Остава от еднократното: {eur(board.statement.totals.feeRemaining)}. Сумата е от картона на клиента; окончателната сметка за месеца е по реално
              получените плащания.
            </p>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">💳 Линкове за плащане · „Пари с AI“ {eur(PROGRAM_PRICE_EUR)} с ДДС</h2>
          <ul className="mt-2 divide-y divide-white/5">
            {TEAM_PAY_LINKS.map((l) => (
              <li key={l.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 text-sm">
                <span>
                  <b>{l.label}</b> · {eur(l.amountEur)}
                  {l.restEur > 0 ? <span className="text-[var(--color-text-tertiary)]"> · остават {eur(l.restEur)}</span> : null}
                </span>
                <a href={l.url} target="_blank" rel="noreferrer" className="break-all font-mono text-xs text-[var(--color-accent-cyan)] underline">
                  {l.url}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            Клоузърът копира линка от картата на човека („💳 Линк за плащане“) — там имейлът е попълнен и плащането се познава по картона. Плащане с карта
            през Stripe; на вноски — през TBI (долу).
          </p>
          <TbiBox />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🧭 Как върви един лийд</h2>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-[var(--color-text-secondary)]">
            <li>Нов лийд от рекламата или уебинара влиза при сетъра и той звъни пръв — колкото по-бързо, толкова по-добре.</li>
            <li>Сетърът записва срещата от картата — „Записах среща“. Системата я дава на клоузър по ред (поравно между клоузърите) или на избрания.</li>
            <li>Картонът става на клоузъра: вижда го в „Продажби“, получава срещата в календара си и готовите съобщения за напомняне.</li>
            <li>След срещата клоузърът отбелязва изхода и слага линка към записа. Среща без запис излиза тук с ⚠️. „Не се яви“ връща човека при сетъра за нов час.</li>
            <li>Клиентът плаща през линка от картата (пълна сума, 75 %, 50 % или депозит 25 %). „Спечелен“ в картона = сделка: влиза в таблицата по договора със сметката си.</li>
          </ol>
        </section>
      </main>
    </div>
  );
}
