import Link from "next/link";
import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { loadKlasacia } from "@/lib/team/klasacia";
import { TEAM_ORG_LABEL, TEAM_ROLE_SHORT } from "@/lib/team/types";
import { fmtSofia } from "@/lib/team/time";
import { EkipHeader } from "@/components/ekip/EkipHeader";

export const dynamic = "force-dynamic";

const eur = (n: number) => `${n.toLocaleString("bg-BG", { maximumFractionDigits: 0 })} €`;
const MEDAL = ["🥇", "🥈", "🥉"];
const PERIODS: Array<[number, string]> = [
  [7, "7 дни"],
  [30, "30 дни"],
  [90, "90 дни"],
  [365, "Година"],
];
const STAGE: Record<string, string> = { won: "спечелен", offer_sent: "оферта", negotiating: "преговори" };

/**
 * „🏆 Сделки и класация“ — класацията на екипа и отчетът на сделките: моите
 * (или всички за мениджъра) спечелени в периода и тези в процес.
 */
export default async function KlasaciaPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "klasacia")) redirect(homeFor(actor.member));
  const sp = await searchParams;
  const days = PERIODS.some(([d]) => String(d) === sp.d) ? Number(sp.d) : 30;
  const [nav, k] = await Promise.all([ekipNav(actor), loadKlasacia(days)]);
  const meName = actor.kind === "member" ? actor.member.full_name : null;
  const seesAll = actor.kind === "owner" || actor.member.role === "manager";
  const mine = (d: { closer: string | null; setter: string | null }) => seesAll || d.closer === meName || d.setter === meName;
  const deals = k.deals.filter(mine);
  const pipeline = k.pipeline.filter(mine);
  const th = "px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]";
  const td = "px-2 py-2 text-sm tabular-nums";
  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-4";
  const total = deals.reduce((s, d) => s + d.value, 0);

  return (
    <div className="mx-auto max-w-5xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="klasacia" unread={nav.unread} />
      <main className="space-y-5 px-4 py-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Сделки и класация</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">Кой води — по оборот, сделки, проведени срещи и обаждания. Пише се само, от картите.</p>
          </div>
          <div className="flex gap-1.5">
            {PERIODS.map(([d, l]) => (
              <Link
                key={d}
                href={`/ekip/klasacia?d=${d}`}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${d === k.days ? "border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">🏆 Класацията</h2>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th className={th}>#</th>
                  <th className={th}>Човек</th>
                  <th className={th}>Оборот</th>
                  <th className={th}>Сделки</th>
                  <th className={th}>Уговорени → спечелени</th>
                  <th className={th}>Оферти</th>
                  <th className={th}>Проведени срещи</th>
                  <th className={th}>Записани срещи</th>
                  <th className={th}>Обаждания</th>
                  <th className={th}>Точки</th>
                </tr>
              </thead>
              <tbody>
                {k.rank.map((r, i) => (
                  <tr key={r.id} className={`border-b border-white/5 ${r.name === meName ? "bg-[var(--color-accent-cyan)]/[0.06]" : ""}`}>
                    <td className="px-2 py-2 text-lg">{MEDAL[i] ?? i + 1}</td>
                    <td className="px-2 py-2">
                      <p className="text-sm font-semibold">{r.name}</p>
                      <p className="text-[11px] text-[var(--color-text-tertiary)]">
                        {TEAM_ROLE_SHORT[r.role]} · {TEAM_ORG_LABEL[r.org] ?? r.org}
                      </p>
                    </td>
                    <td className={`${td} font-semibold text-emerald-300`}>{r.wonValue ? eur(r.wonValue) : "—"}</td>
                    <td className={td}>{r.won}</td>
                    <td className={td}>{r.setWon}</td>
                    <td className={td}>{r.offers}</td>
                    <td className={td}>{r.held}</td>
                    <td className={td}>{r.booked}</td>
                    <td className={td}>{r.calls}</td>
                    <td className={`${td} font-semibold`}>{r.score.toLocaleString("bg-BG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            Точки: 1 € оборот = 1 · сделка 300 · уговорена и спечелена (сетър) 150 · проведена среща 40 · записана 20 · обаждане 1. Срещите и обажданията — до 90 дни назад.
          </p>
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">
            ✅ {seesAll ? "Сделките на екипа" : "Моите сделки"} · {deals.length} · {eur(total)}
          </h2>
          {deals.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Още няма спечелена сделка за периода. Щом в картата се натисне „Спечелен“ със сумата, излиза тук.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/5">
              {deals.map((d) => (
                <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                  <span>
                    <b>{d.name}</b>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">
                      {" "}
                      · {fmtSofia(d.at)} · води {d.closer ?? "—"}
                      {d.setter && d.setter !== d.closer ? ` · уговори ${d.setter}` : ""}
                    </span>
                  </span>
                  <span className="font-semibold tabular-nums text-emerald-300">{d.value ? eur(d.value) : "без сума"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={card}>
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em]">⏳ В процес · оферта и преговори · {pipeline.length}</h2>
          {pipeline.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Няма отворени оферти.</p>
          ) : (
            <ul className="mt-2 divide-y divide-white/5">
              {pipeline.slice(0, 60).map((d) => (
                <li key={d.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2 text-sm">
                  <span>
                    <b>{d.name}</b>
                    <span className="text-[11px] text-[var(--color-text-tertiary)]">
                      {" "}
                      · {STAGE[d.stage] ?? d.stage} · {fmtSofia(d.at)} · води {d.closer ?? "—"}
                    </span>
                  </span>
                  <span className="tabular-nums text-[var(--color-text-secondary)]">{d.value ? eur(d.value) : "—"}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
