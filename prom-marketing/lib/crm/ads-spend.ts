/**
 * Рекламният разход — чистите правила.
 *
 * Отговаря на въпроса „колко ми излиза един лийд, една среща и един клиент“.
 * Разходът идва суров от Meta (ден × кампания) и се дели по предназначение:
 * в цената на резултата влиза САМО това, което сме похарчили за собствени
 * лийдове. Кампанията на клиент (къщата на Белцов), собственият магазин
 * (Green Elexir) и обявата за клоузър се броят отделно — иначе цената на
 * лийда излиза по-висока, отколкото е.
 */

/** Курсът, по който са планирани бюджетите в акаунта: 1 EUR = 1.17 USD. */
export const USD_PER_EUR = 1.17;

export type AdPurpose = "leads" | "client" | "shop" | "hiring" | "other";

export const AD_PURPOSES: readonly AdPurpose[] = ["leads", "client", "shop", "hiring", "other"] as const;

export const PURPOSE_LABEL: Record<AdPurpose, string> = {
  leads: "Наши лийдове",
  client: "Кампания на клиент",
  shop: "Наш магазин",
  hiring: "Търсим човек",
  other: "Неразпределено",
};

/**
 * Правилата се четат отгоре надолу — първото съвпадение печели.
 * Нарочно НЕ слагаме „всичко останало е наш лийд“: непозната кампания отива в
 * `other` и се вижда отделно на таблото. По-добре Ивайло да види неразпределен
 * разход, отколкото цената на лийда да се качи тихо заради чужда кампания.
 */
const RULES: Array<{ purpose: AdPurpose; test: RegExp }> = [
  { purpose: "client", test: /белцов|belcov|къща|kashta|homers|йовчев/i },
  { purpose: "shop", test: /хидра|hidra|водостру|green\s*elexir|greenelexir|elexir|proofout|sleep\b/i },
  { purpose: "hiring", test: /клоузър|klouz|мастър\s*клас|master\s*klas|търси се|набиране/i },
  { purpose: "leads", test: /promarketing|pro\s*marketing|про\s*маркетинг/i },
  // ⚠️ `\b` не лови кирилица (\w е само латиница) — затова границата е изрична.
  { purpose: "leads", test: /(^|\s)ай(\s|$)|(^|\s)crm\s*ai|автоматизации|сайт лийдове|уебинар|ai одит|услуги по мярка|инсталация за 1 ден|следи камерите|ремаркетинг|trading\s*bot|trading\s*agent/i },
];

/** За какво е похарчена тази кампания — по името ѝ. */
export function classifyCampaign(name: string | null | undefined): AdPurpose {
  const n = (name ?? "").trim();
  if (!n) return "other";
  for (const r of RULES) {
    if (r.test.test(n)) return r.purpose;
  }
  return "other";
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Разходът в евро. Акаунтът е в долари; други валути минават по подадения курс. */
export function toEur(amount: number, currency: string, usdPerEur: number = USD_PER_EUR): { spend_eur: number; fx_rate: number; fx_source: string } {
  const cur = (currency || "USD").toUpperCase();
  if (cur === "EUR") return { spend_eur: round2(amount), fx_rate: 1, fx_source: "none" };
  if (cur === "USD") return { spend_eur: round2(amount / usdPerEur), fx_rate: usdPerEur, fx_source: `usd_per_eur_${usdPerEur}` };
  return { spend_eur: round2(amount), fx_rate: 1, fx_source: "unconverted" };
}

export interface SpendRow {
  day: string;
  campaign_id: string;
  campaign_name: string | null;
  purpose: AdPurpose;
  spend: number;
  spend_eur: number;
  impressions: number;
  clicks: number;
  leads: number;
}

export interface SpendSummary {
  /** разход в евро, който влиза в цената на резултата (само наши лийдове) */
  leadsEur: number;
  /** целият разход в акаунта за периода */
  totalEur: number;
  byPurpose: Array<{ purpose: AdPurpose; label: string; eur: number }>;
  byCampaign: Array<{ campaign_id: string; name: string; purpose: AdPurpose; eur: number; impressions: number; clicks: number; metaLeads: number }>;
  /** последният ден, за който има данни — казва дали синхронът е жив */
  lastDay: string | null;
}

/** Сумира редовете: колко за наши лийдове, колко общо, и по кампании. */
export function summarize(rows: SpendRow[]): SpendSummary {
  const byPurpose = new Map<AdPurpose, number>();
  const byCampaign = new Map<string, { campaign_id: string; name: string; purpose: AdPurpose; eur: number; impressions: number; clicks: number; metaLeads: number }>();
  let totalEur = 0;
  let lastDay: string | null = null;
  for (const r of rows) {
    const eur = Number(r.spend_eur) || 0;
    totalEur += eur;
    byPurpose.set(r.purpose, (byPurpose.get(r.purpose) ?? 0) + eur);
    const c = byCampaign.get(r.campaign_id) ?? {
      campaign_id: r.campaign_id,
      name: r.campaign_name ?? r.campaign_id,
      purpose: r.purpose,
      eur: 0,
      impressions: 0,
      clicks: 0,
      metaLeads: 0,
    };
    c.eur += eur;
    c.impressions += Number(r.impressions) || 0;
    c.clicks += Number(r.clicks) || 0;
    c.metaLeads += Number(r.leads) || 0;
    byCampaign.set(r.campaign_id, c);
    if (!lastDay || r.day > lastDay) lastDay = r.day;
  }
  return {
    leadsEur: round2(byPurpose.get("leads") ?? 0),
    totalEur: round2(totalEur),
    byPurpose: AD_PURPOSES.filter((p) => (byPurpose.get(p) ?? 0) > 0).map((p) => ({ purpose: p, label: PURPOSE_LABEL[p], eur: round2(byPurpose.get(p) ?? 0) })),
    byCampaign: [...byCampaign.values()].map((c) => ({ ...c, eur: round2(c.eur) })).sort((a, b) => b.eur - a.eur),
    lastDay,
  };
}

/**
 * Свеж ли е синхронът: има ли данни за вчера или днес.
 * Ако не — таблото го казва, за да не се чете стара цена като днешна.
 */
export function isFresh(lastDay: string | null, today: Date = new Date()): boolean {
  if (!lastDay) return false;
  const yesterday = new Date(today.getTime() - 36 * 3_600_000).toISOString().slice(0, 10);
  return lastDay >= yesterday;
}
