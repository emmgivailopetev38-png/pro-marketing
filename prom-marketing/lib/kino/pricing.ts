/**
 * Цената — чисти функции. Една цена, без „премиерна“ (решение на Ивайло,
 * 06.10.2026). Всички суми са крайни, С ДДС. Платеното капаро се приспада
 * от първото плащане.
 *
 * ⚠ ЧЕРНОВА — числата са в lib/kino/config.ts.
 */
import { KINO } from "./config";

export const KINO_PLANS = ["full", "installments", "deposit"] as const;
export type KinoPlan = (typeof KINO_PLANS)[number];

export function isKinoPlan(v: unknown): v is KinoPlan {
  return typeof v === "string" && (KINO_PLANS as readonly string[]).includes(v);
}

type PricesInput = {
  full: number;
  installment: number;
  installments: number;
  deposit: number;
};

export interface PlanQuote {
  plan: KinoPlan;
  /** Stripe Checkout режимът: еднократно или абонамент, който спира сам. */
  mode: "payment" | "subscription";
  /** Колко струва една вноска / еднократното плащане (преди приспадане). */
  unitEur: number;
  /** 1 за еднократно, 3 за вноските. */
  count: number;
  /** Цялата сума за програмата (за CRM-а: стойността на сделката). */
  totalEur: number;
  /** Приспаднатото капаро (влиза в първото плащане). */
  creditEur: number;
  /** Колко се плаща СЕГА. */
  dueNowEur: number;
}

export function quotePlan(plan: KinoPlan, opts: { depositPaidEur?: number } = {}, prices: PricesInput = KINO.prices): PlanQuote {
  const deposit = Math.max(0, opts.depositPaidEur ?? 0);
  if (plan === "deposit") {
    return { plan, mode: "payment", unitEur: prices.deposit, count: 1, totalEur: prices.full, creditEur: 0, dueNowEur: prices.deposit };
  }
  if (plan === "installments") {
    const credit = Math.min(deposit, prices.installment - 1);
    return {
      plan,
      mode: "subscription",
      unitEur: prices.installment,
      count: prices.installments,
      totalEur: prices.installment * prices.installments,
      creditEur: credit,
      dueNowEur: prices.installment - credit,
    };
  }
  const credit = Math.min(deposit, prices.full - 1);
  return { plan, mode: "payment", unitEur: prices.full, count: 1, totalEur: prices.full, creditEur: credit, dueNowEur: prices.full - credit };
}

/**
 * Записването в потока от залата е отворено до срока (replayUntilISO).
 * След него — само личният линк след разговор и платилите капаро.
 */
export function isCartOpen(nowMs: number, opts: { depositPaid?: boolean; personalLink?: boolean } = {}): boolean {
  if (opts.depositPaid || opts.personalLink) return true;
  return nowMs < Date.parse(KINO.screening.replayUntilISO);
}

/** 1900 → „1 900 €“ (с неразделящ интервал, както се пише на български). */
export function formatEur(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  const [int, dec] = String(Math.abs(rounded)).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${rounded < 0 ? "−" : ""}${grouped}${dec ? `,${dec.padEnd(2, "0")}` : ""} €`;
}

/** Името, което човекът вижда в Stripe и в извлечението си. */
export function planProductName(quote: PlanQuote, programName: string = KINO.program.name): string {
  if (quote.plan === "deposit") return `Капаро · място в ${programName} (приспада се)`;
  if (quote.plan === "installments") return `${programName} · ${quote.count} месечни вноски`;
  return `${programName} · пълно плащане`;
}
