"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { OfferRow } from "@/lib/crm/types";
import { OFFER_STATUS_LABEL, OFFER_STATUS_COLOR, formatMoney, formatDate } from "@/lib/crm/labels";
import { createOfferAction, setOfferStatusAction } from "@/app/admin/(protected)/offers/actions";

export type ContactLite = { id: string; full_name: string | null; email: string | null; company: string | null };

const STATUS_OPTIONS = Object.keys(OFFER_STATUS_LABEL);
const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function OffersManager({ rows, contacts }: { rows: OfferRow[]; contacts: ContactLite[] }) {
  const [showCreate, setShowCreate] = useState(false);
  const contactsById = useMemo(() => new Map(contacts.map((c) => [c.id, c])), [contacts]);

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {showCreate ? "✕ Затвори" : "+ Нова оферта"}
        </button>
      </div>

      {showCreate && (
        <form action={createOfferAction} className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
          <h3 className="mb-3 font-display text-base font-semibold">Нова оферта</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Заглавие *">
              <input name="title" required className={inputCls} />
            </Field>
            <Field label="Имейл на клиента">
              <input name="client_email" type="email" list="offer-contact-emails" className={inputCls} />
            </Field>
            <Field label="Линк към офертата">
              <input name="url" placeholder="https://promarketing.pw/oferta/..." className={inputCls} />
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
            <Field label="Валидна до">
              <input name="valid_until" type="date" className={inputCls} />
            </Field>
            <Field label="Бележка">
              <input name="notes" className={inputCls} />
            </Field>
          </div>
          <datalist id="offer-contact-emails">
            {contacts.filter((c) => c.email).map((c) => (
              <option key={c.id} value={c.email!}>
                {c.full_name ?? c.company ?? c.email}
              </option>
            ))}
          </datalist>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
              Запази оферта
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
              <th className="px-4 py-3 font-medium">Оферта · Клиент</th>
              <th className="px-4 py-3 font-medium text-right">Сума</th>
              <th className="px-4 py-3 font-medium">Валидна до</th>
              <th className="px-4 py-3 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-default)]">
            {rows.map((o) => {
              const c = o.contact_id ? contactsById.get(o.contact_id) : undefined;
              return (
                <tr key={o.id} className="transition-colors hover:bg-[var(--color-bg-deep)]/40">
                  <td className="px-4 py-3">
                    <div className="text-[var(--color-text-primary)]">
                      {o.url ? (
                        <a href={o.url} target="_blank" rel="noreferrer" className="hover:text-[var(--color-accent-cyan)]">
                          {o.title} ↗
                        </a>
                      ) : (
                        o.title
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-tertiary)]">
                      {c ? (
                        <Link href={`/admin/clients/${c.id}`} className="hover:text-[var(--color-accent-cyan)]">
                          {c.full_name ?? c.company ?? c.email}
                        </Link>
                      ) : (
                        "— без контакт"
                      )}
                      {o.sent_at ? ` · изпратена ${formatDate(o.sent_at)}` : ""}
                      {o.accepted_at ? ` · приета ${formatDate(o.accepted_at)}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[var(--color-text-primary)]">
                    {formatMoney(o.amount_gross, o.currency)}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--color-text-tertiary)]">{formatDate(o.valid_until)}</td>
                  <td className="px-4 py-3">
                    <form action={setOfferStatusAction} className="inline">
                      <input type="hidden" name="offer_id" value={o.id} />
                      <select
                        name="status"
                        defaultValue={o.status}
                        onChange={(e) => e.currentTarget.form?.requestSubmit()}
                        className="rounded-md border px-2 py-1 text-[11px] outline-none"
                        style={{
                          background: `${OFFER_STATUS_COLOR[o.status]}1a`,
                          color: OFFER_STATUS_COLOR[o.status],
                          borderColor: `${OFFER_STATUS_COLOR[o.status]}55`,
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {OFFER_STATUS_LABEL[s]}
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
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-[var(--color-text-tertiary)]">
                  {'Няма оферти още. Добави с „+ Нова оферта" — при „Приета" проектът се създава сам.'}
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
