import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import type { GpsDeviceRow, GpsEventRow, InvoiceRow } from "@/lib/crm/types";
import { GpsManager, type GpsDeviceWithContact } from "@/components/admin/GpsManager";
import { KpiCard } from "@/components/admin/KpiCard";
import { INVOICE_STATUS_COLOR, INVOICE_STATUS_LABEL, formatDate, formatMoney } from "@/lib/crm/labels";

export const dynamic = "force-dynamic";

const REVENUE_EXCLUDED = new Set(["draft", "cancelled", "excluded"]);
const OPEN_INVOICE = new Set(["sent", "awaiting_payment", "partially_paid", "overdue"]);

export default async function GpsPage() {
  const sb = createServiceClient();
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const startOfYearDate = startOfYear.toISOString().slice(0, 10);
  const [{ data: dev }, { data: evt }, { data: inv }, { data: rec }] = await Promise.all([
    sb.from("gps_devices").select("*").order("created_at", { ascending: false }),
    sb.from("gps_events").select("*").order("created_at", { ascending: false }),
    sb
      .from("invoices")
      .select("*")
      .gte("issue_date", startOfYearDate)
      .or("invoice_type.eq.gps_fee,service_type.ilike.%GPS%")
      .order("issue_date", { ascending: false }),
    sb.from("recurring_services").select("service_type, active, excluded_from_auto_send, amount, currency, billing_period"),
  ]);
  const devices = (dev ?? []) as GpsDeviceRow[];
  const events = (evt ?? []) as GpsEventRow[];
  const gpsInvoices = (inv ?? []) as InvoiceRow[];
  const recurring = (rec ?? []) as Array<{ service_type: string; active: boolean; excluded_from_auto_send: boolean; amount: number | null; currency: string | null; billing_period: string | null }>;

  const activeGpsInvoices = gpsInvoices.filter((i) => !REVENUE_EXCLUDED.has(i.status));
  const openGpsInvoices = activeGpsInvoices.filter((i) => OPEN_INVOICE.has(i.status));
  const gpsRevenueYtd = activeGpsInvoices.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const gpsOpenTotal = openGpsInvoices.reduce((s, i) => s + (Number(i.amount_gross) || 0), 0);
  const gpsDrafts = gpsInvoices.filter((i) => i.status === "draft").length;
  const activeDevices = devices.filter((d) => d.status === "active");
  const gpsMrrFromDevices = activeDevices.reduce((s, d) => s + (Number(d.monthly_fee) || 0), 0);
  const gpsSubscriptions = recurring.filter((r) => r.service_type === "gps" && r.active && !r.excluded_from_auto_send);
  const gpsMrrFromSubscriptions = gpsSubscriptions.reduce((s, r) => s + (Number(r.amount) || 0), 0);

  const contactIds = Array.from(new Set([...devices.map((d) => d.contact_id), ...gpsInvoices.map((i) => i.contact_id)].filter(Boolean))) as string[];
  const { data: contacts } = contactIds.length
    ? await sb.from("contacts").select("id, full_name, email, company").in("id", contactIds)
    : { data: [] as Array<{ id: string; full_name: string | null; email: string | null; company: string | null }> };
  const contactName = new Map((contacts ?? []).map((c) => [c.id, c.company || c.full_name || c.email || "клиент"]));

  const withContact: GpsDeviceWithContact[] = devices.map((d) => ({
    ...d,
    contact_name: d.contact_id ? contactName.get(d.contact_id) ?? null : null,
  }));

  const eventsByDevice: Record<string, GpsEventRow[]> = {};
  for (const e of events) {
    (eventsByDevice[e.device_id] ??= []).push(e);
  }

  return (
    <div className="space-y-6 p-6 md:p-10">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-accent-cyan)]">
          ProMarketing · Операции
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold">GPS устройства</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Устройства по клиент и автомобил, с история на монтаж/демонтаж/преместване.
        </p>
      </header>

      <p className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
        💡 Това е операционният регистър (отделно от продажбите). Месечното фактуриране е в „Абонаменти". Приключени клиенти (напр. Borima Trans) → сложи устройствата „Демонтирано" и абонамента „Авто-фактури: ИЗКЛ".
      </p>

      <section>
        <h2 className="mb-3 font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
          {`GPS от 01.01.${now.getFullYear()} до днес`}
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
          <KpiCard label="GPS фактури YTD" value={activeGpsInvoices.length} hint={formatMoney(gpsRevenueYtd)} color="#06b6d4" href="/admin/invoices" />
          <KpiCard label="Чакат плащане" value={openGpsInvoices.length} hint={formatMoney(gpsOpenTotal)} color={openGpsInvoices.length > 0 ? "#facc15" : "#22c55e"} href="/admin/invoices" />
          <KpiCard label="GPS устройства" value={devices.length} hint={`${activeDevices.length} активни`} color="#14b8a6" />
          <KpiCard label="GPS MRR" value={formatMoney(gpsMrrFromDevices + gpsMrrFromSubscriptions)} hint={`устройства ${formatMoney(gpsMrrFromDevices)} · абонаменти ${formatMoney(gpsMrrFromSubscriptions)}`} color="#22c55e" href="/admin/recurring" />
          <KpiCard label="Чернови" value={gpsDrafts} hint="не влизат в приход" color={gpsDrafts > 0 ? "#64748b" : "#22c55e"} href="/admin/invoices" />
          <KpiCard label="Събития" value={events.length} hint="монтаж/демонтаж/преместване" color="#a78bfa" />
        </div>
      </section>

      {gpsInvoices.length > 0 && (
        <section className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-deep)]/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold">🧾 GPS фактури и операции YTD</h2>
            <Link href="/admin/invoices" className="text-xs text-[var(--color-accent-cyan)] hover:underline">
              всички фактури →
            </Link>
          </div>
          <div className="space-y-2">
            {gpsInvoices.slice(0, 12).map((i) => (
              <div key={i.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border-default)] bg-black/20 px-3 py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {i.contact_id ? (
                      <Link href={`/admin/clients/${i.contact_id}`} className="hover:text-[var(--color-accent-cyan)]">
                        {contactName.get(i.contact_id) ?? i.client_name ?? i.client_email ?? "клиент"}
                      </Link>
                    ) : (
                      i.client_name ?? i.client_email ?? "—"
                    )}
                  </p>
                  <p className="font-mono text-[11px] text-[var(--color-text-tertiary)]">
                    № {i.invoice_number || "—"} · {formatDate(i.issue_date)} · {i.service_type || "GPS"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-[var(--color-text-primary)]">{formatMoney(i.amount_gross, i.currency)}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: `${INVOICE_STATUS_COLOR[i.status]}22`, color: INVOICE_STATUS_COLOR[i.status] }}
                  >
                    {INVOICE_STATUS_LABEL[i.status] ?? i.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <GpsManager devices={withContact} eventsByDevice={eventsByDevice} />
    </div>
  );
}
