"use client";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { manualCommissionAction, runMonthlyAction, setCommissionStatusAction, updateRuleAction } from "@/app/admin/(protected)/komisioni/actions";
import type { CommissionRow } from "@/lib/team/commissions";
import { COMMISSION_STATUS_COLOR, COMMISSION_STATUS_LABEL, type CommissionRule } from "@/lib/team/commissions-rules";
import { SERVICE_TYPES, SERVICE_TYPE_LABEL } from "@/lib/team/service-types";
import { TEAM_ROLE_SHORT, type TeamRole } from "@/lib/team/types";

const FIELD = "rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

function Btn({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-bold text-[var(--color-bg-void)] disabled:opacity-50">
      {pending ? "…" : children}
    </button>
  );
}

export function CommissionsManager({
  rows,
  rules,
  members,
  currentPeriod,
}: {
  rows: CommissionRow[];
  rules: CommissionRule[];
  members: Array<{ id: string; name: string; role: TeamRole; totals: { due: number; approved: number; paid: number; total: number } }>;
  currentPeriod: string;
}) {
  const [manual, manualAct] = useActionState(manualCommissionAction, null);
  const [monthly, monthlyAct] = useActionState(runMonthlyAction, null);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 md:grid-cols-3">
        {members.map((m) => (
          <div key={m.id} className="cc-panel p-4">
            <p className="font-semibold">
              {m.name} <span className="text-[11px] text-[var(--color-text-tertiary)]">· {TEAM_ROLE_SHORT[m.role]}</span>
            </p>
            <p className="mt-1 text-sm">
              <span className="text-amber-300">{m.totals.due.toLocaleString("bg-BG")} € дължими</span> · <span className="text-cyan-300">{m.totals.approved.toLocaleString("bg-BG")} € одобрени</span> ·{" "}
              <span className="text-emerald-300">{m.totals.paid.toLocaleString("bg-BG")} € платени</span>
            </p>
          </div>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cc-panel p-5">
          <h2 className="font-display text-lg font-bold">Правилата</h2>
          <ul className="mt-3 space-y-2">
            {rules.map((r) => (
              <li key={r.id}>
                <form action={updateRuleAction} className="flex flex-wrap items-center gap-2 text-sm">
                  <input type="hidden" name="id" value={r.id} />
                  <span className="min-w-[220px] flex-1">
                    {SERVICE_TYPE_LABEL[r.service_type as keyof typeof SERVICE_TYPE_LABEL] ?? r.service_type}
                    <span className="block text-[11px] text-[var(--color-text-tertiary)]">{r.basis === "monthly_fee" ? "от месечната такса" : "на затворена сделка"}{r.role ? ` · само ${TEAM_ROLE_SHORT[r.role as TeamRole] ?? r.role}` : ""}</span>
                  </span>
                  <input name="value" defaultValue={r.value} className={`${FIELD} w-20 text-right`} />
                  <span className="text-xs text-[var(--color-text-tertiary)]">{r.kind === "percent" ? "%" : "€"}</span>
                  <label className="flex items-center gap-1 text-xs">
                    <input type="hidden" name="active" value="0" />
                    <input type="checkbox" name="active" value="1" defaultChecked={r.active} /> активно
                  </label>
                  <button type="submit" className="rounded-md border border-white/10 px-2 py-1 text-xs text-[var(--color-text-secondary)]">
                    запази
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>

        <section className="cc-panel space-y-4 p-5">
          <div>
            <h2 className="font-display text-lg font-bold">Месечните · реклами и поддръжка</h2>
            <p className="text-xs text-[var(--color-text-secondary)]">За всеки клиент с активен абонамент и отговорник по картона — 10 % за месеца. Може да се пуска пак; не дублира.</p>
            <form action={monthlyAct} className="mt-2 flex items-center gap-2">
              <input name="period" defaultValue={currentPeriod} className={`${FIELD} w-28`} />
              <Btn>Начисли месеца</Btn>
              {monthly && <span className={`text-xs ${monthly.ok ? "text-emerald-300" : "text-red-300"}`}>{monthly.message ?? monthly.error}</span>}
            </form>
          </div>
          <div>
            <h2 className="font-display text-lg font-bold">Ръчно начисление</h2>
            <form action={manualAct} className="mt-2 grid grid-cols-2 gap-2">
              <select name="member_id" required className={FIELD}>
                <option value="">кой</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <select name="service_type" defaultValue="other" className={FIELD}>
                {SERVICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {SERVICE_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
              <input name="amount" placeholder="сума €" inputMode="decimal" required className={FIELD} />
              <input name="period" placeholder="месец (2026-09) — ако е месечна" className={FIELD} />
              <input name="label" placeholder="за какво" className={`${FIELD} col-span-2`} />
              <input name="contact_id" placeholder="id на картона (по желание)" className={`${FIELD} col-span-2`} />
              <div className="col-span-2 flex items-center gap-2">
                <Btn>Начисли</Btn>
                {manual && <span className={`text-xs ${manual.ok ? "text-emerald-300" : "text-red-300"}`}>{manual.message ?? manual.error}</span>}
              </div>
            </form>
          </div>
        </section>
      </div>

      <section className="cc-panel overflow-x-auto p-5">
        <h2 className="font-display text-lg font-bold">Начисления · {rows.length}</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className="pb-2 font-normal">Кой</th>
              <th className="pb-2 font-normal">Клиент</th>
              <th className="pb-2 font-normal">За какво</th>
              <th className="pb-2 text-right font-normal">Основа</th>
              <th className="pb-2 text-right font-normal">Сума</th>
              <th className="pb-2 font-normal">Кога</th>
              <th className="pb-2 font-normal">Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const color = COMMISSION_STATUS_COLOR[r.status] ?? "#7da8cc";
              return (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="py-2">{r.member_name}</td>
                  <td className="py-2">{r.contact_id ? <Link href={`/admin/clients/${r.contact_id}`} className="hover:text-[var(--color-accent-cyan)]">{r.contact_name ?? "—"}</Link> : "—"}</td>
                  <td className="py-2 text-xs">
                    {r.label}
                    {r.period ? ` · ${r.period}` : ""}
                    {r.note ? <span className="block text-[11px] text-[var(--color-text-tertiary)]">{r.note}</span> : null}
                  </td>
                  <td className="py-2 text-right font-mono text-[var(--color-text-tertiary)]">{r.base_amount != null ? `${Number(r.base_amount).toLocaleString("bg-BG")} €` : "—"}</td>
                  <td className="py-2 text-right font-mono font-semibold">{Number(r.amount).toLocaleString("bg-BG")} €</td>
                  <td className="py-2 text-xs text-[var(--color-text-tertiary)]">{new Date(r.created_at).toLocaleDateString("bg-BG")}</td>
                  <td className="py-2">
                    <form action={setCommissionStatusAction} className="inline">
                      <input type="hidden" name="id" value={r.id} />
                      <select
                        name="status"
                        defaultValue={r.status}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="rounded-md border px-2 py-1 text-[11px] outline-none"
                        style={{ background: `${color}1a`, color, borderColor: `${color}55` }}
                      >
                        {Object.entries(COMMISSION_STATUS_LABEL).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </form>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
                  Още няма начисления. Идват сами при „Спечелен“ от продавача или с бутона за месеца.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
