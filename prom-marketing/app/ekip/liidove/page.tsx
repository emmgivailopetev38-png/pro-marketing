import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { loadLeads } from "@/lib/team/liidove";
import { LEAD_STATUSES, LEAD_STATUS_META, type LeadStatus } from "@/lib/team/liidove-rules";
import { fmtSofia } from "@/lib/team/time";
import { EkipHeader } from "@/components/ekip/EkipHeader";

export const dynamic = "force-dynamic";

const PAGE = 150;

const MEETING: Record<string, string> = {
  completed: "дошъл",
  no_show: "не дошъл",
  cancelled: "отменена",
  rejected: "отменена",
};

function hrefWith(sp: Record<string, string | undefined>, patch: Record<string, string | null>): string {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, ...patch })) if (v) p.set(k, v);
  const s = p.toString();
  return s ? `/ekip/liidove?${s}` : "/ekip/liidove";
}

/**
 * „Всички лийдове“ — всеки човек, дошъл като лийд, и какво е станало с него:
 * нечут, не вдига, говорили, среща, дошъл, не дошъл, оферта, клиент, DQ.
 * Вижда го целият екип по продажбите; звънене и записване на срещи — от картата.
 */
export default async function LiidovePage({ searchParams }: { searchParams: Promise<{ s?: string; q?: string; who?: string; ot?: string; n?: string }> }) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "liidove")) redirect(homeFor(actor.member));
  const sp = await searchParams;
  const [nav, view] = await Promise.all([ekipNav(actor), loadLeads({ status: sp.s ?? null, q: sp.q ?? null, who: sp.who ?? null, ot: sp.ot ?? null })]);
  const canOpen = allowed(actor, "zvanene");
  const limit = Math.min(Math.max(Number(sp.n) || PAGE, PAGE), 2000);
  const shown = view.rows.slice(0, limit);
  const active = (LEAD_STATUSES as readonly string[]).includes(sp.s ?? "") ? (sp.s as LeadStatus) : null;
  const ot = sp.ot === "uebinar" ? "uebinar" : undefined;
  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`;

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="liidove" unread={nav.unread} />
      <main className="space-y-4 px-4 py-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Всички лийдове · {view.total}</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Всеки, дошъл от реклама, сайта, Ели или уебинара — чути и нечути, със срещите и кой го води. Числата са на живо.
          </p>
        </div>

        <form action="/ekip/liidove" className="flex flex-wrap gap-2">
          {active && <input type="hidden" name="s" value={active} />}
          {ot && <input type="hidden" name="ot" value={ot} />}
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Търси име, телефон, имейл, фирма…"
            className="min-w-[220px] flex-1 rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm"
          />
          <select name="who" defaultValue={sp.who ?? ""} className="rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm">
            <option value="">Всички хора</option>
            {view.people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            <option value="ivailo">При Ивайло / ничии</option>
          </select>
          <button className="rounded-xl border border-[var(--color-accent-cyan)]/50 px-4 py-2 text-sm font-semibold text-[var(--color-accent-cyan)]">Търси</button>
        </form>

        <nav className="flex flex-wrap gap-1.5" aria-label="Групи">
          <Link href={hrefWith({ q: sp.q, who: sp.who, s: sp.s }, { ot: ot ? null : "uebinar" })} className={chip(!!ot)} title="Само записаните за уебинара на ivailopetev.com">
            🎓 Уебинар · {view.uebinar}
          </Link>
          <Link href={hrefWith({ q: sp.q, who: sp.who, ot }, { s: null })} className={chip(!active)}>
            Всички · {view.counts.all}
          </Link>
          {LEAD_STATUSES.map((s) => (
            <Link key={s} href={hrefWith({ q: sp.q, who: sp.who, ot }, { s })} className={chip(active === s)} title={LEAD_STATUS_META[s].hint}>
              {LEAD_STATUS_META[s].label} · {view.counts[s]}
            </Link>
          ))}
        </nav>

        {shown.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-[var(--color-text-secondary)]">Няма хора по този филтър.</p>
        ) : (
          <ul className="space-y-2">
            {shown.map((r) => {
              const st = LEAD_STATUS_META[r.status];
              return (
                <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-semibold">
                      {r.name} <span className={`ml-1 text-xs font-semibold ${st.cls}`}>{st.short}</span>
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">дошъл {fmtSofia(r.createdAt)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                    {r.phone ? (
                      <a href={`tel:${r.phone}`} className="text-[var(--color-accent-cyan)]">
                        {r.phone}
                      </a>
                    ) : (
                      "без телефон"
                    )}
                    {r.email ? ` · ${r.email}` : ""}
                    {r.company ? ` · ${r.company}` : ""}
                    {r.business && r.business !== r.company ? ` · ${r.business}` : ""}
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">
                    {r.uebinar ? <span className="font-semibold text-violet-300">{r.source}</span> : r.source}
                    {" · "}📞 {r.calls}
                    {r.eli ? ` + Ели ${r.eli}` : ""}
                    {r.meeting ? ` · 📅 ${fmtSofia(r.meeting.at)}${r.meeting.upcoming ? " (предстои)" : MEETING[r.meeting.status] ? ` (${MEETING[r.meeting.status]})` : " (без изход)"}` : ""}
                    {r.owner ? ` · води ${r.owner}` : ""}
                    {r.setter && r.setter !== r.owner ? ` · сетър ${r.setter}` : ""}
                    {r.nextFollowup ? ` · чуване ${fmtSofia(r.nextFollowup)}` : ""}
                    {r.status === "klient" && r.dealValue ? ` · ${r.dealValue.toLocaleString("bg-BG")} €` : ""}
                  </p>
                  {r.ivailo && <p className="mt-1 text-[11px] text-amber-300">{r.ivailo}</p>}
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    {r.history.length > 0 && (
                      <details className="text-[11px] text-[var(--color-text-secondary)]">
                        <summary className="cursor-pointer text-[var(--color-text-tertiary)]">история · {r.history.length}</summary>
                        <ul className="mt-1 space-y-0.5">
                          {r.history.map((h, i) => (
                            <li key={`${h.at}-${i}`}>
                              {fmtSofia(h.at)} · {h.title}
                              {h.by ? <span className="text-[var(--color-text-tertiary)]"> · {h.by}</span> : null}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                    {canOpen && r.phone && (
                      <Link href={`/ekip?q=${encodeURIComponent(r.phone)}`} className="text-[11px] font-semibold text-[var(--color-accent-cyan)] underline">
                        Отвори картата →
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {view.rows.length > shown.length && (
          <p className="text-center text-sm">
            Показани {shown.length} от {view.rows.length} ·{" "}
            <Link href={hrefWith({ s: sp.s, q: sp.q, who: sp.who }, { n: String(limit + PAGE) })} className="text-[var(--color-accent-cyan)] underline">
              покажи още {Math.min(PAGE, view.rows.length - shown.length)}
            </Link>
          </p>
        )}
      </main>
    </div>
  );
}
