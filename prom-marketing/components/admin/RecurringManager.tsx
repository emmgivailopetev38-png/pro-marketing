"use client";
import { useState } from "react";
import Link from "next/link";
import type { RecurringServiceRow } from "@/lib/crm/types";
import { RECURRING_SERVICE_TYPE_LABEL, formatMoney } from "@/lib/crm/labels";
import {
  upsertRecurringServiceAction,
  toggleRecurringAction,
} from "@/app/admin/(protected)/accounting/actions";

export interface EnrichedService extends RecurringServiceRow {
  contact_name?: string | null;
}

const SERVICE_OPTIONS = Object.keys(RECURRING_SERVICE_TYPE_LABEL);
const BILLING_LABEL: Record<string, string> = {
  monthly: "месечно",
  yearly: "годишно",
  one_time: "еднократно",
};
const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function RecurringManager({ services }: { services: EnrichedService[] }) {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {showCreate ? "✕ Затвори" : "+ Нов абонамент"}
        </button>
      </div>

      {showCreate && (
        <form action={upsertRecurringServiceAction} className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
          <h3 className="mb-3 font-display text-base font-semibold">Нов абонамент</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Контакт (имейл)">
              <input name="client_email" type="email" required className={inputCls} />
            </Field>
            <Field label="Услуга">
              <select name="service_type" defaultValue="gps" className={inputCls}>
                {SERVICE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {RECURRING_SERVICE_TYPE_LABEL[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Сума">
              <input name="amount" type="number" step="0.01" className={inputCls} />
            </Field>
            <Field label="Валута">
              <input name="currency" defaultValue="EUR" className={inputCls} />
            </Field>
            <Field label="Период">
              <select name="billing_period" defaultValue="monthly" className={inputCls}>
                <option value="monthly">месечно</option>
                <option value="yearly">годишно</option>
                <option value="one_time">еднократно</option>
              </select>
            </Field>
            <Field label="Ден за фактуриране (1–31)">
              <input name="billing_day" type="number" min={1} max={31} className={inputCls} />
            </Field>
            <Field label="Започнал на">
              <input name="started_at" type="date" className={inputCls} />
            </Field>
            <Field label="Бележки">
              <input name="notes" className={inputCls} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm text-[var(--color-text-secondary)]">
              <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
              Активен
            </label>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
              Запази
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
              Отказ
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {services.map((s) => (
          <div
            key={s.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
            style={{
              borderColor: s.active ? "var(--color-border-default)" : "rgba(100,116,139,0.4)",
              background: s.active ? "rgba(13,18,33,0.4)" : "rgba(100,116,139,0.06)",
            }}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-500/15 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                  {RECURRING_SERVICE_TYPE_LABEL[s.service_type] ?? s.service_type}
                </span>
                {s.contact_id && s.contact_name && (
                  <Link href={`/admin/clients/${s.contact_id}`} className="font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent-cyan)]">
                    {s.contact_name}
                  </Link>
                )}
                {!s.active && <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-tertiary)]">спрян</span>}
              </div>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                {formatMoney(s.amount, s.currency)} · {BILLING_LABEL[s.billing_period] ?? s.billing_period}
                {s.billing_day ? ` · ден ${s.billing_day}` : ""}
                {s.excluded_reason ? ` · ${s.excluded_reason}` : ""}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ToggleButton
                id={s.id}
                field="active"
                value={!s.active}
                className={s.active ? "border-emerald-500/40 text-emerald-300" : "border-white/10 text-[var(--color-text-tertiary)]"}
              >
                {s.active ? "Активен" : "Спрян"}
              </ToggleButton>
              <ToggleButton
                id={s.id}
                field="excluded_from_auto_send"
                value={!s.excluded_from_auto_send}
                className={
                  s.excluded_from_auto_send
                    ? "border-red-500/40 text-red-300"
                    : "border-emerald-500/40 text-emerald-300"
                }
              >
                {s.excluded_from_auto_send ? "Авто-фактури: ИЗКЛ" : "Авто-фактури: ВКЛ"}
              </ToggleButton>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
            {'Няма абонаменти още. Добави GPS/CRM клиент с „+ Нов абонамент".'}
          </p>
        )}
      </div>
    </div>
  );
}

function ToggleButton({
  id,
  field,
  value,
  className,
  children,
}: {
  id: string;
  field: string;
  value: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <form action={toggleRecurringAction} className="inline">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(value)} />
      <button type="submit" className={`rounded-md border px-2.5 py-1 text-[11px] transition-colors hover:bg-white/5 ${className ?? ""}`}>
        {children}
      </button>
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
