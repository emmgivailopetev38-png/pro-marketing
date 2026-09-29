import Link from "next/link";
import { listActiveMembers } from "@/lib/team/repository";
import { listProspects, prospectStats, recentProspectCalls } from "@/lib/team/prospects";
import { PROSPECT_STATUSES, PROSPECT_STATUS_LABEL, phoneDisplay, type ProspectStatus } from "@/lib/team/prospects-rules";
import { ProspectAssignForm } from "@/components/admin/ProspectAssignForm";
import { unassignAction } from "./actions";

export const dynamic = "force-dynamic";

const OUTCOME_LABEL: Record<string, string> = {
  no_answer: "📵 не вдигна",
  callback: "⏰ звънни пак",
  talked: "💬 говорихме",
  meeting: "📅 среща",
  not_interested: "✋ не се интересува",
  bad_number: "❌ грешен номер",
};

function when(iso: string): string {
  return new Date(iso).toLocaleString("bg-BG", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Sofia" });
}

const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

/**
 * Студените обаждания — всичко при Ивайло (26.09.2026): колко фирми има, по
 * градове и по хора, какво се е звъняло и раздаването „дай N от града на човека“.
 * Фирмите не са картони в CRM-а, докато няма разговор — затова стоят тук, а не в
 * „Клиенти“, и никоя автоматика (писма, отчети за лийдове) не ги докосва.
 */
export default async function AdminStudeniPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string | string[]; status?: string | string[]; who?: string | string[] }>;
}) {
  const sp = await searchParams;
  const filter = { city: one(sp.city), status: one(sp.status), memberId: one(sp.who) };
  const [stats, members, calls, list] = await Promise.all([
    prospectStats(),
    listActiveMembers(),
    recentProspectCalls(40),
    listProspects(filter),
  ]);
  const name = new Map(members.map((m) => [m.id, m.full_name]));
  const assignable = members.filter((m) => m.role !== "owner").map((m) => ({ id: m.id, name: m.full_name }));
  const s = stats;
  const assigned = s ? s.byMember.reduce((a, m) => a + m.assigned, 0) : 0;

  return (
    <div className="min-h-screen">
      <div className="cc-content space-y-6 p-5 md:p-10">
        <header className="cc-panel cc-panel-accent overflow-hidden p-6">
          <p className="hud text-[var(--color-accent-cyan)]">ProMarketing · Екип</p>
          <h1 className="cc-title mt-2 font-display text-4xl font-bold">Студени обаждания</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Фирмите от проучването. Не са картони в CRM-а, докато няма разговор — „говорихме“ или „среща“ ги прави
            картон при човека, който е звънял. Дотогава никакви писма и никакви отчети за лийдове.
          </p>
          {s && (
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="cc-btn">Всички · {s.total}</span>
              <span className="cc-btn">С телефон · {s.withPhone}</span>
              <span className="cc-btn">Раздадени · {assigned}</span>
              <span className="cc-btn">Станаха картон · {s.byStatus.converted ?? 0}</span>
              {s.batches.map((b) => (
                <span key={b.batch} className="cc-btn opacity-70">
                  {b.batch} · {b.total}
                </span>
              ))}
            </div>
          )}
        </header>

        {!s ? (
          <p className="cc-panel p-6 text-sm text-[var(--color-text-secondary)]">Таблицата за студените още я няма в базата — миграцията не е пусната.</p>
        ) : s.total === 0 ? (
          <p className="cc-panel p-6 text-sm text-[var(--color-text-secondary)]">
            Още няма вкарани фирми. Пакетът се вкарва със <span className="font-mono">scripts/studeni-import.mjs</span>.
          </p>
        ) : (
          <>
            <section className="cc-panel space-y-4 p-5">
              <h2 className="font-display text-lg font-bold">Раздаване</h2>
              <ProspectAssignForm members={assignable} cities={s.byCity} />
              <ul className="divide-y divide-white/5 text-sm">
                {s.byMember.length === 0 && <li className="py-2 text-[var(--color-text-tertiary)]">Още на никого не са дадени.</li>}
                {s.byMember.map((m) => (
                  <li key={m.member_id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                    <span>
                      <b>{name.get(m.member_id) ?? "—"}</b> · дадени {m.assigned} · за звънене {m.open} · станаха картон {m.converted}
                    </span>
                    <span className="flex items-center gap-2">
                      <Link href={`/ekip?vid=studeni&as=${m.member_id}`} className="text-xs underline">
                        👀 виж опашката
                      </Link>
                      <form action={unassignAction}>
                        <input type="hidden" name="member_id" value={m.member_id} />
                        <button type="submit" className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--color-text-tertiary)]">
                          ↩︎ Върни неизвъртените
                        </button>
                      </form>
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="cc-panel p-5">
              <h2 className="font-display text-lg font-bold">По градове</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {s.byCity.slice(0, 24).map((c) => (
                  <Link key={c.city} href={`/admin/studeni?city=${encodeURIComponent(c.city)}`} className="cc-btn">
                    {c.city} · {c.total}
                    {c.free > 0 ? ` · ${c.free} свободни` : ""}
                  </Link>
                ))}
              </div>
            </section>

            <section className="cc-panel p-5">
              <h2 className="font-display text-lg font-bold">Последни обаждания</h2>
              {calls.length === 0 ? (
                <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">Още никой не е звънял.</p>
              ) : (
                <ul className="mt-2 divide-y divide-white/5 text-sm">
                  {calls.map((c) => (
                    <li key={c.id} className="py-2">
                      <span className="text-[var(--color-text-tertiary)]">{when(c.created_at)} · {c.caller} · </span>
                      {c.contact_id ? (
                        <Link href={`/admin/clients/${c.contact_id}`} className="font-semibold underline">
                          {c.company}
                        </Link>
                      ) : (
                        <b>{c.company}</b>
                      )}
                      {c.city ? <span className="text-[var(--color-text-tertiary)]"> · {c.city}</span> : null}
                      <span> · {OUTCOME_LABEL[c.outcome] ?? c.outcome}</span>
                      {c.note && <p className="text-xs text-[var(--color-text-secondary)]">{c.note}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="cc-panel p-5">
              <h2 className="font-display text-lg font-bold">Фирмите</h2>
              <form className="mt-3 flex flex-wrap items-center gap-2 text-sm" action="/admin/studeni">
                <select name="city" defaultValue={filter.city} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <option value="">всички градове</option>
                  {s.byCity.map((c) => (
                    <option key={c.city} value={c.city}>
                      {c.city} · {c.total}
                    </option>
                  ))}
                </select>
                <select name="status" defaultValue={filter.status} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <option value="">всяко състояние</option>
                  {PROSPECT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {PROSPECT_STATUS_LABEL[st]} · {s.byStatus[st] ?? 0}
                    </option>
                  ))}
                </select>
                <select name="who" defaultValue={filter.memberId} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <option value="">при всички</option>
                  <option value="none">нераздадени</option>
                  {assignable.map((m) => (
                    <option key={m.id} value={m.id}>
                      при {m.name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="cc-btn">Покажи</button>
              </form>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs text-[var(--color-text-tertiary)]">
                    <tr>
                      <th className="py-2 pr-3">Фирма</th>
                      <th className="py-2 pr-3">Град</th>
                      <th className="py-2 pr-3">Телефон</th>
                      <th className="py-2 pr-3">Бранш</th>
                      <th className="py-2 pr-3">Състояние</th>
                      <th className="py-2">При</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {list.map((p) => (
                      <tr key={p.id}>
                        <td className="py-2 pr-3">
                          {p.contact_id ? (
                            <Link href={`/admin/clients/${p.contact_id}`} className="underline">
                              {p.company}
                            </Link>
                          ) : (
                            p.company
                          )}
                          {p.last_note && <p className="text-xs text-[var(--color-text-tertiary)]">{p.last_note}</p>}
                        </td>
                        <td className="py-2 pr-3">{p.city ?? "—"}</td>
                        <td className="py-2 pr-3 font-mono text-xs">{p.phone ? phoneDisplay(p.phone) : "—"}</td>
                        <td className="py-2 pr-3 text-xs">{p.sector ?? "—"}</td>
                        <td className="py-2 pr-3 text-xs">{PROSPECT_STATUS_LABEL[p.status as ProspectStatus] ?? p.status}</td>
                        <td className="py-2 text-xs">{p.assigned_to ? name.get(p.assigned_to) ?? "—" : "свободна"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {list.length === 200 && <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">Първите 200 — стесни с филтрите.</p>}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
