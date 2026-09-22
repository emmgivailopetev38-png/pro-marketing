import { redirect } from "next/navigation";
import { getTeamActor } from "@/lib/team/session";
import { allowed, ekipNav } from "@/lib/team/nav";
import { homeFor } from "@/lib/team/roles";
import { listCommissions, loadRules, totals } from "@/lib/team/commissions";
import { COMMISSION_STATUS_COLOR, COMMISSION_STATUS_LABEL } from "@/lib/team/commissions-rules";
import { EkipHeader } from "@/components/ekip/EkipHeader";

export const dynamic = "force-dynamic";

/** „Комисионни“ — какво ми се дължи, какво е платено, по какви правила. */
export default async function KomisioniPage() {
  const actor = await getTeamActor();
  if (!actor) redirect("/ekip/login");
  if (!allowed(actor, "komisioni")) redirect(homeFor(actor.member));
  const [nav, rows, rules] = await Promise.all([ekipNav(actor), listCommissions(actor.member?.id ?? null), loadRules()]);
  const t = totals(rows);

  return (
    <div className="mx-auto max-w-2xl pb-24">
      <EkipHeader name={actor.name} isOwner={actor.kind === "owner"} nav={nav.items} section="komisioni" unread={nav.unread} />
      <main className="space-y-6 px-4 py-4">
        <section className="grid grid-cols-3 gap-2 text-center">
          <Stat label="дължими" value={`${t.due.toLocaleString("bg-BG")} €`} color="rgb(252 211 77)" />
          <Stat label="одобрени" value={`${t.approved.toLocaleString("bg-BG")} €`} color="var(--color-accent-cyan)" />
          <Stat label="платени" value={`${t.paid.toLocaleString("bg-BG")} €`} color="rgb(110 231 183)" />
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-text-tertiary)]">Правилата</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {rules
              .filter((r) => r.active)
              .map((r) => (
                <li key={r.id}>• {r.label}</li>
              ))}
          </ul>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            Еднократните се начисляват, когато отбележиш „Спечелен“ с вида услуга. Месечните — на първо число, за всеки клиент, който плаща.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--color-accent-cyan)]">Начисления · {rows.length}</h2>
          {rows.length === 0 ? (
            <p className="rounded-2xl border border-white/10 p-6 text-center text-sm text-[var(--color-text-secondary)]">Още няма. Първата идва с първия спечелен клиент.</p>
          ) : (
            <ul className="divide-y divide-white/5 rounded-2xl border border-white/10">
              {rows.map((r) => {
                const color = COMMISSION_STATUS_COLOR[r.status] ?? "#7da8cc";
                return (
                  <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-3 px-4 py-2 text-sm">
                    <span className="min-w-0 flex-1">
                      <span className="font-medium">{r.contact_name ?? "—"}</span>
                      <span className="block text-[11px] text-[var(--color-text-tertiary)]">
                        {r.label}
                        {r.period ? ` · ${r.period}` : ""} · {new Date(r.created_at).toLocaleDateString("bg-BG")}
                      </span>
                    </span>
                    <span className="font-mono font-semibold">{Number(r.amount).toLocaleString("bg-BG")} €</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${color}1a`, color, border: `1px solid ${color}55` }}>
                      {COMMISSION_STATUS_LABEL[r.status] ?? r.status}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-1 py-3">
      <p className="text-lg font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase leading-tight tracking-[0.12em] text-[var(--color-text-tertiary)]">{label}</p>
    </div>
  );
}
