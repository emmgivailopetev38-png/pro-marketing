import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import {
  listActivities,
  listBookings,
  listContacts,
  listInvoices,
  listPayments,
  type CrmRow,
} from "@/lib/crm/list-read";
import { createServiceClient } from "@/lib/supabase/service";
import { isUnpaidInvoice, paidByInvoice, invoiceOutstanding } from "@/lib/crm/accounting-metrics";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/brief — цялата картина с едно извикване.
 *
 * Дотук сутрешният преглед искаше 6–7 отделни заявки и Hermes ги сглобяваше
 * наум. Тук идват готови: днешните срещи, кой чака обаждане, кой е просрочен,
 * какво стои в ръчната проверка, кои фактури не са платени и какво се случи
 * от вчера. Само четене — нищо не се променя.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const tomorrow = new Date(dayStart);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(dayStart);
  yesterday.setDate(yesterday.getDate() - 1);

  const page = { limit: 200, offset: 0 };

  const sb = createServiceClient();
  const [meetings, upcoming, contacts, invoices, payments, review, activity] = await Promise.all([
    listBookings({ ...page, when: "today" }),
    listBookings({ ...page, when: "upcoming", limit: 10 }),
    listContacts({ ...page }),
    listInvoices({ ...page }),
    listPayments({ ...page }),
    sb
      .from("manual_review_items")
      .select("id, type, title, severity, status, created_at")
      .in("status", ["open", "needs_user", "blocked"])
      .order("created_at", { ascending: false })
      .limit(50)
      .then((r) => ({ items: (r.data ?? []) as CrmRow[], total: (r.data ?? []).length, error: r.error?.message ?? null })),
    listActivities({ ...page, from: yesterday.toISOString(), limit: 40 }),
  ]);

  const firstError = [meetings, upcoming, contacts, invoices, payments, review, activity]
    .map((r) => r.error)
    .find(Boolean);
  if (firstError) {
    return NextResponse.json({ ok: false, error: firstError }, { status: 500 });
  }

  const at = (v: unknown) => {
    const t = v ? new Date(String(v)).getTime() : NaN;
    return Number.isNaN(t) ? null : t;
  };

  // Кой чака контакт днес и кой е изпуснат.
  const dueToday = contacts.items.filter((c: CrmRow) => {
    const t = at(c.next_followup_at);
    return t !== null && t >= dayStart.getTime() && t < tomorrow.getTime();
  });
  const overdue = contacts.items.filter((c: CrmRow) => {
    const t = at(c.next_followup_at);
    return t !== null && t < dayStart.getTime();
  });

  // Неплатени = истински фактури, които чакат пари (без чернови, проформи и
  // кредитни известия); сумата е остатъкът след вече получените плащания.
  const paidPerInvoice = paidByInvoice(
    payments.items.map((p: CrmRow) => ({
      invoice_id: (p.invoice_id as string | null) ?? null,
      amount: Number(p.amount) || 0,
      match_status: String(p.match_status),
    }))
  );
  const unpaid = invoices.items.filter((i: CrmRow) =>
    isUnpaidInvoice({ status: String(i.status), invoice_type: (i.invoice_type as string | null) ?? null })
  );
  const outstanding = (rows: CrmRow[]) =>
    Math.round(
      rows.reduce(
        (n, r) => n + invoiceOutstanding({ id: r.id as string, amount_gross: Number(r.amount_gross) || 0 }, paidPerInvoice),
        0
      ) * 100
    ) / 100;
  const overdueInvoices = unpaid.filter((i: CrmRow) => {
    const t = at(i.due_date);
    return t !== null && t < dayStart.getTime();
  });
  const unmatchedPayments = payments.items.filter((p: CrmRow) => String(p.match_status) !== "matched");

  const slim = (rows: Array<Record<string, unknown>>, keys: string[]) =>
    rows.map((r) => Object.fromEntries(keys.filter((k) => k in r).map((k) => [k, r[k]])));

  return NextResponse.json({
    ok: true,
    generated_at: now.toISOString(),
    today: now.toISOString().slice(0, 10),

    sreshti_dnes: slim(meetings.items, [
      "id", "attendee_name", "attendee_email", "attendee_phone",
      "scheduled_at", "duration_minutes", "status", "meeting_url", "business",
    ]),
    sledvashti_sreshti: slim(upcoming.items, [
      "id", "attendee_name", "scheduled_at", "status", "meeting_url",
    ]),

    za_kontakt_dnes: slim(dueToday, [
      "id", "full_name", "company", "phone", "email", "stage", "next_followup_at", "deal_value_eur",
    ]),
    prosrocheni_kontakti: slim(overdue, [
      "id", "full_name", "company", "phone", "stage", "next_followup_at",
    ]),

    pari: {
      neplateni_fakturi: unpaid.length,
      neplateno_obshto: outstanding(unpaid),
      prosrocheni_fakturi: overdueInvoices.length,
      prosracheno_obshto: outstanding(overdueInvoices),
      nesvereni_plashtaniya: unmatchedPayments.length,
    },

    za_ruchna_proverka: slim(review.items, ["id", "type", "title", "status", "severity", "created_at"]),

    ot_vchera: slim(activity.items, [
      "id", "contact_id", "activity_type", "title", "created_by", "occurred_at",
    ]),

    broiki: {
      kontakti: contacts.total,
      sreshti_dnes: meetings.items.length,
      za_kontakt_dnes: dueToday.length,
      prosrocheni: overdue.length,
      za_proverka: review.items.length,
      aktivnosti_ot_vchera: activity.items.length,
    },
  });
}
