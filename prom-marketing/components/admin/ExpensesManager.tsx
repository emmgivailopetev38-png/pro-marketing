"use client";
import { useMemo, useState } from "react";
import type { ExpenseRow } from "@/lib/crm/types";
import {
  EXPENSE_CATEGORY_LABEL,
  EXPENSE_STATUS_LABEL,
  EXPENSE_STATUS_COLOR,
  formatMoney,
  formatDate,
} from "@/lib/crm/labels";
import { createExpenseAction, setExpenseStatusAction } from "@/app/admin/(protected)/accounting/actions";

const CATEGORY_OPTIONS = Object.keys(EXPENSE_CATEGORY_LABEL);
const STATUS_OPTIONS = Object.keys(EXPENSE_STATUS_LABEL);
const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function ExpensesManager({ rows }: { rows: ExpenseRow[] }) {
  const [showCreate, setShowCreate] = useState(false);

  const unpaidTotal = useMemo(
    () =>
      rows
        .filter((r) => r.status === "unpaid" || r.status === "partially_paid")
        .reduce((s, r) => s + (Number(r.amount_gross) || 0), 0),
    [rows]
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-text-tertiary)]">
          Неплатени разходи: <span className="font-medium text-amber-300">{formatMoney(unpaidTotal)}</span>
        </p>
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {showCreate ? "✕ Затвори" : "+ Нов разход"}
        </button>
      </div>

      {showCreate && (
        <form action={createExpenseAction} className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
          <h3 className="mb-3 font-display text-base font-semibold">Нов разход</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Доставчик">
              <input name="supplier_name" className={inputCls} />
            </Field>
            <Field label="Категория">
              <select name="category" defaultValue="other" className={inputCls}>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {EXPENSE_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Номер на фактура">
              <input name="invoice_number" className={inputCls} />
            </Field>
            <Field label="Нето">
              <input name="amount_net" type="number" step="0.01" className={inputCls} />
            </Field>
            <Field label="ДДС">
              <input name="vat_amount" type="number" step="0.01" className={inputCls} />
            </Field>
            <Field label="Бруто (общо)">
              <input name="amount_gross" type="number" step="0.01" className={inputCls} />
            </Field>
            <Field label="Валута">
              <input name="currency" defaultValue="EUR" className={inputCls} />
            </Field>
            <Field label="Дата">
              <input name="expense_date" type="date" className={inputCls} />
            </Field>
            <Field label="Падеж">
              <input name="due_date" type="date" className={inputCls} />
            </Field>
            <Field label="Статус">
              <select name="status" defaultValue="unpaid" className={inputCls}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {EXPENSE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Бележка">
              <input name="description" className={inputCls} />
            </Field>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
              Запази разход
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
              Отказ
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-[var(--color-border-default)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-deep)] text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Доставчик · Категория</th>
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium text-right">Сума</th>
              <th className="px-4 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-default)]">
            {rows.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-[var(--color-bg-deep)]/40">
                <td className="px-4 py-3">
                  <div className="text-[var(--color-text-primary)]">{r.supplier_name || "—"}</div>
                  <div className="text-[11px] text-[var(--color-text-tertiary)]">
                    {EXPENSE_CATEGORY_LABEL[r.category] ?? r.category}
                    {r.invoice_number ? ` · ${r.invoice_number}` : ""}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-[var(--color-text-tertiary)]">{formatDate(r.expense_date)}</td>
                <td className="px-4 py-3 text-right font-medium text-[var(--color-text-primary)]">
                  {formatMoney(r.amount_gross, r.currency)}
                </td>
                <td className="px-4 py-3">
                  <form action={setExpenseStatusAction} className="inline">
                    <input type="hidden" name="expense_id" value={r.id} />
                    <select
                      name="status"
                      defaultValue={r.status}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="rounded-md border px-2 py-1 text-[11px] outline-none"
                      style={{
                        background: `${EXPENSE_STATUS_COLOR[r.status]}1a`,
                        color: EXPENSE_STATUS_COLOR[r.status],
                        borderColor: `${EXPENSE_STATUS_COLOR[r.status]}55`,
                      }}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {EXPENSE_STATUS_LABEL[s]}
                        </option>
                      ))}
                    </select>
                  </form>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                  Няма разходи още. Hermes ще добавя от фактурите на доставчиците, или добави ръчно с „+ Нов разход".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</span>
      {children}
    </label>
  );
}
