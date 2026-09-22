"use client";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { addFinanceAction, deleteFinanceAction, importFinanceAction } from "@/app/admin/(protected)/lichni-finansi/actions";
import { PF_CATEGORY_LABEL, PF_EXPENSE_CATEGORIES, PF_INCOME_CATEGORIES, type PfKind } from "@/lib/crm/personal-finance";
import type { FinanceOverview } from "@/lib/crm/personal-finance-data";

const FIELD = "rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

function eur(n: number): string {
  return `${n.toLocaleString("bg-BG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })} €`;
}

function monthLabel(m: string): string {
  return new Date(`${m}-01T12:00:00Z`).toLocaleDateString("bg-BG", { month: "short", year: "2-digit" });
}

function Btn({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="rounded-md bg-[var(--color-accent-cyan)] px-4 py-2 text-sm font-bold text-[var(--color-bg-void)] disabled:opacity-50">
      {pending ? "…" : children}
    </button>
  );
}

export function PersonalFinanceManager({ data }: { data: FinanceOverview }) {
  const [kind, setKind] = useState<PfKind>("expense");
  const [add, addAct] = useActionState(addFinanceAction, null);
  const [imp, impAct] = useActionState(importFinanceAction, null);
  const current = data.personal[data.personal.length - 1];
  const company = data.company[data.company.length - 1];
  const max = Math.max(1, ...data.personal.map((m) => Math.max(m.income, m.expense)), ...data.company.map((m) => Math.max(m.received, m.expenses)));

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi label="Лични приходи · този месец" value={eur(current.income)} color="#22c55e" />
        <Kpi label="Лични разходи · този месец" value={eur(current.expense)} color="#fb923c" />
        <Kpi label="Остават ми" value={eur(current.net)} color={current.net >= 0 ? "#22c55e" : "#ef4444"} />
        <Kpi label="Фирмата · получени − разходи" value={eur(company.net)} color={company.net >= 0 ? "#06b6d4" : "#ef4444"} hint={`лични през фирмата: ${eur(company.personalViaCompany)}`} />
      </section>

      <section className="cc-panel p-5">
        <h2 className="font-display text-lg font-bold">Човек и фирма · последните {data.months.length} месеца</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <tr>
                <th className="pb-2 font-normal">Месец</th>
                <th className="pb-2 text-right font-normal">Лични приходи</th>
                <th className="pb-2 text-right font-normal">Лични разходи</th>
                <th className="pb-2 text-right font-normal">Остатък</th>
                <th className="pb-2 pl-6 text-right font-normal">Фирма · фактурирано</th>
                <th className="pb-2 text-right font-normal">получено</th>
                <th className="pb-2 text-right font-normal">разходи</th>
                <th className="pb-2 text-right font-normal">лични през фирмата</th>
                <th className="pb-2 text-right font-normal">резултат</th>
              </tr>
            </thead>
            <tbody>
              {data.months.map((m, i) => {
                const p = data.personal[i];
                const c = data.company[i];
                return (
                  <tr key={m} className="border-t border-white/5">
                    <td className="py-2">{monthLabel(m)}</td>
                    <td className="py-2 text-right font-mono text-emerald-300">{eur(p.income)}</td>
                    <td className="py-2 text-right font-mono text-orange-300">{eur(p.expense)}</td>
                    <td className="py-2 text-right font-mono">{eur(p.net)}</td>
                    <td className="py-2 pl-6 text-right font-mono">{eur(c.invoiced)}</td>
                    <td className="py-2 text-right font-mono text-emerald-300">{eur(c.received)}</td>
                    <td className="py-2 text-right font-mono text-orange-300">{eur(c.expenses)}</td>
                    <td className="py-2 text-right font-mono text-violet-300">{eur(c.personalViaCompany)}</td>
                    <td className="py-2 text-right font-mono">{eur(c.net)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-end gap-2" style={{ height: 80 }}>
          {data.months.map((m, i) => {
            const p = data.personal[i];
            const c = data.company[i];
            return (
              <div key={m} className="flex flex-1 items-end justify-center gap-[2px]" title={`${monthLabel(m)} · лични ${eur(p.income)} / ${eur(p.expense)} · фирма ${eur(c.received)} / ${eur(c.expenses)}`}>
                <div className="w-1/4 rounded-t-sm bg-emerald-400/70" style={{ height: `${Math.round((p.income / max) * 100)}%` }} />
                <div className="w-1/4 rounded-t-sm bg-orange-400/70" style={{ height: `${Math.round((p.expense / max) * 100)}%` }} />
                <div className="w-1/4 rounded-t-sm bg-cyan-400/70" style={{ height: `${Math.round((c.received / max) * 100)}%` }} />
                <div className="w-1/4 rounded-t-sm bg-rose-400/60" style={{ height: `${Math.round((c.expenses / max) * 100)}%` }} />
              </div>
            );
          })}
        </div>
        <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">зелено лични приходи · оранжево лични разходи · синьо фирма получено · червено фирма разходи</p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="cc-panel p-5">
          <h2 className="font-display text-lg font-bold">Нов запис</h2>
          <form action={addAct} className="mt-3 grid grid-cols-2 gap-2">
            <div className="col-span-2 flex gap-2">
              {(["expense", "income"] as PfKind[]).map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)} className={`rounded-full border px-3 py-1 text-xs ${kind === k ? "border-[var(--color-accent-cyan)] text-[var(--color-accent-cyan)]" : "border-white/10 text-[var(--color-text-secondary)]"}`}>
                  {k === "expense" ? "− разход" : "+ приход"}
                </button>
              ))}
              <input type="hidden" name="kind" value={kind} />
            </div>
            <input name="amount" inputMode="decimal" required placeholder="сума €" className={FIELD} />
            <input name="occurred_on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={FIELD} />
            <select name="category" className={FIELD}>
              {(kind === "income" ? PF_INCOME_CATEGORIES : PF_EXPENSE_CATEGORIES).map((c) => (
                <option key={c} value={c}>
                  {PF_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
            <input name="description" placeholder="за какво" className={FIELD} />
            <label className="col-span-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <input type="checkbox" name="recurring" value="1" /> всеки месец
            </label>
            <div className="col-span-2 flex items-center gap-2">
              <Btn>Запиши</Btn>
              {add && <span className={`text-xs ${add.ok ? "text-emerald-300" : "text-red-300"}`}>{add.message ?? add.error}</span>}
            </div>
          </form>
        </section>

        <section className="cc-panel p-5">
          <h2 className="font-display text-lg font-bold">Внос от бележките</h2>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Постави редовете както са си — по един на ред. Разбира „22.09.2026; наем; 450“, „+ заплата 2000 01.09“, „кола гориво 80“ (без дата = днес). Знак „+“ = приход.
          </p>
          <form action={impAct} className="mt-2 space-y-2">
            <textarea name="text" rows={8} placeholder={"наем 450 03.09.2026 всеки месец\n+ заплата 2000 01.09.2026 всеки месец\nхрана 120,50\n..."} className={`${FIELD} w-full font-mono text-xs`} />
            <div className="flex items-center gap-2">
              <Btn>Внеси</Btn>
              {imp && <span className={`text-xs ${imp.ok ? "text-emerald-300" : "text-red-300"}`}>{imp.message ?? imp.error}</span>}
            </div>
          </form>
        </section>
      </div>

      <section className="cc-panel p-5">
        <h2 className="font-display text-lg font-bold">По категории · този месец</h2>
        <ul className="mt-3 grid gap-1 sm:grid-cols-2">
          {current.byCategory.map((c) => (
            <li key={`${c.kind}:${c.category}`} className="flex justify-between text-sm">
              <span className={c.kind === "income" ? "text-emerald-300" : "text-[var(--color-text-secondary)]"}>
                {c.kind === "income" ? "+ " : "− "}
                {PF_CATEGORY_LABEL[c.category] ?? c.category}
              </span>
              <span className="font-mono">{eur(c.amount)}</span>
            </li>
          ))}
          {current.byCategory.length === 0 && <li className="text-sm text-[var(--color-text-tertiary)]">Още няма записи за месеца.</li>}
        </ul>
      </section>

      <section className="cc-panel overflow-x-auto p-5">
        <h2 className="font-display text-lg font-bold">Записи · {data.rows.length}</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className="pb-2 font-normal">Дата</th>
              <th className="pb-2 font-normal">Какво</th>
              <th className="pb-2 font-normal">Категория</th>
              <th className="pb-2 text-right font-normal">Сума</th>
              <th className="pb-2 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id} className="border-t border-white/5">
                <td className="py-1.5 text-xs text-[var(--color-text-tertiary)]">{r.occurred_on}</td>
                <td className="py-1.5">
                  {r.description ?? "—"}
                  {r.recurring && <span className="ml-1 text-[10px] text-[var(--color-text-tertiary)]">· месечно</span>}
                </td>
                <td className="py-1.5 text-xs text-[var(--color-text-secondary)]">{PF_CATEGORY_LABEL[r.category] ?? r.category}</td>
                <td className={`py-1.5 text-right font-mono ${r.kind === "income" ? "text-emerald-300" : "text-orange-300"}`}>
                  {r.kind === "income" ? "+" : "−"}
                  {eur(r.amount)}
                </td>
                <td className="py-1.5 text-right">
                  <form action={deleteFinanceAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <button type="submit" className="text-[11px] text-[var(--color-text-tertiary)] hover:text-red-300" title="Изтрий">
                      ✕
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {data.rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center text-sm text-[var(--color-text-tertiary)]">
                  Празно е. Добави първия запис или внеси от бележките.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Kpi({ label, value, color, hint }: { label: string; value: string; color: string; hint?: string }) {
  return (
    <div className="cc-panel p-4">
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</p>
      {hint && <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">{hint}</p>}
    </div>
  );
}
