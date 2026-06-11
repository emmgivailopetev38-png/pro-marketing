// ─────────────────────────────────────────────────────────────────────────
// Счетоводна агрегатна логика — ЕДИНСТВЕНИЯТ източник на истина.
//
// Pure функции, без Supabase/IO: подаваш raw редове (точно както идват от
// `select '*'`) + период и получаваш напълно изчислени метрики. Целта е да
// замени трите дублирани копия на тази логика из кода (repository, API, UI).
//
// Счетоводни правила (BG, EUR навсякъде — FX е нормализиран по-рано):
//   • Приход НАЧИСЛЕН (accrual) — фактури по issue_date в периода, билируеми
//     (изключи статуси draft/cancelled/excluded).
//   • Приход КАСОВ — плащания по paid_at (fallback created_at), без 'ignored'.
//   • Бизнес разход — expenses с is_personal=false, status != 'cancelled',
//     по expense_date (fallback created_at).
//   • ЛИЧНИ покупки (is_personal=true) — тегления на собственика през фирмата:
//     НЕ са бизнес разход, НЕ намаляват печалба/марж, НЕ дават приспадаемо ДДС.
//   • ДДС за внасяне = изходящо (фактури) − входящо (само БИЗНЕС разходи).
//     Отрицателно = за възстановяване.
//   • Defensive: null суми → 0; невалидни дати → извън период.
// ─────────────────────────────────────────────────────────────────────────

export type PeriodKey = "month" | "last_month" | "quarter" | "ytd" | "all";

export interface Period {
  key: PeriodKey | "range";
  from: Date | null;
  to: Date | null;
  label: string;
}

// ── raw редове (точно както идват от Supabase select '*') ──────────────────
export interface InvoiceLike {
  status: string;
  amount_gross: number | null;
  amount_net: number | null;
  vat_amount: number | null;
  issue_date: string | null;
  due_date: string | null;
  invoice_type?: string | null;
  service_type?: string | null;
}

export interface PaymentLike {
  amount: number | null;
  paid_at: string | null;
  created_at: string;
  match_status: string;
}

export interface ExpenseLike {
  amount_gross: number | null;
  amount_net: number | null;
  vat_amount: number | null;
  category: string;
  status: string;
  expense_date: string | null;
  created_at: string;
  is_personal: boolean;
}

export interface AccountingMetrics {
  period: { key: string; label: string; from: string | null; to: string | null };
  revenue_accrued: number; // Σ billable invoices.amount_gross в периода
  revenue_net: number; // без ДДС (gross − vat, или amount_net ако има)
  payments_received: number; // Σ payments.amount в периода (match_status != 'ignored')
  business_expenses_gross: number; // Σ НЕ-лични expenses.amount_gross в периода (status != cancelled)
  business_expenses_net: number; // без ДДС
  personal_expenses: number; // Σ ЛИЧНИ (is_personal) expenses.amount_gross в периода
  profit_cash: number; // payments_received − business_expenses_gross
  profit_accrued: number; // revenue_accrued − business_expenses_gross
  profit_net: number; // revenue_net − business_expenses_net (без ДДС база)
  margin_cash_pct: number; // profit_cash / payments_received * 100 (0 ако няма)
  vat_output: number; // Σ billable invoices.vat_amount в периода (ДДС, което дължиш)
  vat_input: number; // Σ БИЗНЕС expenses.vat_amount в периода (приспадаемо; ЛИЧНИТЕ НЕ влизат)
  vat_due: number; // vat_output − vat_input (отрицателно = за възстановяване)
  by_category: Array<{ category: string; gross: number; share_pct: number }>; // само бизнес разходи, низходящо
  unpaid: { count: number; gross_total: number; overdue_count: number };
  counts: { invoices: number; payments: number; expenses: number; personal_count: number };
}

// ── малки помощни ──────────────────────────────────────────────────────────

/** Закръгляне до 2 знака, стабилно спрямо float грешки. */
function round2(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** null/undefined/нечислови → 0; иначе число. */
function num(v: number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Парсва ISO дата; невалидна/липсваща → null. */
function parseDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Билируеми фактури (влизат в начисления приход и в изходящото ДДС). */
const NON_BILLABLE_INVOICE_STATUSES = new Set(["draft", "cancelled", "excluded"]);
/** Статуси, които броим за неплатени (за unpaid справката). */
const UNPAID_INVOICE_STATUSES = new Set(["sent", "awaiting_payment", "partially_paid", "overdue"]);

/**
 * В периода ли е дадена дата? `from` е включващо, `to` е изключващо
 * (полу-отворен интервал [from, to)), така че границите между месеците не се
 * броят двойно. Null граница = без ограничение от тази страна. Невалидна дата
 * → false (извън период).
 */
export function inPeriod(dateISO: string | null | undefined, period: Period): boolean {
  const d = parseDate(dateISO);
  if (!d) return false;
  if (period.from && d.getTime() < period.from.getTime()) return false;
  if (period.to && d.getTime() >= period.to.getTime()) return false;
  return true;
}

// ── resolvePeriod ──────────────────────────────────────────────────────────

const MONTHS_BG = [
  "януари",
  "февруари",
  "март",
  "април",
  "май",
  "юни",
  "юли",
  "август",
  "септември",
  "октомври",
  "ноември",
  "декември",
];

function startOfMonth(year: number, month: number): Date {
  // month е 0-базиран; Date нормализира преливането на месеца/годината.
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function monthLabel(d: Date): string {
  return `${MONTHS_BG[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Преобразува заявка за период (period key или custom from/to) в конкретен
 * полу-отворен интервал [from, to). Подразбиране: 'month' (текущ месец).
 * Custom range печели, ако е подадена поне една валидна граница.
 */
export function resolvePeriod(opts: {
  period?: string;
  from?: string;
  to?: string;
  now?: Date;
}): Period {
  const now = opts.now ?? new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  // Custom range — ако има поне една валидна граница, тя печели.
  const customFrom = parseDate(opts.from);
  const customTo = parseDate(opts.to);
  if (customFrom || customTo) {
    const fmt = (d: Date | null) =>
      d
        ? `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`
        : "…";
    return {
      key: "range",
      from: customFrom,
      to: customTo,
      label: `${fmt(customFrom)} – ${fmt(customTo)}`,
    };
  }

  const key = (opts.period ?? "month") as PeriodKey;
  switch (key) {
    case "last_month": {
      const from = startOfMonth(y, m - 1);
      const to = startOfMonth(y, m);
      return { key, from, to, label: monthLabel(from) };
    }
    case "quarter": {
      // Календарно тримесечие, в което попада `now`.
      const qStartMonth = Math.floor(m / 3) * 3;
      const from = startOfMonth(y, qStartMonth);
      const to = startOfMonth(y, qStartMonth + 3);
      const qNum = Math.floor(m / 3) + 1;
      return { key, from, to, label: `Q${qNum} ${y}` };
    }
    case "ytd": {
      const from = startOfMonth(y, 0);
      const to = startOfMonth(y, m + 1); // до края на текущия месец
      return { key, from, to, label: `${y} (до момента)` };
    }
    case "all": {
      return { key, from: null, to: null, label: "Цялата история" };
    }
    case "month":
    default: {
      const from = startOfMonth(y, m);
      const to = startOfMonth(y, m + 1);
      return { key: "month", from, to, label: monthLabel(from) };
    }
  }
}

// ── computeAccountingMetrics ───────────────────────────────────────────────

/**
 * Изчислява всички счетоводни метрики за подадения период. Чиста функция —
 * не докосва Supabase/мрежа. Подаваш raw редове + резолвнат Period.
 */
export function computeAccountingMetrics(args: {
  invoices: InvoiceLike[];
  payments: PaymentLike[];
  expenses: ExpenseLike[];
  period: Period;
  now?: Date;
}): AccountingMetrics {
  const now = args.now ?? new Date();
  const period = args.period;
  const invoices = args.invoices ?? [];
  const payments = args.payments ?? [];
  const expenses = args.expenses ?? [];

  // ── фактури: начислен приход + изходящо ДДС (само билируеми, в периода) ──
  let revenue_accrued = 0;
  let revenue_net = 0;
  let vat_output = 0;
  let invoiceCount = 0;
  for (const inv of invoices) {
    const billable = !NON_BILLABLE_INVOICE_STATUSES.has(inv.status);
    if (!billable) continue;
    if (!inPeriod(inv.issue_date, period)) continue;
    invoiceCount++;
    const gross = num(inv.amount_gross);
    const vat = num(inv.vat_amount);
    // net: предпочети явния amount_net; иначе gross − vat.
    const net = inv.amount_net !== null && inv.amount_net !== undefined ? num(inv.amount_net) : gross - vat;
    revenue_accrued += gross;
    revenue_net += net;
    vat_output += vat;
  }

  // ── плащания: касов приход (по paid_at, fallback created_at) ──────────────
  let payments_received = 0;
  let paymentCount = 0;
  for (const p of payments) {
    if (p.match_status === "ignored") continue;
    if (!inPeriod(p.paid_at ?? p.created_at, period)) continue;
    paymentCount++;
    payments_received += num(p.amount);
  }

  // ── разходи: бизнес vs лични (по expense_date, fallback created_at) ───────
  let business_expenses_gross = 0;
  let business_expenses_net = 0;
  let vat_input = 0;
  let personal_expenses = 0;
  let personal_count = 0;
  let businessExpenseCount = 0;
  const categoryTotals = new Map<string, number>();
  for (const e of expenses) {
    if (e.status === "cancelled") continue;
    if (!inPeriod(e.expense_date ?? e.created_at, period)) continue;
    const gross = num(e.amount_gross);
    if (e.is_personal) {
      // Лични тегления — водят се отделно, не влизат в бизнес сметките/ДДС.
      personal_count++;
      personal_expenses += gross;
      continue;
    }
    businessExpenseCount++;
    const vat = num(e.vat_amount);
    const net = e.amount_net !== null && e.amount_net !== undefined ? num(e.amount_net) : gross - vat;
    business_expenses_gross += gross;
    business_expenses_net += net;
    vat_input += vat;
    const cat = e.category || "other";
    categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + gross);
  }

  // ── разбивка по категория (само бизнес разходи, низходящо по сума) ────────
  const totalBusinessGross = business_expenses_gross;
  const by_category = Array.from(categoryTotals.entries())
    .map(([category, gross]) => ({
      category,
      gross: round2(gross),
      share_pct: totalBusinessGross > 0 ? round2((gross / totalBusinessGross) * 100) : 0,
    }))
    .sort((a, b) => b.gross - a.gross);

  // ── неплатени фактури (НЕ зависят от периода — текущ дълг към нас) ────────
  let unpaidCount = 0;
  let unpaidGross = 0;
  let overdueCount = 0;
  for (const inv of invoices) {
    if (!UNPAID_INVOICE_STATUSES.has(inv.status)) continue;
    unpaidCount++;
    unpaidGross += num(inv.amount_gross);
    const due = parseDate(inv.due_date);
    if (due && due.getTime() < now.getTime()) overdueCount++;
  }

  // ── печалби и марж ───────────────────────────────────────────────────────
  const profit_cash = payments_received - business_expenses_gross;
  const profit_accrued = revenue_accrued - business_expenses_gross;
  const profit_net = revenue_net - business_expenses_net;
  const margin_cash_pct = payments_received > 0 ? (profit_cash / payments_received) * 100 : 0;
  const vat_due = vat_output - vat_input;

  return {
    period: {
      key: period.key,
      label: period.label,
      from: period.from ? period.from.toISOString() : null,
      to: period.to ? period.to.toISOString() : null,
    },
    revenue_accrued: round2(revenue_accrued),
    revenue_net: round2(revenue_net),
    payments_received: round2(payments_received),
    business_expenses_gross: round2(business_expenses_gross),
    business_expenses_net: round2(business_expenses_net),
    personal_expenses: round2(personal_expenses),
    profit_cash: round2(profit_cash),
    profit_accrued: round2(profit_accrued),
    profit_net: round2(profit_net),
    margin_cash_pct: round2(margin_cash_pct),
    vat_output: round2(vat_output),
    vat_input: round2(vat_input),
    vat_due: round2(vat_due),
    by_category,
    unpaid: {
      count: unpaidCount,
      gross_total: round2(unpaidGross),
      overdue_count: overdueCount,
    },
    counts: {
      invoices: invoiceCount,
      payments: paymentCount,
      expenses: businessExpenseCount,
      personal_count,
    },
  };
}
