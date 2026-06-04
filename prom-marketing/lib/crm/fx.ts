// Currency conversion to EUR.
//
// The Bulgarian lev (BGN) is irrevocably pegged to the euro at the official
// rate 1 EUR = 1.95583 BGN (currency board / euro adoption). This rate does
// NOT float, so the "current" lev↔euro rate is always exactly this number —
// there is nothing to fetch daily, and using a daily source only risks a wrong
// value. For any other (genuinely floating) currency, the caller may pass an
// explicit `rateOverride` (units of that currency per 1 EUR).
//
// Model: every amount is stored in EUR; the original amount/currency/rate is
// preserved so nothing from the source document is ever lost.

export const EUR_BGN_RATE = 1.95583;

/** Fixed, non-floating rates (units of currency per 1 EUR). */
const FIXED_RATES: Record<string, number> = {
  EUR: 1,
  BGN: EUR_BGN_RATE,
};

export interface FxResult {
  /** Amount converted to EUR, rounded to 2 decimals (null if input absent). */
  amount_eur: number | null;
  /** The original amount, unchanged. */
  original_amount: number | null;
  /** The original currency (upper-cased). */
  original_currency: string;
  /** Units of original currency per 1 EUR (e.g. BGN → 1.95583). */
  fx_rate: number;
  /** Provenance of the rate: none | fixed_eur_bgn_1.95583 | provided | unconverted. */
  fx_source: string;
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Convert `amount` given in `currency` to EUR.
 * - EUR → identity (fx_source "none").
 * - BGN → fixed peg 1.95583 (fx_source "fixed_eur_bgn_1.95583").
 * - other currency with a positive `rateOverride` → uses it (fx_source "provided").
 * - unknown currency, no override → kept 1:1 and flagged "unconverted" so a human
 *   can spot it (never silently mislabels a foreign amount as converted).
 */
export function toEur(
  amount: number | null | undefined,
  currency: string | null | undefined,
  rateOverride?: number | null
): FxResult {
  const cur = (currency || "EUR").trim().toUpperCase();
  const amt =
    amount === null || amount === undefined || !Number.isFinite(Number(amount)) ? null : Number(amount);

  let rate: number;
  let source: string;
  if (cur === "EUR") {
    rate = 1;
    source = "none";
  } else if (rateOverride && rateOverride > 0) {
    rate = rateOverride;
    source = "provided";
  } else if (FIXED_RATES[cur]) {
    rate = FIXED_RATES[cur];
    source = cur === "BGN" ? "fixed_eur_bgn_1.95583" : `fixed_${cur.toLowerCase()}`;
  } else {
    rate = 1;
    source = "unconverted";
  }

  const amount_eur = amt === null ? null : round2(amt / rate);
  return { amount_eur, original_amount: amt, original_currency: cur, fx_rate: rate, fx_source: source };
}

/** Convert a secondary amount (net/VAT) using the SAME rate as the gross line. */
export function convertWith(amount: number | null | undefined, rate: number): number | null {
  if (amount === null || amount === undefined) return null;
  const n = Number(amount);
  if (!Number.isFinite(n) || !rate) return null;
  return round2(n / rate);
}

/**
 * Build the FX columns to persist on a financial row.
 * Returns nulls when the source was already EUR (nothing to preserve).
 */
export function fxColumns(fx: FxResult): {
  original_amount: number | null;
  original_currency: string | null;
  fx_rate: number | null;
  fx_source: string | null;
} {
  if (fx.original_currency === "EUR") {
    return { original_amount: null, original_currency: null, fx_rate: null, fx_source: null };
  }
  return {
    original_amount: fx.original_amount,
    original_currency: fx.original_currency,
    fx_rate: fx.fx_rate,
    fx_source: fx.fx_source,
  };
}
