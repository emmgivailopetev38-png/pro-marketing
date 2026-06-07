"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { InvoiceRow } from "@/lib/crm/types";
import {
  INVOICE_TYPE_LABEL,
  INVOICE_STATUS_LABEL,
  INVOICE_STATUS_COLOR,
  formatMoney,
  formatDate,
} from "@/lib/crm/labels";
import {
  createInvoiceAction,
  updateInvoiceStatusAction,
  recordPaymentAction,
} from "@/app/admin/(protected)/accounting/actions";

const INVOICE_TYPE_OPTIONS = Object.keys(INVOICE_TYPE_LABEL);
const INVOICE_STATUS_OPTIONS = Object.keys(INVOICE_STATUS_LABEL);
const UNPAID = ["sent", "awaiting_payment", "partially_paid", "overdue"];

type FilterKey =
  | "all"
  | "unpaid"
  | "awaiting"
  | "overdue"
  | "paid_month"
  | "proformas"
  | "gps"
  | "review";

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Всички" },
  { key: "unpaid", label: "Неплатени" },
  { key: "awaiting", label: "Чакат плащане" },
  { key: "overdue", label: "Просрочени" },
  { key: "paid_month", label: "Платени този месец" },
  { key: "proformas", label: "Проформи" },
  { key: "gps", label: "GPS" },
  { key: "review", label: "За проверка" },
];

function isThisMonth(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
}
function isOverdue(inv: InvoiceRow): boolean {
  if (inv.status === "overdue") return true;
  if (!inv.due_date) return false;
  return UNPAID.includes(inv.status) && new Date(inv.due_date) < new Date();
}
function matchesFilter(inv: InvoiceRow, f: FilterKey): boolean {
  switch (f) {
    case "unpaid":
      return UNPAID.includes(inv.status);
    case "awaiting":
      return inv.status === "awaiting_payment";
    case "overdue":
      return isOverdue(inv);
    case "paid_month":
      return inv.status === "paid" && isThisMonth(inv.updated_at);
    case "proformas":
      return inv.invoice_type === "proforma";
    case "gps":
      return inv.invoice_type === "gps_fee" || /gps/i.test(inv.service_type ?? "");
    case "review":
      return inv.contact_id == null || inv.status === "disputed";
    default:
      return true;
  }
}

const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function InvoicesTable({ rows }: { rows: InvoiceRow[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [payFor, setPayFor] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = {} as Record<FilterKey, number>;
    for (const f of FILTERS) c[f.key] = rows.filter((r) => matchesFilter(r, f.key)).length;
    return c;
  }, [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => matchesFilter(r, filter))
      .filter((r) => {
        if (!q) return true;
        return [r.invoice_number, r.client_name, r.client_email, r.service_type]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q));
      });
  }, [rows, filter, search]);

  const totalGross = visible.reduce((s, r) => s + (Number(r.amount_gross) || 0), 0);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Търси по номер, клиент, услуга…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[220px] flex-1 rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-deep)] px-4 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]"
        />
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {showCreate ? "✕ Затвори" : "+ Нова фактура"}
        </button>
      </div>

      {showCreate && <CreateInvoiceForm onClose={() => setShowCreate(false)} />}

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
            style={{
              borderColor: filter === f.key ? "var(--color-accent-cyan)" : "var(--color-border-default)",
              background: filter === f.key ? "rgba(0,212,255,0.10)" : "transparent",
              color: filter === f.key ? "var(--color-accent-cyan)" : "var(--color-text-secondary)",
            }}
          >
            {f.label}
            <span className="font-mono text-[10px] opacity-70">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      <div className="cc-panel overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[var(--color-bg-deep)] text-xs uppercase tracking-wider text-[var(--color-text-tertiary)]">
            <tr>
              <th className="px-4 py-3 font-medium">Номер · Клиент</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Издадена · Падеж</th>
              <th className="px-4 py-3 font-medium text-right">Сума</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-default)]">
            {visible.map((r) => (
              <RowGroup key={r.id} r={r} payOpen={payFor === r.id} onTogglePay={() => setPayFor(payFor === r.id ? null : r.id)} />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                  Няма фактури за този филтър.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
        Показани: {visible.length} от {rows.length} · сума: {formatMoney(totalGross)}
      </p>
    </div>
  );
}

function RowGroup({ r, payOpen, onTogglePay }: { r: InvoiceRow; payOpen: boolean; onTogglePay: () => void }) {
  return (
    <>
      <tr className="transition-colors hover:bg-[var(--color-bg-deep)]/40">
        <td className="px-4 py-3">
          <div className="font-mono text-xs text-[var(--color-text-primary)]">{r.invoice_number || "(без номер)"}</div>
          {r.contact_id ? (
            <Link
              href={`/admin/clients/${r.contact_id}`}
              className="text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-accent-cyan)]"
            >
              {r.client_name || r.client_email || "—"}
            </Link>
          ) : (
            <span className="text-xs text-amber-300/80" title="Не е свързана с контакт">
              {r.client_name || r.client_email || "— без контакт"}
            </span>
          )}
        </td>
        <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
          {INVOICE_TYPE_LABEL[r.invoice_type] ?? r.invoice_type}
        </td>
        <td className="px-4 py-3 text-xs text-[var(--color-text-tertiary)]">
          {formatDate(r.issue_date)}
          {r.due_date && <span className={isOverdue(r) ? "text-red-300" : ""}> → {formatDate(r.due_date)}</span>}
        </td>
        <td className="px-4 py-3 text-right font-medium text-[var(--color-text-primary)]">
          {formatMoney(r.amount_gross, r.currency)}
        </td>
        <td className="px-4 py-3">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
            style={{ background: `${INVOICE_STATUS_COLOR[r.status]}22`, color: INVOICE_STATUS_COLOR[r.status] }}
          >
            {INVOICE_STATUS_LABEL[r.status] ?? r.status}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <form action={updateInvoiceStatusAction} className="inline">
              <input type="hidden" name="invoice_id" value={r.id} />
              <select
                name="status"
                defaultValue={r.status}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60"
                title="Промени статус"
              >
                {INVOICE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {INVOICE_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </form>
            <button
              type="button"
              onClick={onTogglePay}
              className="rounded-md border border-emerald-500/40 px-2 py-1 text-[11px] text-emerald-300 transition hover:bg-emerald-500/10"
            >
              💰 Плащане
            </button>
          </div>
        </td>
      </tr>
      {payOpen && (
        <tr>
          <td colSpan={6} className="bg-black/30 px-4 py-3">
            <PaymentInlineForm invoice={r} />
          </td>
        </tr>
      )}
    </>
  );
}

function PaymentInlineForm({ invoice }: { invoice: InvoiceRow }) {
  return (
    <form action={recordPaymentAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="invoice_id" value={invoice.id} />
      <FieldInline label="Сума">
        <input name="amount" type="number" step="0.01" defaultValue={invoice.amount_gross ?? ""} required className={inputCls} />
      </FieldInline>
      <FieldInline label="Валута">
        <input name="currency" defaultValue={invoice.currency} className={inputCls} />
      </FieldInline>
      <FieldInline label="Платено на">
        <input name="paid_at" type="date" className={inputCls} />
      </FieldInline>
      <FieldInline label="Основание / реф.">
        <input name="reference" placeholder="напр. банков превод" className={inputCls} />
      </FieldInline>
      <button
        type="submit"
        className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
      >
        Запиши плащане
      </button>
      <p className="w-full text-[11px] text-[var(--color-text-tertiary)]">
        Ръчно плащане → маркира фактурата платена/частично платена веднага (ти решаваш, не Hermes).
      </p>
    </form>
  );
}

function CreateInvoiceForm({ onClose }: { onClose: () => void }) {
  return (
    <form
      action={createInvoiceAction}
      className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4"
    >
      <h3 className="mb-3 font-display text-base font-semibold">Нова фактура</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Клиент (име)">
          <input name="client_name" className={inputCls} />
        </Field>
        <Field label="Клиент (имейл) — свързва с контакт">
          <input name="client_email" type="email" className={inputCls} />
        </Field>
        <Field label="Номер">
          <input name="invoice_number" className={inputCls} />
        </Field>
        <Field label="Тип">
          <select name="invoice_type" defaultValue="invoice" className={inputCls}>
            {INVOICE_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {INVOICE_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Издадена">
          <input name="issue_date" type="date" className={inputCls} />
        </Field>
        <Field label="Падеж">
          <input name="due_date" type="date" className={inputCls} />
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
        <Field label="Услуга">
          <input name="service_type" placeholder="напр. GPS месечен" className={inputCls} />
        </Field>
        <Field label="Статус">
          <select name="status" defaultValue="awaiting_payment" className={inputCls}>
            {INVOICE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {INVOICE_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
          Запази фактура
        </button>
        <button type="button" onClick={onClose} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
          Отказ
        </button>
      </div>
    </form>
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
function FieldInline({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</span>
      <div className="w-36">{children}</div>
    </label>
  );
}
