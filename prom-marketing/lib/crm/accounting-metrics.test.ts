import { describe, it, expect } from "vitest";
import {
  resolvePeriod,
  computeAccountingMetrics,
  inPeriod,
  type InvoiceLike,
  type PaymentLike,
  type ExpenseLike,
} from "./accounting-metrics";

// Фиксиран "сега" за детерминирани периоди: 15 юни 2026, 12:00.
const NOW = new Date(2026, 5, 15, 12, 0, 0);

// ── малки билдъри, за да са четими тестовете ───────────────────────────────
function inv(p: Partial<InvoiceLike>): InvoiceLike {
  return {
    status: "sent",
    amount_gross: null,
    amount_net: null,
    vat_amount: null,
    issue_date: null,
    due_date: null,
    ...p,
  };
}
function pay(p: Partial<PaymentLike>): PaymentLike {
  return {
    amount: null,
    paid_at: null,
    created_at: "2026-06-10T00:00:00.000Z",
    match_status: "matched",
    ...p,
  };
}
function exp(p: Partial<ExpenseLike>): ExpenseLike {
  return {
    amount_gross: null,
    amount_net: null,
    vat_amount: null,
    category: "other",
    status: "unpaid",
    expense_date: null,
    created_at: "2026-06-10T00:00:00.000Z",
    is_personal: false,
    ...p,
  };
}

function empty() {
  return { invoices: [], payments: [], expenses: [] };
}

describe("resolvePeriod", () => {
  it("defaults to the current month as a half-open interval", () => {
    const p = resolvePeriod({ now: NOW });
    expect(p.key).toBe("month");
    expect(p.from?.getFullYear()).toBe(2026);
    expect(p.from?.getMonth()).toBe(5); // юни
    expect(p.from?.getDate()).toBe(1);
    expect(p.to?.getMonth()).toBe(6); // 1 юли (изключващо)
    expect(p.to?.getDate()).toBe(1);
  });

  it("resolves last_month", () => {
    const p = resolvePeriod({ period: "last_month", now: NOW });
    expect(p.from?.getMonth()).toBe(4); // май
    expect(p.to?.getMonth()).toBe(5); // юни (изключващо)
  });

  it("resolves the calendar quarter containing now", () => {
    const p = resolvePeriod({ period: "quarter", now: NOW });
    expect(p.from?.getMonth()).toBe(3); // Q2 започва април
    expect(p.to?.getMonth()).toBe(6); // до юли (изключващо)
    expect(p.label).toBe("Q2 2026");
  });

  it("resolves ytd from Jan 1 to end of current month", () => {
    const p = resolvePeriod({ period: "ytd", now: NOW });
    expect(p.from?.getMonth()).toBe(0); // януари
    expect(p.from?.getDate()).toBe(1);
    expect(p.to?.getMonth()).toBe(6); // изключващо: 1 юли
  });

  it("resolves all to an unbounded interval", () => {
    const p = resolvePeriod({ period: "all", now: NOW });
    expect(p.from).toBeNull();
    expect(p.to).toBeNull();
  });

  it("a custom range wins over the period key", () => {
    const p = resolvePeriod({ period: "month", from: "2026-01-01", to: "2026-03-31", now: NOW });
    expect(p.key).toBe("range");
    expect(p.from?.getMonth()).toBe(0);
    expect(p.to?.getMonth()).toBe(2);
  });
});

describe("inPeriod (boundaries)", () => {
  const june = resolvePeriod({ period: "month", now: NOW });

  it("includes the first instant and excludes the next-month boundary", () => {
    // Границите се строят в ЛОКАЛНО време (както потребителят разбира "юни"),
    // затова сравняваме спрямо локални дати, не UTC — иначе тестът зависи от TZ.
    const local = (y: number, mo: number, d: number, h = 0) => new Date(y, mo, d, h).toISOString();
    expect(inPeriod(local(2026, 5, 1), june)).toBe(true); // 1 юни 00:00
    expect(inPeriod(local(2026, 5, 30, 23), june)).toBe(true); // 30 юни 23:00
    // 1 юли принадлежи на СЛЕДВАЩИЯ месец, не на този.
    expect(inPeriod(local(2026, 6, 1), june)).toBe(false);
    // 31 май принадлежи на предишния месец.
    expect(inPeriod(local(2026, 4, 31, 23), june)).toBe(false);
  });

  it("treats missing/invalid dates as outside the period", () => {
    expect(inPeriod(null, june)).toBe(false);
    expect(inPeriod("not-a-date", june)).toBe(false);
  });

  it("an unbounded 'all' period contains every valid date", () => {
    const all = resolvePeriod({ period: "all", now: NOW });
    expect(inPeriod("2001-01-01T00:00:00.000Z", all)).toBe(true);
    expect(inPeriod("2099-12-31T00:00:00.000Z", all)).toBe(true);
  });
});

describe("computeAccountingMetrics — empty data", () => {
  it("returns all-zero metrics without dividing by zero", () => {
    const m = computeAccountingMetrics({ ...empty(), period: resolvePeriod({ now: NOW }), now: NOW });
    expect(m.revenue_accrued).toBe(0);
    expect(m.payments_received).toBe(0);
    expect(m.business_expenses_gross).toBe(0);
    expect(m.personal_expenses).toBe(0);
    expect(m.profit_cash).toBe(0);
    expect(m.margin_cash_pct).toBe(0); // няма деление на 0
    expect(m.vat_due).toBe(0);
    expect(m.by_category).toEqual([]);
    expect(m.unpaid).toEqual({ count: 0, gross_total: 0, overdue_count: 0 });
    expect(m.counts).toEqual({ invoices: 0, payments: 0, expenses: 0, personal_count: 0 });
  });
});

describe("computeAccountingMetrics — VAT due (output − input, personal excluded)", () => {
  const period = resolvePeriod({ period: "month", now: NOW });

  it("computes VAT due from billable invoices minus BUSINESS expense VAT only", () => {
    const invoices = [
      // 1200 gross, 200 VAT (20% върху 1000 нето) — билируема.
      inv({ status: "sent", amount_gross: 1200, vat_amount: 200, amount_net: 1000, issue_date: "2026-06-05" }),
      // чернова — НЕ влиза в изходящото ДДС.
      inv({ status: "draft", amount_gross: 600, vat_amount: 100, issue_date: "2026-06-06" }),
    ];
    const expenses = [
      // бизнес разход: 120 gross / 20 VAT → входящо ДДС 20.
      exp({ amount_gross: 120, vat_amount: 20, amount_net: 100, category: "software", expense_date: "2026-06-07" }),
      // ЛИЧНА покупка с ДДС 50 — НЕ дава приспадаемо ДДС, не влиза във vat_input.
      exp({ amount_gross: 300, vat_amount: 50, is_personal: true, category: "office", expense_date: "2026-06-08" }),
    ];
    const m = computeAccountingMetrics({ invoices, payments: [], expenses, period, now: NOW });

    expect(m.vat_output).toBe(200); // само билируемата фактура
    expect(m.vat_input).toBe(20); // личните 50 НЕ влизат
    expect(m.vat_due).toBe(180); // 200 − 20
  });

  it("reports a negative vat_due (refund) when input exceeds output", () => {
    const invoices = [inv({ status: "sent", amount_gross: 120, vat_amount: 20, issue_date: "2026-06-05" })];
    const expenses = [
      exp({ amount_gross: 600, vat_amount: 100, category: "gps_hardware", expense_date: "2026-06-07" }),
    ];
    const m = computeAccountingMetrics({ invoices, payments: [], expenses, period, now: NOW });
    expect(m.vat_due).toBe(-80); // 20 − 100 → за възстановяване
  });
});

describe("computeAccountingMetrics — business vs personal split", () => {
  const period = resolvePeriod({ period: "month", now: NOW });

  it("keeps personal withdrawals out of business expenses, profit, margin and VAT", () => {
    const payments = [pay({ amount: 1000, paid_at: "2026-06-10" })];
    const expenses = [
      exp({ amount_gross: 200, vat_amount: 33.33, category: "ads", expense_date: "2026-06-09" }), // бизнес
      exp({ amount_gross: 500, vat_amount: 83.33, is_personal: true, category: "office", expense_date: "2026-06-09" }), // лична
    ];
    const m = computeAccountingMetrics({ invoices: [], payments, expenses, period, now: NOW });

    expect(m.business_expenses_gross).toBe(200); // личните 500 не влизат
    expect(m.personal_expenses).toBe(500);
    expect(m.profit_cash).toBe(800); // 1000 − 200 (НЕ 1000 − 700)
    expect(m.vat_input).toBe(33.33); // личното ДДС изключено
    expect(m.counts.expenses).toBe(1); // само бизнес разходи
    expect(m.counts.personal_count).toBe(1);
    // by_category показва само бизнес разходи.
    expect(m.by_category).toEqual([{ category: "ads", gross: 200, share_pct: 100 }]);
  });

  it("margin_cash_pct is computed on cash profit / payments", () => {
    const payments = [pay({ amount: 1000, paid_at: "2026-06-10" })];
    const expenses = [exp({ amount_gross: 250, category: "hosting", expense_date: "2026-06-09" })];
    const m = computeAccountingMetrics({ invoices: [], payments, expenses, period, now: NOW });
    expect(m.profit_cash).toBe(750);
    expect(m.margin_cash_pct).toBe(75); // 750 / 1000 * 100
  });
});

describe("computeAccountingMetrics — profit cash vs accrued", () => {
  const period = resolvePeriod({ period: "month", now: NOW });

  it("diverges when invoiced revenue is not yet fully paid", () => {
    const invoices = [
      inv({ status: "sent", amount_gross: 1000, vat_amount: 0, amount_net: 1000, issue_date: "2026-06-03" }),
    ];
    // платена е само част от фактурата този месец.
    const payments = [pay({ amount: 400, paid_at: "2026-06-12" })];
    const expenses = [exp({ amount_gross: 100, category: "bank_fee", expense_date: "2026-06-04" })];
    const m = computeAccountingMetrics({ invoices, payments, expenses, period, now: NOW });

    expect(m.revenue_accrued).toBe(1000);
    expect(m.payments_received).toBe(400);
    expect(m.profit_accrued).toBe(900); // 1000 − 100
    expect(m.profit_cash).toBe(300); // 400 − 100
    expect(m.profit_net).toBe(900); // 1000 нето − 100 нето (vat 0)
  });

  it("excludes 'ignored' payments from cash revenue", () => {
    const payments = [
      pay({ amount: 500, paid_at: "2026-06-10", match_status: "matched" }),
      pay({ amount: 999, paid_at: "2026-06-10", match_status: "ignored" }),
    ];
    const m = computeAccountingMetrics({ invoices: [], payments, expenses: [], period, now: NOW });
    expect(m.payments_received).toBe(500);
    expect(m.counts.payments).toBe(1);
  });
});

describe("computeAccountingMetrics — period boundaries (month / ytd)", () => {
  it("month excludes invoices issued in a different month", () => {
    const period = resolvePeriod({ period: "month", now: NOW }); // юни 2026
    const invoices = [
      inv({ status: "sent", amount_gross: 100, issue_date: "2026-06-15" }), // вътре
      inv({ status: "sent", amount_gross: 200, issue_date: "2026-05-31" }), // предишен месец
      inv({ status: "sent", amount_gross: 300, issue_date: "2026-07-01" }), // следващ месец
    ];
    const m = computeAccountingMetrics({ invoices, payments: [], expenses: [], period, now: NOW });
    expect(m.revenue_accrued).toBe(100);
    expect(m.counts.invoices).toBe(1);
  });

  it("ytd accumulates everything from Jan 1 through the current month", () => {
    const period = resolvePeriod({ period: "ytd", now: NOW });
    const invoices = [
      inv({ status: "sent", amount_gross: 100, issue_date: "2026-01-10" }),
      inv({ status: "sent", amount_gross: 200, issue_date: "2026-06-10" }),
      inv({ status: "sent", amount_gross: 400, issue_date: "2025-12-31" }), // миналата година → вън
      inv({ status: "sent", amount_gross: 800, issue_date: "2026-07-05" }), // бъдещ месец → вън
    ];
    const m = computeAccountingMetrics({ invoices, payments: [], expenses: [], period, now: NOW });
    expect(m.revenue_accrued).toBe(300); // 100 + 200
  });

  it("falls back to created_at when expense_date / paid_at is null", () => {
    const period = resolvePeriod({ period: "month", now: NOW });
    const payments = [pay({ amount: 50, paid_at: null, created_at: "2026-06-10T00:00:00.000Z" })];
    const expenses = [
      exp({ amount_gross: 30, category: "office", expense_date: null, created_at: "2026-06-11T00:00:00.000Z" }),
    ];
    const m = computeAccountingMetrics({ invoices: [], payments, expenses, period, now: NOW });
    expect(m.payments_received).toBe(50);
    expect(m.business_expenses_gross).toBe(30);
  });
});

describe("computeAccountingMetrics — billable filter, unpaid & by_category", () => {
  const period = resolvePeriod({ period: "month", now: NOW });

  it("excludes draft/cancelled/excluded invoices from accrued revenue", () => {
    const invoices = [
      inv({ status: "sent", amount_gross: 100, issue_date: "2026-06-05" }),
      inv({ status: "draft", amount_gross: 200, issue_date: "2026-06-05" }),
      inv({ status: "cancelled", amount_gross: 400, issue_date: "2026-06-05" }),
      inv({ status: "excluded", amount_gross: 800, issue_date: "2026-06-05" }),
      inv({ status: "paid", amount_gross: 50, issue_date: "2026-06-05" }),
    ];
    const m = computeAccountingMetrics({ invoices, payments: [], expenses: [], period, now: NOW });
    expect(m.revenue_accrued).toBe(150); // 100 (sent) + 50 (paid)
  });

  it("counts unpaid invoices and overdue regardless of the period", () => {
    const invoices = [
      // просрочена (due_date в миналото спрямо NOW), издадена извън периода.
      inv({ status: "overdue", amount_gross: 300, issue_date: "2026-01-10", due_date: "2026-02-10" }),
      inv({ status: "awaiting_payment", amount_gross: 200, issue_date: "2026-06-10", due_date: "2026-12-31" }),
      inv({ status: "paid", amount_gross: 999, issue_date: "2026-06-10" }), // платена → не е unpaid
    ];
    const m = computeAccountingMetrics({ invoices, payments: [], expenses: [], period, now: NOW });
    expect(m.unpaid.count).toBe(2);
    expect(m.unpaid.gross_total).toBe(500);
    expect(m.unpaid.overdue_count).toBe(1);
  });

  it("ranks business expense categories by gross, descending, with share %", () => {
    const expenses = [
      exp({ amount_gross: 100, category: "ads", expense_date: "2026-06-02" }),
      exp({ amount_gross: 300, category: "salary", expense_date: "2026-06-03" }),
      exp({ amount_gross: 100, category: "ads", expense_date: "2026-06-04" }),
    ];
    const m = computeAccountingMetrics({ invoices: [], payments: [], expenses, period, now: NOW });
    // salary 300, ads 200 (100+100), общо бизнес = 500.
    expect(m.by_category).toEqual([
      { category: "salary", gross: 300, share_pct: 60 },
      { category: "ads", gross: 200, share_pct: 40 },
    ]);
  });
});

describe("computeAccountingMetrics — defensive null handling", () => {
  const period = resolvePeriod({ period: "month", now: NOW });

  it("treats null amounts as 0 and derives net as gross − vat when net is null", () => {
    const invoices = [
      inv({ status: "sent", amount_gross: 120, vat_amount: 20, amount_net: null, issue_date: "2026-06-05" }),
      inv({ status: "sent", amount_gross: null, vat_amount: null, issue_date: "2026-06-06" }),
    ];
    const m = computeAccountingMetrics({ invoices, payments: [], expenses: [], period, now: NOW });
    expect(m.revenue_accrued).toBe(120);
    expect(m.revenue_net).toBe(100); // (120 − 20) + (0 − 0)
    expect(m.vat_output).toBe(20);
  });
});
