"use client";
import { useState } from "react";
import Link from "next/link";
import type { PaymentRow } from "@/lib/crm/types";
import {
  PAYMENT_MATCH_STATUS_LABEL,
  PAYMENT_MATCH_STATUS_COLOR,
  formatMoney,
  formatDate,
} from "@/lib/crm/labels";
import {
  recordPaymentAction,
  matchPaymentManualAction,
} from "@/app/admin/(protected)/accounting/actions";

export interface EnrichedPayment extends PaymentRow {
  contact_name?: string | null;
  invoice_number?: string | null;
}

export interface InvoiceOption {
  id: string;
  label: string;
}

const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function PaymentsManager({
  payments,
  openInvoices,
}: {
  payments: EnrichedPayment[];
  openInvoices: InvoiceOption[];
}) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {showCreate ? "✕ Затвори" : "+ Запиши плащане"}
        </button>
      </div>

      {showCreate && (
        <form action={recordPaymentAction} className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
          <h3 className="mb-3 font-display text-base font-semibold">Ново плащане</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Сума">
              <input name="amount" type="number" step="0.01" required className={inputCls} />
            </Field>
            <Field label="Валута">
              <input name="currency" defaultValue="EUR" className={inputCls} />
            </Field>
            <Field label="Платено на">
              <input name="paid_at" type="date" className={inputCls} />
            </Field>
            <Field label="Платец">
              <input name="counterparty_name" className={inputCls} />
            </Field>
            <Field label="Основание / реф.">
              <input name="reference" className={inputCls} />
            </Field>
            <Field label="Към фактура (по избор)">
              <select name="invoice_id" defaultValue="" className={inputCls}>
                <option value="">— без фактура —</option>
                {openInvoices.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
              Запиши
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
              Отказ
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {payments.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-[var(--color-border-default)] p-3"
            style={{ background: "rgba(13,18,33,0.4)" }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-medium text-[var(--color-text-primary)]">{formatMoney(p.amount, p.currency)}</span>
                <span className="ml-2 text-[11px] text-[var(--color-text-tertiary)]">
                  {formatDate(p.paid_at)}
                  {p.counterparty_name ? ` · ${p.counterparty_name}` : ""}
                  {p.contact_id && p.contact_name ? (
                    <>
                      {" · "}
                      <Link href={`/admin/clients/${p.contact_id}`} className="hover:text-[var(--color-accent-cyan)]">
                        {p.contact_name}
                      </Link>
                    </>
                  ) : null}
                  {p.invoice_number ? ` · 🧾 ${p.invoice_number}` : ""}
                </span>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  background: `${PAYMENT_MATCH_STATUS_COLOR[p.match_status]}22`,
                  color: PAYMENT_MATCH_STATUS_COLOR[p.match_status],
                }}
              >
                {PAYMENT_MATCH_STATUS_LABEL[p.match_status] ?? p.match_status}
              </span>
            </div>

            {(p.match_status === "unmatched" || p.match_status === "ambiguous") && openInvoices.length > 0 && (
              <form action={matchPaymentManualAction} className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/5 pt-2">
                <input type="hidden" name="payment_id" value={p.id} />
                <select name="invoice_id" required defaultValue="" className="max-w-[420px] flex-1 rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60">
                  <option value="" disabled>
                    Свържи с фактура…
                  </option>
                  {openInvoices.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <button type="submit" className="rounded-md border border-cyan-500/40 px-2.5 py-1 text-xs text-cyan-300 transition hover:bg-cyan-500/10">
                  🔗 Свържи и плати
                </button>
              </form>
            )}
          </div>
        ))}
        {payments.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
            Няма регистрирани плащания още. Hermes ще ги добавя от банковите извлечения и имейли.
          </p>
        )}
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
