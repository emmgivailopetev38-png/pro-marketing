import { describe, expect, it } from "vitest";
import { advanceDue, dateOf, debtTotals, monthSummary, nextDueDate, optimizationSignals, upcomingPayments, type Debt, type Movement } from "./pari";

let n = 0;
function mv(p: Partial<Movement>): Movement {
  n += 1;
  return { id: String(n), occurred_on: "2026-10-05", owner: "company", account: "УниКредит", account_type: "bank", direction: "out", amount: 0, category: "other", counterparty: null, description: null, ...p };
}

function debt(p: Partial<Debt>): Debt {
  return {
    id: p.name ?? "d",
    direction: "payable",
    owner: "company",
    kind: "loan",
    status: "active",
    name: "Кредит",
    counterparty: null,
    account: null,
    contact_id: null,
    original_amount: null,
    balance: null,
    balance_as_of: null,
    credit_limit: null,
    installment: null,
    due_day: null,
    next_due_date: null,
    interest_rate: null,
    ends_on: null,
    note: null,
    ...p,
  };
}

const october: Movement[] = [
  mv({ direction: "in", amount: 360, category: "client", counterparty: "Смол Траде" }),
  mv({ direction: "in", amount: 1457.7, category: "stripe", counterparty: "Stripe" }),
  mv({ direction: "in", amount: 1000, category: "own_transfer", counterparty: "ОББ" }),
  mv({ direction: "out", amount: 1000, category: "own_transfer", counterparty: "УниКредит", account: "ОББ" }),
  mv({ direction: "out", amount: 1050, category: "cash_withdrawal" }),
  mv({ direction: "out", amount: 355.43, category: "loan_payment", description: "Погасяване на главница" }),
  mv({ direction: "out", amount: 6.22, category: "loan_payment", description: "Погасяване на наказателна лихва" }),
  mv({ direction: "out", amount: 315.88, category: "card_repayment" }),
  mv({ account_type: "card", account: "Карта …6044", direction: "out", amount: 400, category: "cash_withdrawal" }),
  mv({ account_type: "card", account: "Карта …6044", direction: "out", amount: 180, category: "software", counterparty: "Anthropic" }),
];

describe("pari · месецът", () => {
  it("приход е само от клиенти; собствените преводи не са нито приход, нито разход; картата е подробност", () => {
    const s = monthSummary(october, "2026-10");
    expect(s.clientIncome).toBe(1817.7);
    expect(s.otherIn).toBe(0);
    expect(s.out).toBe(1727.53);
    expect(s.net).toBe(90.17);
    expect(s.cashWithdrawn).toBe(1450);
    expect(s.cardCash).toBe(400);
    expect(s.outByCategory[0]).toEqual({ category: "cash_withdrawal", amount: 1050 });
    expect(s.cardByCategory.map((c) => c.category)).toEqual(["cash_withdrawal", "software"]);
    expect(s.topClients[0]).toEqual({ counterparty: "Stripe", amount: 1457.7 });
  });

  it("друг месец и личното не се смесват", () => {
    expect(monthSummary(october, "2026-09").out).toBe(0);
    expect(monthSummary(october, "2026-10", "personal").clientIncome).toBe(0);
  });
});

describe("pari · падежи", () => {
  it("денят се реже до края на месеца и годината се прехвърля", () => {
    expect(dateOf(2026, 2, 31)).toBe("2026-02-28");
    expect(dateOf(2026, 13, 5)).toBe("2027-01-05");
    expect(dateOf(2026, 0, 5)).toBe("2025-12-05");
  });

  it("следващият падеж: записаната дата, иначе по деня от месеца", () => {
    expect(nextDueDate({ next_due_date: "2026-11-12", due_day: 12 }, "2026-11-20")).toBe("2026-11-12");
    expect(nextDueDate({ next_due_date: null, due_day: 5 }, "2026-11-04")).toBe("2026-11-05");
    expect(nextDueDate({ next_due_date: null, due_day: 5 }, "2026-11-06")).toBe("2026-12-05");
    expect(nextDueDate({ next_due_date: null, due_day: null }, "2026-11-06")).toBeNull();
  });

  it("„Платено“ мести падежа с месец напред", () => {
    expect(advanceDue({ next_due_date: "2026-11-05", due_day: 5 }, "2026-11-04")).toBe("2026-12-05");
    expect(advanceDue({ next_due_date: "2026-01-31", due_day: 31 }, "2026-01-30")).toBe("2026-02-28");
  });

  it("предстоящите — само активни задължения с вноска, подредени по дата", () => {
    const list = upcomingPayments(
      [
        debt({ name: "ОББ", installment: 828.82, due_day: 5, next_due_date: "2026-11-05" }),
        debt({ name: "Карта", installment: 105.5, next_due_date: "2026-11-15" }),
        debt({ name: "Далеч", installment: 10, next_due_date: "2027-01-01" }),
        debt({ name: "Иво", direction: "receivable", installment: 500, next_due_date: "2026-11-06" }),
        debt({ name: "Затворен", status: "closed", installment: 50, next_due_date: "2026-11-07" }),
      ],
      "2026-11-04"
    );
    expect(list.map((u) => [u.debt.name, u.daysLeft])).toEqual([
      ["ОББ", 1],
      ["Карта", 11],
    ]);
  });
});

describe("pari · сборове и сигнали", () => {
  const debts = [
    debt({ name: "ОББ", balance: 35100, installment: 828.82, interest_rate: 5.742, next_due_date: "2026-11-05" }),
    debt({ name: "Карта …4906", kind: "credit_card", balance: 2530.5, credit_limit: 2500, installment: 105.5, interest_rate: 16.2, next_due_date: "2026-11-15" }),
    debt({ name: "Пощенска ПК", owner: "personal", balance: 45903.45, installment: 665.98, next_due_date: "2026-11-12" }),
    debt({ name: "Иво", direction: "receivable", kind: "contract", balance: 2000 }),
    debt({ name: "Сайт Екологика", direction: "receivable", kind: "contract", status: "potential", balance: 1500 }),
  ];

  it("сборовете делят фирма/лично, вземания/потенциални", () => {
    expect(debtTotals(debts)).toMatchObject({
      payableCompany: 37630.5,
      payablePersonal: 45903.45,
      receivable: 2000,
      potential: 1500,
      installmentsCompany: 934.32,
      installmentsPersonal: 665.98,
    });
  });

  it("сигналите хващат лимита, кеша от картата, наказателната лихва и падежите", () => {
    const s = optimizationSignals(debts, october, "2026-11-04");
    const titles = s.map((x) => x.title).join("\n");
    expect(titles).toMatch(/Карта …4906 е над лимита/);
    expect(titles).toMatch(/Теглено в брой от кредитна карта: 400/);
    expect(titles).toMatch(/Наказателна лихва 1 пъти/);
    expect(titles).toMatch(/Падежи до 7 дни/);
    expect(titles).toMatch(/Да се съберат: 2/);
    expect(s[0].level).toBe("red");
    expect(s[s.length - 1].level).toBe("green");
  });

  it("хваща двойно таксуване от един търговец в рамките на ден", () => {
    const dup = [
      mv({ occurred_on: "2026-09-30", amount: 97, category: "education", counterparty: "MASTERCLASS.BG", account_type: "card" }),
      mv({ occurred_on: "2026-09-30", amount: 97, category: "education", counterparty: "masterclass.bg", account_type: "card" }),
    ];
    const s = optimizationSignals([], dup, "2026-10-10");
    expect(s.some((x) => x.title.includes("двойно плащане") && x.value === 97)).toBe(true);
  });
});
