/**
 * „Бизнесът“ — цялата картина за мениджърите на продажбите (24.11.2026, след
 * срещата с RevStream): колко е струвала рекламата до стотинка, колко лийда е
 * донесла всяка кампания и всяка реклама, колко от тях са стигнали до среща и
 * до клиент — по месеци. Чисти функции, без база.
 *
 * Мярката, която решава, е € на ПРОВЕДЕНА среща (не € на лийд): евтин лийд,
 * който не идва на среща, е скъп.
 */

export interface MonthAgg {
  month: string;
  /** разход за наши лийдове: в долари (както таксува Meta) и в евро по 1,17 */
  usd: number;
  eur: number;
  /** лийдове от реклами в CRM-а (нови картони) и по самата Meta */
  leads: number;
  metaLeads: number;
  booked: number;
  held: number;
  noShow: number;
  won: number;
  wonValue: number;
}

export function emptyMonth(month: string): MonthAgg {
  return { month, usd: 0, eur: 0, leads: 0, metaLeads: 0, booked: 0, held: 0, noShow: 0, won: 0, wonValue: 0 };
}

/** „2026-11“ за ISO дата — по София. */
export function monthKey(iso: string): string {
  return new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Sofia" }).slice(0, 7);
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 15)).toLocaleDateString("bg-BG", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Делене до стотинка; null при нула. */
export function per(amount: number, n: number): number | null {
  return n > 0 && amount > 0 ? Math.round((amount / n) * 100) / 100 : null;
}

export function pctOf(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 1000) / 10 : null;
}

export interface Totals {
  usd: number;
  eur: number;
  leads: number;
  metaLeads: number;
  booked: number;
  held: number;
  noShow: number;
  won: number;
  wonValue: number;
}

export function totalsOf(months: MonthAgg[]): Totals {
  const t: Totals = { usd: 0, eur: 0, leads: 0, metaLeads: 0, booked: 0, held: 0, noShow: 0, won: 0, wonValue: 0 };
  for (const m of months) {
    t.usd += m.usd;
    t.eur += m.eur;
    t.leads += m.leads;
    t.metaLeads += m.metaLeads;
    t.booked += m.booked;
    t.held += m.held;
    t.noShow += m.noShow;
    t.won += m.won;
    t.wonValue += m.wonValue;
  }
  t.usd = Math.round(t.usd * 100) / 100;
  t.eur = Math.round(t.eur * 100) / 100;
  return t;
}

/**
 * Напред: колко лийда и колко реклама трябват за N продажби на месец при
 * сегашните проценти. Връща null, ако още няма от какво да се смята.
 */
export function forecast(t: Pick<Totals, "eur" | "leads" | "held" | "won">, sales: number): { leads: number; held: number; eur: number } | null {
  if (t.leads === 0 || t.held === 0 || t.won === 0) return null;
  const heldPerLead = t.held / t.leads;
  const wonPerHeld = t.won / t.held;
  const held = Math.ceil(sales / wonPerHeld);
  const leads = Math.ceil(held / heldPerLead);
  const cpl = t.eur / t.leads;
  return { leads, held, eur: Math.round(leads * cpl) };
}

export interface AdRow {
  ad: string;
  campaign: string;
  leads: number;
  held: number;
  won: number;
  first: string;
  last: string;
  /** разход на рекламата — само ако синхронът по реклами вече има данни */
  usd: number | null;
  eur: number | null;
}
