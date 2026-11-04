/**
 * „Пари · равносметка“ — правилата, без база. Чисти функции, тествани в
 * pari.test.ts; четенето/писането е в pari-data.ts.
 *
 * Истината за парите е банката: „влезли/излезли“ се смятат само от редовете
 * на разплащателните сметки (account_type = bank). Редовете от извлеченията на
 * кредитните карти (card) са подробност — за какво е похарчено и колко е
 * теглено в брой от картата; погасяването им вече е излязло от банката.
 */

export type Owner = "company" | "personal";
export type DebtDirection = "payable" | "receivable";
export type DebtKind = "loan" | "revolving" | "credit_card" | "leasing" | "supplier" | "contract" | "other";
export type DebtStatus = "active" | "potential" | "closed";

export interface Debt {
  id: string;
  direction: DebtDirection;
  owner: Owner;
  kind: DebtKind;
  status: DebtStatus;
  name: string;
  counterparty: string | null;
  account: string | null;
  contact_id: string | null;
  original_amount: number | null;
  balance: number | null;
  balance_as_of: string | null;
  credit_limit: number | null;
  installment: number | null;
  due_day: number | null;
  next_due_date: string | null;
  interest_rate: number | null;
  ends_on: string | null;
  note: string | null;
}

export interface Movement {
  id: string;
  occurred_on: string;
  owner: Owner;
  account: string;
  account_type: "bank" | "card";
  direction: "in" | "out";
  amount: number;
  category: string;
  counterparty: string | null;
  description: string | null;
}

export const MOVEMENT_CATEGORIES = [
  "client",
  "stripe",
  "loan_draw",
  "own_transfer",
  "cash_deposit",
  "refund",
  "cash_withdrawal",
  "card_repayment",
  "loan_payment",
  "ads",
  "software",
  "education",
  "accountant",
  "taxes",
  "supplier",
  "telecom",
  "insurance",
  "bank_fees",
  "owner_transfer",
  "personal",
  "other",
] as const;

export const CATEGORY_LABEL: Record<string, string> = {
  client: "Клиенти",
  stripe: "Stripe",
  loan_draw: "Пари от кредит",
  own_transfer: "Между нашите сметки",
  cash_deposit: "Внесени в брой",
  refund: "Възстановени",
  cash_withdrawal: "Теглени в брой",
  card_repayment: "Погасяване на карти",
  loan_payment: "Вноски по кредити",
  ads: "Реклама",
  software: "Софтуер и AI",
  education: "Обучения и ментори",
  accountant: "Счетоводство",
  taxes: "Данъци и осигуровки",
  supplier: "Доставчици",
  telecom: "Телефон и интернет",
  insurance: "Застраховки",
  bank_fees: "Банкови такси и лихви",
  owner_transfer: "Към Ивайло (лична сметка)",
  personal: "Лично",
  other: "Друго",
};

export const DEBT_KIND_LABEL: Record<DebtKind, string> = {
  loan: "Кредит",
  revolving: "Револвиращ кредит",
  credit_card: "Кредитна карта",
  leasing: "Лизинг",
  supplier: "Към доставчик",
  contract: "По договор",
  other: "Друго",
};

/** Приход = парите от клиентите. Кредит, собствен превод и внесен кеш не са приход. */
export const INCOME_CATEGORIES = new Set(["client", "stripe"]);
/** Движения между нашите сметки — не са нито приход, нито разход. */
const INTERNAL = new Set(["own_transfer"]);

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface CategorySum {
  category: string;
  amount: number;
}

export interface MonthSummary {
  month: string;
  clientIncome: number;
  otherIn: number;
  out: number;
  net: number;
  cashWithdrawn: number;
  cardCash: number;
  outByCategory: CategorySum[];
  cardByCategory: CategorySum[];
  topClients: Array<{ counterparty: string; amount: number }>;
}

function sumBy(rows: Movement[], key: (m: Movement) => string): CategorySum[] {
  const map = new Map<string, number>();
  for (const m of rows) map.set(key(m), (map.get(key(m)) ?? 0) + m.amount);
  return [...map.entries()].map(([category, amount]) => ({ category, amount: r2(amount) })).sort((a, b) => b.amount - a.amount);
}

export function monthSummary(movements: Movement[], month: string, owner: Owner = "company"): MonthSummary {
  const rows = movements.filter((m) => m.owner === owner && m.occurred_on.slice(0, 7) === month && !INTERNAL.has(m.category));
  const bank = rows.filter((m) => m.account_type === "bank");
  const card = rows.filter((m) => m.account_type === "card");
  const income = bank.filter((m) => m.direction === "in" && INCOME_CATEGORIES.has(m.category));
  const clientIncome = income.reduce((s, m) => s + m.amount, 0);
  const otherIn = bank.filter((m) => m.direction === "in" && !INCOME_CATEGORIES.has(m.category)).reduce((s, m) => s + m.amount, 0);
  const bankOut = bank.filter((m) => m.direction === "out");
  const out = bankOut.reduce((s, m) => s + m.amount, 0);
  const cardOut = card.filter((m) => m.direction === "out");
  const bankCash = bankOut.filter((m) => m.category === "cash_withdrawal").reduce((s, m) => s + m.amount, 0);
  const cardCash = cardOut.filter((m) => m.category === "cash_withdrawal").reduce((s, m) => s + m.amount, 0);
  return {
    month,
    clientIncome: r2(clientIncome),
    otherIn: r2(otherIn),
    out: r2(out),
    net: r2(clientIncome - out),
    cashWithdrawn: r2(bankCash + cardCash),
    cardCash: r2(cardCash),
    outByCategory: sumBy(bankOut, (m) => m.category),
    cardByCategory: sumBy(cardOut, (m) => m.category),
    topClients: sumBy(income, (m) => m.counterparty ?? "—").map((c) => ({ counterparty: c.category, amount: c.amount })),
  };
}

// ── Дати ─────────────────────────────────────────────────────────────────────

/** Дата от година/месец/ден; денят се реже до края на месеца (31 → 30.11). Месец 13 = януари догодина. */
export function dateOf(year: number, month: number, day: number): string {
  const y = year + Math.floor((month - 1) / 12);
  const m = ((((month - 1) % 12) + 12) % 12) + 1;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const d = Math.min(day, last);
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

/** Следващият падеж: записаната дата (и минала — значи просрочено), иначе по деня от месеца. */
export function nextDueDate(d: Pick<Debt, "next_due_date" | "due_day">, today: string): string | null {
  if (d.next_due_date) return d.next_due_date;
  if (!d.due_day) return null;
  const [y, m] = today.split("-").map(Number);
  const cand = dateOf(y, m, d.due_day);
  return cand >= today ? cand : dateOf(y, m + 1, d.due_day);
}

/** След „Платено“: падежът отива с месец напред (по due_day, ако го има). */
export function advanceDue(d: Pick<Debt, "next_due_date" | "due_day">, today: string): string | null {
  const cur = nextDueDate(d, today);
  if (!cur) return null;
  const [y, m, day] = cur.split("-").map(Number);
  return dateOf(y, m + 1, d.due_day ?? day);
}

// ── Кредити и вземания ───────────────────────────────────────────────────────

export interface DebtTotals {
  payableCompany: number;
  payablePersonal: number;
  receivable: number;
  potential: number;
  installmentsCompany: number;
  installmentsPersonal: number;
  interestPerMonth: number;
}

export function debtTotals(debts: Debt[]): DebtTotals {
  const active = debts.filter((d) => d.status === "active");
  const pay = active.filter((d) => d.direction === "payable");
  const sum = (rows: Debt[], f: (d: Debt) => number | null) => r2(rows.reduce((s, d) => s + (Number(f(d)) || 0), 0));
  return {
    payableCompany: sum(pay.filter((d) => d.owner === "company"), (d) => d.balance),
    payablePersonal: sum(pay.filter((d) => d.owner === "personal"), (d) => d.balance),
    receivable: sum(active.filter((d) => d.direction === "receivable"), (d) => d.balance),
    potential: sum(debts.filter((d) => d.status === "potential" && d.direction === "receivable"), (d) => d.balance),
    installmentsCompany: sum(pay.filter((d) => d.owner === "company"), (d) => d.installment),
    installmentsPersonal: sum(pay.filter((d) => d.owner === "personal"), (d) => d.installment),
    interestPerMonth: sum(pay, (d) => (d.balance && d.interest_rate ? (d.balance * d.interest_rate) / 100 / 12 : 0)),
  };
}

export interface Upcoming {
  debt: Debt;
  date: string;
  amount: number;
  daysLeft: number;
}

export function upcomingPayments(debts: Debt[], today: string, days = 30): Upcoming[] {
  return debts
    .filter((d) => d.status === "active" && d.direction === "payable" && (d.installment ?? 0) > 0)
    .map((d) => {
      const date = nextDueDate(d, today);
      return date ? { debt: d, date, amount: r2(Number(d.installment)), daysLeft: daysBetween(today, date) } : null;
    })
    .filter((u): u is Upcoming => u !== null && u.daysLeft <= days)
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── Сигнали за оптимизация ───────────────────────────────────────────────────

export interface Signal {
  level: "red" | "amber" | "green";
  title: string;
  detail: string;
  /** Колко пари на месец спестява/носи, ако се оправи (оценка). */
  value?: number;
}

const eur = (n: number) => `${r2(n).toLocaleString("bg-BG", { maximumFractionDigits: 2 })} €`;

function monthsBefore(today: string, n: number): string[] {
  const [y, m] = today.split("-").map(Number);
  return Array.from({ length: n }, (_, i) => dateOf(y, m - n + i, 1).slice(0, 7));
}

export function optimizationSignals(debts: Debt[], movements: Movement[], today: string): Signal[] {
  const out: Signal[] = [];
  const active = debts.filter((d) => d.status === "active");
  const since60 = dateOf(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, Number(today.slice(8, 10)));
  const since90 = dateOf(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 3, Number(today.slice(8, 10)));

  // 1. Карта над лимита
  for (const d of active.filter((x) => x.kind === "credit_card" && x.credit_limit && (x.balance ?? 0) > x.credit_limit)) {
    out.push({
      level: "red",
      title: `${d.name} е над лимита`,
      detail: `${eur(d.balance ?? 0)} при лимит ${eur(d.credit_limit ?? 0)}. Свали я под лимита преди падежа — иначе такса за надвишаване и петно в кредитната история.`,
    });
  }

  // 2. Кеш от кредитна карта — най-скъпите пари
  const cardCash = movements.filter((m) => m.account_type === "card" && m.direction === "out" && m.category === "cash_withdrawal" && m.occurred_on >= since60);
  const cardCashSum = cardCash.reduce((s, m) => s + m.amount, 0);
  if (cardCashSum > 0) {
    const rate = Math.max(0, ...active.filter((d) => d.kind === "credit_card").map((d) => d.interest_rate ?? 0)) || 16;
    out.push({
      level: "red",
      title: `Теглено в брой от кредитна карта: ${eur(cardCashSum)} за 2 месеца`,
      detail: `≈3 % такса + ${rate} % лихва от първия ден. Тегли от дебитната сметка, не от картата.`,
      value: r2(cardCashSum / 2 * (0.03 + rate / 100 / 12)),
    });
  }

  // 3. Наказателна лихва = закъсняла вноска
  const penalties = movements.filter((m) => m.direction === "out" && m.category === "loan_payment" && /наказат|просроч/i.test(m.description ?? "") && m.occurred_on >= since90);
  if (penalties.length > 0) {
    const sum = penalties.reduce((s, m) => s + m.amount, 0);
    out.push({
      level: "amber",
      title: `Наказателна лихва ${penalties.length} пъти за 3 месеца (${eur(sum)})`,
      detail: "Вноската закъснява. Сумата е малка, но петни кредитната история — а нея гледат за нов кредит. Плащай 2 дни преди падежа.",
      value: r2(sum / 3),
    });
  }

  // 4. Кеш от фирмата без документ
  const lastFull = monthsBefore(today, 1)[0];
  const lastSummary = monthSummary(movements, lastFull);
  const bankCash = lastSummary.cashWithdrawn - lastSummary.cardCash;
  if (bankCash >= 1000) {
    out.push({
      level: "amber",
      title: `${eur(bankCash)} теглени в брой от фирмата през ${lastFull}`,
      detail: "Без документ НАП ги гледа като скрита печалба. С счетоводителя: да станат заплата, дивидент или подотчетни — и превод по лична сметка вместо банкомат (по-малко такси).",
    });
  }

  // 5. Възможно двойно плащане
  const outs = movements.filter((m) => m.direction === "out" && m.counterparty);
  const seen = new Set<string>();
  for (let i = 0; i < outs.length; i++) {
    for (let j = i + 1; j < outs.length; j++) {
      const a = outs[i];
      const b = outs[j];
      if (a.amount !== b.amount || a.amount < 20) continue;
      if ((a.counterparty ?? "").toLowerCase() !== (b.counterparty ?? "").toLowerCase()) continue;
      if (Math.abs(daysBetween(a.occurred_on, b.occurred_on)) > 1) continue;
      if (["cash_withdrawal", "card_repayment", "loan_payment", "own_transfer"].includes(a.category)) continue;
      const key = `${a.counterparty}|${a.amount}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ level: "amber", title: `Възможно двойно плащане: ${a.counterparty}`, detail: `2 × ${eur(a.amount)} (${a.occurred_on}, ${b.occurred_on}). Провери и поискай връщане.`, value: a.amount });
    }
  }

  // 6. Падежи до 7 дни
  const soon = upcomingPayments(debts, today, 7);
  if (soon.length > 0) {
    out.push({
      level: soon.some((u) => u.daysLeft < 0) ? "red" : "amber",
      title: `Падежи до 7 дни: ${eur(soon.reduce((s, u) => s + u.amount, 0))}`,
      detail: soon.map((u) => `${u.date.slice(8, 10)}.${u.date.slice(5, 7)} ${u.debt.name} ${eur(u.amount)}${u.daysLeft < 0 ? " (просрочено?)" : ""}`).join(" · "),
    });
  }

  // 7. Месечният баланс — средно за последните 3 пълни месеца
  const last3 = monthsBefore(today, 3).map((m) => monthSummary(movements, m)).filter((s) => s.clientIncome > 0 || s.out > 0);
  if (last3.length > 0) {
    const avgIn = last3.reduce((s, x) => s + x.clientIncome, 0) / last3.length;
    const avgOut = last3.reduce((s, x) => s + x.out, 0) / last3.length;
    const t = debtTotals(debts);
    const share = avgIn > 0 ? Math.round((t.installmentsCompany / avgIn) * 100) : 100;
    out.push({
      level: avgIn >= avgOut ? "green" : "red",
      title: avgIn >= avgOut ? `Фирмата е на плюс: средно +${eur(avgIn - avgOut)}/мес` : `Средно излизат с ${eur(avgOut - avgIn)}/мес повече, отколкото влизат от клиенти`,
      detail: `Средно за ${last3.length} мес.: от клиенти ${eur(avgIn)}, излезли ${eur(avgOut)}. Вноските по фирмените кредити са ${share} % от прихода${share > 30 ? " — над 30 %, всяка нова продажба отива първо за дълг" : ""}.`,
    });
  }

  // 8. Да се съберат
  const recv = active.filter((d) => d.direction === "receivable" && (d.balance ?? 0) > 0);
  if (recv.length > 0) {
    out.push({
      level: "green",
      title: `Да се съберат: ${eur(recv.reduce((s, d) => s + (d.balance ?? 0), 0))}`,
      detail: recv.map((d) => `${d.name} ${eur(d.balance ?? 0)}`).join(" · "),
      value: r2(recv.reduce((s, d) => s + (d.balance ?? 0), 0)),
    });
  }

  // 9. Лихвите
  const t = debtTotals(debts);
  if (t.interestPerMonth > 0) {
    const cards = active.filter((d) => d.kind === "credit_card" && d.direction === "payable");
    const cardDebt = cards.reduce((s, d) => s + (d.balance ?? 0), 0);
    out.push({
      level: "amber",
      title: `Лихви ≈ ${eur(t.interestPerMonth)}/мес по известните лихвени проценти`,
      detail: cardDebt > 0 ? `Най-скъпи са картите (${eur(cardDebt)} при ~16 %). Първите свободни пари — за тях, после за кредитите.` : "Първите свободни пари — за дълга с най-висока лихва.",
    });
  }

  const order = { red: 0, amber: 1, green: 2 } as const;
  return out.sort((a, b) => order[a.level] - order[b.level]);
}
