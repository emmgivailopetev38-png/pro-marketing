/**
 * Таблото „реклами → записани → разговори → продажби“ (CRM-ът на Стефчо, 26.11.2026).
 *
 * Ивайло: „рекламите и метриките от този CRM автоматично се попълват в това табло,
 * което ще допълним към моя CRM… първо само за мен“. Тук са само сметките (без
 * база, за тестовете). Правилата са взети от неговия CRM (apps/crm/src/lib/metrics.ts
 * и app/(app)/ads/page.tsx): сборовете по кампания / група / реклама, CTR и CPC по
 * кликовете към страницата, честота = показвания ÷ обхват, цена на записан и на
 * разговор, ROAS = приход ÷ разход, червено при CTR < 1 % или CPM над 1,5 × медианата,
 * жълто при честота над 2,5.
 */

export type Nivo = "campaign" | "adset" | "ad";
export type Ton = "dobre" | "sredno" | "zle";

export const div = (a: number | null | undefined, b: number | null | undefined): number | null =>
  a == null || !b ? null : a / b;

/** Ред от синхрона с Meta (ден × реклама); разходът е вече в евро. */
export interface MetaRed {
  day: string;
  campaign_id: string;
  campaign_name: string | null;
  adset_id: string | null;
  adset_name: string | null;
  ad_id: string;
  ad_name: string | null;
  spend_eur: number;
  impressions: number;
  clicks: number;
  /** null — редът е от преди 26.11 (синхронът още не теглеше обхвата и кликовете към страницата) */
  reach: number | null;
  link_clicks: number | null;
  landing_views: number | null;
  registrations: number | null;
}

/** Един записан за уебинара и докъде е стигнал. */
export interface Zapisan {
  /** кодът на рекламата от utm_content (K9, D7…) */
  kod: string | null;
  /** групата от utm_term */
  adsetId: string | null;
  /** денят на записването (София), YYYY-MM-DD */
  den: string;
  /** записал разговор след уебинара */
  chas: boolean;
  kupil: boolean;
  /** € от приетите оферти */
  prihod: number;
}

export interface RedReklama {
  kluch: string;
  ime: string;
  /** групата / кампанията под името */
  pod: string | null;
  kod: string | null;
  razhod: number;
  pokazvaniya: number;
  obhvat: number | null;
  klikove: number;
  /** true — няма кликове към страницата за периода, броят се всички кликове */
  vsichkiKlikove: boolean;
  poseshteniya: number | null;
  metaZapisani: number | null;
  zapisani: number;
  chasove: number;
  kupili: number;
  prihod: number;
  ctr: number | null;
  cpm: number | null;
  cpc: number | null;
  chestota: number | null;
  cenaZapisan: number | null;
  cenaChas: number | null;
  roas: number | null;
}

/** Кирилските букви, които пишем в кода по навик, стават латински (К9 → K9, Д7 → D7). */
export function normKod(s: string | null | undefined): string | null {
  const t = (s ?? "")
    .trim()
    .toUpperCase()
    .replace(/К/g, "K")
    .replace(/Д/g, "D")
    .replace(/Р/g, "R")
    .replace(/А/g, "A")
    .replace(/В/g, "B")
    .replace(/С/g, "C")
    .replace(/Е/g, "E")
    .replace(/М/g, "M")
    .replace(/Т/g, "T")
    .replace(/О/g, "O")
    .replace(/Н/g, "H")
    .replace(/Х/g, "X");
  return t || null;
}

/** „Уебинар 29.11 · K9 · Един час вечер (кола) · кукичка A“ → „K9“. */
export function kodNaReklama(ime: string | null | undefined): string | null {
  if (!ime) return null;
  for (const part of ime.split("·")) {
    const k = normKod(part);
    if (k && /^[A-Z]{1,2}\d{1,2}$/.test(k)) return k;
  }
  return null;
}

/** Датата на уебинара така, както стои в имената на кампаниите („29.11“) — правилото на Стефчо. */
export function etiketNaData(dateISO: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Sofia", day: "2-digit", month: "2-digit" })
      .formatToParts(new Date(dateISO))
      .map((x) => [x.type, x.value])
  );
  return `${p.day}.${p.month}`;
}

/** Денят в София (YYYY-MM-DD). */
export function denSofia(d: Date | string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    typeof d === "string" ? new Date(d) : d
  );
}

export const BEZ_REKLAMA = "—";
export const IZVAN_PERIODA = "?";

const prazen = (kluch: string, ime: string): RedReklama => ({
  kluch,
  ime,
  pod: null,
  kod: null,
  razhod: 0,
  pokazvaniya: 0,
  obhvat: null,
  klikove: 0,
  vsichkiKlikove: false,
  poseshteniya: null,
  metaZapisani: null,
  zapisani: 0,
  chasove: 0,
  kupili: 0,
  prihod: 0,
  ctr: null,
  cpm: null,
  cpc: null,
  chestota: null,
  cenaZapisan: null,
  cenaChas: null,
  roas: null,
});

const plus = (a: number | null, b: number | null): number | null => (a == null && b == null ? null : (a ?? 0) + (b ?? 0));

/** Производните — същите формули като finishAdRow при Стефчо. */
export function dovarshi(r: RedReklama): RedReklama {
  // без разход (директните) цената е „—“, не „0 €“
  const imaRazhod = r.razhod > 0;
  return {
    ...r,
    razhod: Math.round(r.razhod * 100) / 100,
    ctr: div(r.klikove, r.pokazvaniya),
    cpm: imaRazhod && r.pokazvaniya ? (r.razhod / r.pokazvaniya) * 1000 : null,
    cpc: imaRazhod ? div(r.razhod, r.klikove) : null,
    chestota: div(r.pokazvaniya, r.obhvat),
    cenaZapisan: imaRazhod ? div(r.razhod, r.zapisani) : null,
    cenaChas: imaRazhod ? div(r.razhod, r.chasove) : null,
    roas: div(r.prihod, r.razhod),
  };
}

/** Преди уебинара продажби няма по правило — ROAS е „—“, не червено „0×“. */
export function bezRoasPrediUebinara<T extends { redove: RedReklama[]; obshto: RedReklama }>(x: T, predi: boolean): T {
  if (!predi) return x;
  const chist = (r: RedReklama) => (r.prihod > 0 ? r : { ...r, roas: null });
  return { ...x, redove: x.redove.map(chist), obshto: chist(x.obshto) };
}

/**
 * Сборът по кампания / група / реклама: разходът от Meta + какво са донесли в CRM-а.
 * Записаният се връзва към рекламата по кода в utm_content (K9 ↔ „… · K9 · …“), към
 * групата — по групата на тази реклама (или utm_term), към кампанията — по кампанията ѝ.
 */
export function sabiraiReklami(meta: MetaRed[], zapisani: Zapisan[], nivo: Nivo): { redove: RedReklama[]; obshto: RedReklama } {
  // кодът → групата и кампанията му (по последния ден с разход)
  const poKod = new Map<string, MetaRed>();
  const grupaKamp = new Map<string, string>();
  for (const m of [...meta].sort((a, b) => a.day.localeCompare(b.day))) {
    const k = kodNaReklama(m.ad_name);
    if (k) poKod.set(k, m);
    if (m.adset_id) grupaKamp.set(m.adset_id, m.campaign_id);
  }

  const kluchMeta = (m: MetaRed): string =>
    nivo === "ad" ? (kodNaReklama(m.ad_name) ?? m.ad_id) : nivo === "adset" ? (m.adset_id ?? BEZ_REKLAMA) : m.campaign_id;

  const kluchZapis = (z: Zapisan): string => {
    const m = z.kod ? poKod.get(z.kod) : undefined;
    if (nivo === "ad") return z.kod ?? BEZ_REKLAMA;
    if (nivo === "adset") return m?.adset_id ?? z.adsetId ?? (z.kod ? IZVAN_PERIODA : BEZ_REKLAMA);
    return m?.campaign_id ?? (z.adsetId ? grupaKamp.get(z.adsetId) : undefined) ?? (z.kod || z.adsetId ? IZVAN_PERIODA : BEZ_REKLAMA);
  };

  const out = new Map<string, RedReklama & { _imaLink: boolean; _imaVsichki: boolean }>();
  const posledenDen = new Map<string, string>();
  for (const m of meta) {
    const kluch = kluchMeta(m);
    let r = out.get(kluch);
    if (!r) {
      r = { ...prazen(kluch, kluch), _imaLink: false, _imaVsichki: false };
      out.set(kluch, r);
    }
    // името — от последния ден (ако е преименувано, важи новото)
    if (m.day >= (posledenDen.get(kluch) ?? "")) {
      posledenDen.set(kluch, m.day);
      if (nivo === "ad") {
        r.ime = m.ad_name ?? m.ad_id;
        r.pod = m.adset_name;
        r.kod = kodNaReklama(m.ad_name);
      } else if (nivo === "adset") {
        r.ime = m.adset_name ?? m.adset_id ?? "Без група";
        r.pod = m.campaign_name;
      } else {
        r.ime = m.campaign_name ?? m.campaign_id;
      }
    }
    r.razhod += Number(m.spend_eur) || 0;
    r.pokazvaniya += Number(m.impressions) || 0;
    r.obhvat = plus(r.obhvat, m.reach);
    if (m.link_clicks != null) {
      r.klikove += m.link_clicks;
      r._imaLink = true;
    } else {
      r.klikove += Number(m.clicks) || 0;
      r._imaVsichki = true;
    }
    r.poseshteniya = plus(r.poseshteniya, m.landing_views);
    r.metaZapisani = plus(r.metaZapisani, m.registrations);
  }

  for (const z of zapisani) {
    const kluch = kluchZapis(z);
    let r = out.get(kluch);
    if (!r) {
      const ime = kluch === BEZ_REKLAMA ? "Без реклама (директно, органично)" : kluch === IZVAN_PERIODA ? "От реклама без разход в периода" : kluch;
      r = { ...prazen(kluch, ime), _imaLink: false, _imaVsichki: false };
      if (nivo === "ad" && kluch !== BEZ_REKLAMA) r.kod = kluch;
      out.set(kluch, r);
    }
    r.zapisani += 1;
    if (z.chas) r.chasove += 1;
    if (z.kupil) r.kupili += 1;
    r.prihod += z.prihod;
  }

  const redove = [...out.values()]
    .map(({ _imaLink, _imaVsichki, ...r }) => dovarshi({ ...r, vsichkiKlikove: _imaVsichki && !_imaLink }))
    .sort((a, b) => b.razhod - a.razhod || b.zapisani - a.zapisani);

  const obshto = dovarshi(
    redove.reduce(
      (t, r) => ({
        ...t,
        razhod: t.razhod + r.razhod,
        pokazvaniya: t.pokazvaniya + r.pokazvaniya,
        obhvat: plus(t.obhvat, r.obhvat),
        klikove: t.klikove + r.klikove,
        vsichkiKlikove: t.vsichkiKlikove || r.vsichkiKlikove,
        poseshteniya: plus(t.poseshteniya, r.poseshteniya),
        metaZapisani: plus(t.metaZapisani, r.metaZapisani),
        zapisani: t.zapisani + r.zapisani,
        chasove: t.chasove + r.chasove,
        kupili: t.kupili + r.kupili,
        prihod: t.prihod + r.prihod,
      }),
      prazen("obshto", "Общо")
    )
  );
  return { redove, obshto };
}

/** Медианата на CPM (за червеното / зеленото като при Стефчо). */
export function medianaCpm(redove: RedReklama[]): number | null {
  const s = redove.map((r) => r.cpm).filter((v): v is number => v != null).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
}

export function tonCtr(ctr: number | null): Ton | null {
  if (ctr == null) return null;
  return ctr < 0.01 ? "zle" : ctr >= 0.02 ? "dobre" : null;
}

export function tonCpm(cpm: number | null, mediana: number | null): Ton | null {
  if (cpm == null || mediana == null) return null;
  return cpm > mediana * 1.5 ? "zle" : cpm < mediana * 0.67 ? "dobre" : null;
}

export function tonChestota(f: number | null): Ton | null {
  return f != null && f > 2.5 ? "sredno" : null;
}

/** Цената на записан — целта на Йончев е 1–5 €. */
export function tonCenaZapisan(c: number | null): Ton | null {
  if (c == null) return null;
  return c <= 5 ? "dobre" : c <= 8 ? "sredno" : "zle";
}

/** ROAS — при Стефчо ≥ 1 е зелено, целта на Йончев е ≥ 3. */
export function tonRoas(r: number | null): Ton | null {
  if (r == null) return null;
  return r >= 3 ? "dobre" : r >= 1 ? "sredno" : "zle";
}

/** Opt-in (посетители → записани) — Йончев: 15–20 %. */
export function tonOptIn(p: number | null): Ton | null {
  if (p == null) return null;
  return p >= 0.15 ? "dobre" : p >= 0.1 ? "sredno" : "zle";
}

/** Разходът и записаните по дни (за графиката). */
export function poDni(meta: MetaRed[], zapisani: Zapisan[]): { den: string; razhod: number; zapisani: number }[] {
  const m = new Map<string, { den: string; razhod: number; zapisani: number }>();
  const get = (den: string) => {
    let r = m.get(den);
    if (!r) m.set(den, (r = { den, razhod: 0, zapisani: 0 }));
    return r;
  };
  for (const x of meta) get(x.day).razhod += Number(x.spend_eur) || 0;
  for (const z of zapisani) get(z.den).zapisani += 1;
  return [...m.values()].map((r) => ({ ...r, razhod: Math.round(r.razhod * 100) / 100 })).sort((a, b) => a.den.localeCompare(b.den));
}
