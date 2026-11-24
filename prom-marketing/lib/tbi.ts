/**
 * TBI Bank — плащане на вноски. ПроМаркетинг е търговец-партньор от
 * 21.10.2026 (портал bnkl.tbibank.bg, търговец № 17342, магазин BICZ).
 *
 * Схемите (от портала, 21.10.2026):
 *  - ГПР 19,47 % — от 3 до 48 месеца, само за суми над 2 000 €;
 *  - ГПР 23,79 % — от 3 до 60 месеца, за всяка сума.
 * 0 % схема няма; онлайн линк от сайта няма (ecommerce: false) — заявката се
 * пуска от портала.
 *
 * Вноската е анюитет: r = (1 + ГПР)^(1/12) − 1. Сверено с калкулатора в
 * портала (без застраховка): 3 900 € × 6 м. = 684,40 €/мес (общо 4 106,38) и
 * 2 000 € × 12 м. по 23,79 % = 186,74 €/мес.
 *
 * Паролата за портала НЕ стои тук и не се пише в имейли — дава я Ивайло лично.
 */
export const TBI_PORTAL_URL = "https://bnkl.tbibank.bg";
export const TBI_USER = "BICZ";

export interface TbiScheme {
  apr: number;
  label: string;
  /** най-малката сума за схемата */
  minAmount: number;
  maxMonths: number;
}

export const TBI_LOW: TbiScheme = { apr: 19.47, label: "ГПР 19,47 %", minAmount: 2000, maxMonths: 48 };
export const TBI_HIGH: TbiScheme = { apr: 23.79, label: "ГПР 23,79 %", minAmount: 0, maxMonths: 60 };

/** Сроковете, които се казват на клиента. */
export const TBI_TERMS = [6, 12, 24, 36, 48] as const;

/** По-евтината схема, която важи за тази сума и срок. */
export function tbiSchemeFor(amount: number, months: number): TbiScheme {
  if (amount >= TBI_LOW.minAmount && months <= TBI_LOW.maxMonths) return TBI_LOW;
  return TBI_HIGH;
}

/** Месечната вноска (анюитет), без закръгляне. */
export function tbiMonthly(amount: number, months: number, apr: number): number {
  if (!(amount > 0) || !(months > 0)) return 0;
  const r = Math.pow(1 + apr / 100, 1 / 12) - 1;
  if (r <= 0) return amount / months;
  return (amount * r) / (1 - Math.pow(1 + r, -months));
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface TbiRow {
  months: number;
  monthly: number;
  total: number;
  scheme: TbiScheme;
}

/** Таблицата за една сума: срок → вноска на месец и общо за клиента. */
export function tbiTable(amount: number, terms: readonly number[] = TBI_TERMS): TbiRow[] {
  return terms
    .filter((m) => m >= 3 && m <= TBI_HIGH.maxMonths)
    .map((months) => {
      const scheme = tbiSchemeFor(amount, months);
      const monthly = round2(tbiMonthly(amount, months, scheme.apr));
      return { months, monthly, total: round2(monthly * months), scheme };
    });
}
