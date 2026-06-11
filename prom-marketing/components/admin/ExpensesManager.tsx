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

type ViewKey = "all" | "business" | "personal";

const VIEW_TABS: Array<{ key: ViewKey; label: string }> = [
  { key: "all", label: "Всички" },
  { key: "business", label: "Бизнес" },
  { key: "personal", label: "💼 Лични" },
];

export function ExpensesManager({ rows, initialView = "all" }: { rows: ExpenseRow[]; initialView?: ViewKey }) {
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<ViewKey>(initialView);

  const visible = useMemo(() => {
    if (view === "personal") return rows.filter((r) => r.is_personal);
    if (view === "business") return rows.filter((r) => !r.is_personal);
    return rows;
  }, [rows, view]);

  const unpaidTotal = useMemo(
    () =>
      rows
        .filter((r) => !r.is_personal && (r.status === "unpaid" || r.status === "partially_paid"))
        .reduce((s, r) => s + (Number(r.amount_gross) || 0), 0),
    [rows]
  );
  const personalTotal = useMemo(
    () =>
      rows
        .filter((r) => r.is_personal && r.status !== "cancelled")
        .reduce((s, r) => s + (Number(r.amount_gross) || 0), 0),
    [rows]
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {VIEW_TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setView(t.key)}
                className={
                  view === t.key
                    ? "rounded-lg border border-[var(--color-accent-cyan)]/60 bg-[var(--color-accent-cyan)]/15 px-3 py-1.5 text-xs font-semibold text-[var(--color-accent-cyan)]"
                    : "rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)]"
                }
              >
                {t.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Неплатени (бизнес): <span className="font-medium text-amber-300">{formatMoney(unpaidTotal)}</span>
            {personalTotal > 0 && (
              <>
                {" · "}Лични: <span className="font-medium text-violet-300">{formatMoney(personalTotal)}</span>
              </>
            )}
          </p>
        </div>
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
            <Field label="Платено с">
              <input name="paid_by" placeholder="карта / банка / кеш" className={inputCls} />
            </Field>
          </div>
          <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-lg border border-violet-500/30 bg-violet-500/[0.06] px-3 py-2.5 text-sm text-violet-200">
            <input type="checkbox" name="is_personal" className="h-4 w-4 accent-violet-400" />
            <span>
              💼 <b>Лична покупка</b> — на собственика, през фирмата. Не влиза в печалбата и не дава приспадаемо ДДС.
            </span>
          </label>
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

      <div className="cc-panel overflow-x-auto">
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
            {visible.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-[var(--color-bg-deep)]/40">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)]">
                    <span>{r.supplier_name || "—"}</span>
                    {r.is_personal && (
                      <span className="rounded-full border border-violet-500/40 bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-300">
                        💼 лична
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[var(--color-text-tertiary)]">
                    {EXPENSE_CATEGORY_LABEL[r.category] ?? r.category}
                    {r.invoice_number ? ` · ${r.invoice_number}` : ""}
                    {r.paid_by ? ` · ${r.paid_by}` : ""}
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
            {visible.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                  {view === "personal"
                    ? 'Няма лични покупки. Добави с „+ Нов разход" и чекни „Лична покупка".'
                    : 'Няма разходи още. Hermes ще добавя от фактурите на доставчиците, или добави ръчно с „+ Нов разход".'}
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
