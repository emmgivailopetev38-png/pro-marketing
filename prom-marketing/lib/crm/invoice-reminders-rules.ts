/**
 * Неплатените фактури — чиста логика, без база.
 *
 * Одитът от 24.10.2026: 8 от 11 неплатени фактури нямаха падеж и никой не ги
 * напомняше. Оттук нататък: фактура без падеж получава издаване + 7 дни, а
 * на 3-ия / 7-ия / 14-ия ден след падежа в картона остава бележка
 * „🔔 Фактура №… просрочена N дни" (с dedupe_key — по една на праг). Нищо не
 * отива към клиента — напомнянията са към Ивайло, в сутрешния имейл.
 */
import { dayKey } from "@/lib/contacts/followup";

/** Дни между два календарни дни („2026-10-10" → „2026-10-24" = 14). */
function daysBetweenDays(fromDay: string, toDay: string): number {
  const [fy, fm, fd] = fromDay.split("-").map(Number);
  const [ty, tm, td] = toDay.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / 86_400_000);
}

export const DEFAULT_DUE_DAYS = 7;
export const INVOICE_MILESTONES = [3, 7, 14] as const;
export type InvoiceMilestone = (typeof INVOICE_MILESTONES)[number];

/** Статусите, при които фактурата чака пари. */
export const OPEN_INVOICE_STATUSES = new Set(["sent", "awaiting_payment", "partially_paid", "overdue"]);

/** „ГГГГ-ММ-ДД" + N дни → „ГГГГ-ММ-ДД". Невалидна дата → null. */
export function addDays(isoDay: string, days: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDay.trim());
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

/** Падежът по подразбиране: издаване + 7 дни; без дата на издаване — днес + 7. */
export function defaultDueDate(issueDate: string | null | undefined, now: Date = new Date()): string {
  const base = issueDate && addDays(issueDate, 0) ? issueDate.trim().slice(0, 10) : dayKey(now);
  return addDays(base, DEFAULT_DUE_DAYS) ?? addDays(dayKey(now), DEFAULT_DUE_DAYS)!;
}

export interface InvoiceForReminder {
  id: string;
  contact_id: string | null;
  client_name: string | null;
  invoice_number: string | null;
  invoice_type?: string | null;
  issue_date: string | null;
  due_date: string | null;
  amount_gross: number | null;
  amount_net: number | null;
  status: string;
}

export interface PaymentForReminder {
  invoice_id: string | null;
  amount: number;
  match_status?: string | null;
}

export interface OverdueInvoice {
  invoice: InvoiceForReminder;
  /** Колко остава: amount_gross − платеното (при частично плащане). */
  remaining: number;
  paid: number;
  days_overdue: number;
  /** Най-високият достигнат праг (3/7/14). */
  milestone: InvoiceMilestone | null;
  /** Бележка за този праг трябва ли да се пише (няма я още). */
  note_due: boolean;
  dedupe_key: string | null;
}

export function invoiceReminderKey(invoiceId: string, milestone: InvoiceMilestone): string {
  return `invoice-overdue:${invoiceId}:${milestone}`;
}

export function milestoneFor(daysOverdue: number): InvoiceMilestone | null {
  let hit: InvoiceMilestone | null = null;
  for (const m of INVOICE_MILESTONES) if (daysOverdue >= m) hit = m;
  return hit;
}

/**
 * Просрочените (падеж преди днес) с остатък > 0, по давност. `existingKeys` —
 * dedupe ключовете на вече написаните бележки.
 */
export function planInvoiceReminders(
  invoices: InvoiceForReminder[],
  payments: PaymentForReminder[],
  existingKeys: Set<string>,
  now: Date = new Date()
): OverdueInvoice[] {
  const today = dayKey(now);
  const paidBy = new Map<string, number>();
  for (const p of payments) {
    if (!p.invoice_id || p.match_status === "ignored") continue;
    paidBy.set(p.invoice_id, (paidBy.get(p.invoice_id) ?? 0) + (Number(p.amount) || 0));
  }
  const out: OverdueInvoice[] = [];
  for (const inv of invoices) {
    if (!OPEN_INVOICE_STATUSES.has(inv.status) || !inv.due_date) continue;
    const dueDay = inv.due_date.slice(0, 10);
    const days = daysBetweenDays(dueDay, today);
    if (!Number.isFinite(days) || days <= 0) continue;
    const gross = inv.amount_gross ?? inv.amount_net ?? 0;
    const paid = Math.round((paidBy.get(inv.id) ?? 0) * 100) / 100;
    const remaining = Math.round((gross - paid) * 100) / 100;
    if (remaining <= 0) continue;
    const milestone = milestoneFor(days);
    const key = milestone ? invoiceReminderKey(inv.id, milestone) : null;
    out.push({
      invoice: inv,
      remaining,
      paid,
      days_overdue: days,
      milestone,
      note_due: !!key && !!inv.contact_id && !existingKeys.has(key),
      dedupe_key: key,
    });
  }
  out.sort((a, b) => b.days_overdue - a.days_overdue || b.remaining - a.remaining);
  return out;
}

/** Групата за имейла: 14+ · 7–13 · 3–6 · 1–2 дни. */
export function overdueBucket(days: number): "14+" | "7+" | "3+" | "1+" {
  if (days >= 14) return "14+";
  if (days >= 7) return "7+";
  if (days >= 3) return "3+";
  return "1+";
}
