"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { GpsDeviceRow, GpsEventRow } from "@/lib/crm/types";
import {
  GPS_STATUS_LABEL,
  GPS_STATUS_COLOR,
  GPS_EVENT_LABEL,
  formatMoney,
  formatDate,
} from "@/lib/crm/labels";
import {
  createGpsDeviceAction,
  logGpsEventAction,
  setGpsDeviceStatusAction,
} from "@/app/admin/(protected)/gps/actions";

export interface GpsDeviceWithContact extends GpsDeviceRow {
  contact_name?: string | null;
}

const STATUS_OPTIONS = Object.keys(GPS_STATUS_LABEL);
const EVENT_OPTIONS = Object.keys(GPS_EVENT_LABEL);
const inputCls =
  "w-full rounded-md border border-white/10 bg-black/30 px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-cyan)]/60";

export function GpsManager({
  devices,
  eventsByDevice,
}: {
  devices: GpsDeviceWithContact[];
  eventsByDevice: Record<string, GpsEventRow[]>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = devices.filter((d) => d.status === "active");
    return {
      total: devices.length,
      active: active.length,
      removed: devices.filter((d) => d.status === "removed").length,
      monthly: active.reduce((s, d) => s + (Number(d.monthly_fee) || 0), 0),
    };
  }, [devices]);

  return (
    <div>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Устройства" value={String(stats.total)} color="#06b6d4" />
        <Stat label="Активни" value={String(stats.active)} color="#22c55e" />
        <Stat label="Месечен оборот" value={formatMoney(stats.monthly)} color="#facc15" />
        <Stat label="Демонтирани" value={String(stats.removed)} color="#64748b" />
      </div>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setShowCreate((v) => !v)}
          className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
        >
          {showCreate ? "✕ Затвори" : "+ Ново устройство"}
        </button>
      </div>

      {showCreate && (
        <form action={createGpsDeviceAction} className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4">
          <h3 className="mb-3 font-display text-base font-semibold">Ново GPS устройство (монтаж)</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Клиент (имейл)"><input name="client_email" type="email" required className={inputCls} /></Field>
            <Field label="Рег. номер"><input name="vehicle_plate" placeholder="напр. CB1234AB" className={inputCls} /></Field>
            <Field label="Автомобил (модел)"><input name="vehicle_model" className={inputCls} /></Field>
            <Field label="IMEI / сериен №"><input name="imei" className={inputCls} /></Field>
            <Field label="SIM"><input name="sim" className={inputCls} /></Field>
            <Field label="Етикет"><input name="label" placeholder="напр. Камион 1" className={inputCls} /></Field>
            <Field label="Месечна такса"><input name="monthly_fee" type="number" step="0.01" className={inputCls} /></Field>
            <Field label="Валута"><input name="currency" defaultValue="EUR" className={inputCls} /></Field>
            <Field label="Дата на монтаж"><input name="installed_at" type="date" className={inputCls} /></Field>
            <Field label="Цена за монтаж"><input name="install_price" type="number" step="0.01" className={inputCls} /></Field>
            <Field label="Техник"><input name="technician" className={inputCls} /></Field>
            <Field label="Бележка"><input name="notes" className={inputCls} /></Field>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400">
              Запази + монтаж
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="rounded-md border border-white/10 px-4 py-2 text-sm text-[var(--color-text-tertiary)] transition hover:text-[var(--color-text-primary)]">
              Отказ
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {devices.map((d) => {
          const events = eventsByDevice[d.id] ?? [];
          const open = expanded === d.id;
          return (
            <div
              key={d.id}
              className="rounded-xl border p-4"
              style={{
                borderColor: d.status === "active" ? "var(--color-border-default)" : "rgba(100,116,139,0.4)",
                background: d.status === "active" ? "rgba(13,18,33,0.4)" : "rgba(100,116,139,0.06)",
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {d.vehicle_plate || d.label || "(устройство)"}
                    </span>
                    {d.contact_id && d.contact_name && (
                      <Link href={`/admin/clients/${d.contact_id}`} className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-accent-cyan)]">
                        {d.contact_name}
                      </Link>
                    )}
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: `${GPS_STATUS_COLOR[d.status]}22`, color: GPS_STATUS_COLOR[d.status] }}
                    >
                      {GPS_STATUS_LABEL[d.status] ?? d.status}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                    {formatMoney(d.monthly_fee, d.currency)}/мес
                    {d.imei ? ` · IMEI ${d.imei}` : ""}
                    {d.installed_at ? ` · монтаж ${formatDate(d.installed_at)}` : ""}
                    {d.vehicle_model ? ` · ${d.vehicle_model}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : d.id)}
                  className="rounded-md border border-white/10 px-3 py-1 text-xs text-[var(--color-text-secondary)] transition hover:border-[var(--color-accent-cyan)]/60"
                >
                  {open ? "Скрий" : `История (${events.length})`}
                </button>
              </div>

              {open && (
                <div className="mt-3 border-t border-white/5 pt-3">
                  {/* Event history */}
                  <ol className="mb-3 space-y-1">
                    {events.length === 0 && <li className="text-[11px] text-[var(--color-text-tertiary)]">Няма събития.</li>}
                    {events.map((e) => (
                      <li key={e.id} className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[var(--color-text-secondary)]">
                          {GPS_EVENT_LABEL[e.event_type] ?? e.event_type}
                        </span>
                        <span className="text-[var(--color-text-tertiary)]">{formatDate(e.event_date)}</span>
                        {e.event_type === "move" && (e.from_vehicle || e.to_vehicle) && (
                          <span className="text-[var(--color-text-secondary)]">{e.from_vehicle || "?"} → {e.to_vehicle || "?"}</span>
                        )}
                        {e.price != null && <span className="text-[var(--color-text-secondary)]">{formatMoney(e.price, e.currency)}</span>}
                        {e.technician && <span className="text-[var(--color-text-tertiary)]">· {e.technician}</span>}
                        {e.notes && <span className="text-[var(--color-text-tertiary)]">· {e.notes}</span>}
                      </li>
                    ))}
                  </ol>

                  {/* Log event */}
                  <form action={logGpsEventAction} className="flex flex-wrap items-end gap-2">
                    <input type="hidden" name="device_id" value={d.id} />
                    <FieldSm label="Събитие">
                      <select name="event_type" defaultValue="move" className={inputCls}>
                        {EVENT_OPTIONS.map((t) => (
                          <option key={t} value={t}>{GPS_EVENT_LABEL[t]}</option>
                        ))}
                      </select>
                    </FieldSm>
                    <FieldSm label="Дата"><input name="event_date" type="date" className={inputCls} /></FieldSm>
                    <FieldSm label="Към автомобил"><input name="to_vehicle" placeholder="нов рег. №" className={inputCls} /></FieldSm>
                    <FieldSm label="Цена"><input name="price" type="number" step="0.01" className={inputCls} /></FieldSm>
                    <FieldSm label="Техник"><input name="technician" className={inputCls} /></FieldSm>
                    <button type="submit" className="rounded-md border border-cyan-500/40 px-3 py-2 text-xs text-cyan-300 transition hover:bg-cyan-500/10">
                      Запиши събитие
                    </button>
                  </form>

                  {/* Quick status */}
                  <form action={setGpsDeviceStatusAction} className="mt-2 flex items-center gap-2">
                    <input type="hidden" name="device_id" value={d.id} />
                    <select
                      name="status"
                      defaultValue={d.status}
                      onChange={(e) => e.currentTarget.form?.requestSubmit()}
                      className="rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-[var(--color-text-primary)]"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{GPS_STATUS_LABEL[s]}</option>
                      ))}
                    </select>
                    <span className="text-[10px] text-[var(--color-text-tertiary)]">смени статус</span>
                  </form>
                </div>
              )}
            </div>
          );
        })}
        {devices.length === 0 && (
          <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-8 text-center text-sm text-[var(--color-text-tertiary)]">
            Няма GPS устройства още. Добави с „+ Ново устройство".
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-3">
      <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-1 text-lg font-bold" style={{ color }}>{value}</p>
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
function FieldSm({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block font-mono text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)]">{label}</span>
      <div className="w-32">{children}</div>
    </label>
  );
}
