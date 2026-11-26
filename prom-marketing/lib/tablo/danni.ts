import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { NA_ZHIVO } from "@/lib/uebinar/na-zhivo";
import { zarediFuniyata, type Sastoyanie } from "@/lib/uebinar/prisastvie";
import { kluchImeil, kluchTelefon, type Ocenka } from "@/lib/uebinar/prisastvie-rules";
import {
  denSofia,
  div,
  etiketNaData,
  kodNaReklama,
  normKod,
  poDni,
  sabiraiReklami,
  tonCenaZapisan,
  tonOptIn,
  tonRoas,
  type MetaRed,
  type Nivo,
  type RedReklama,
  type Ton,
  type Zapisan,
} from "./metriki";

/**
 * Данните за таблото /admin/tablo (по CRM-а на Стефчо, 26.11.2026).
 *
 * Всичко се попълва само:
 *  - рекламите — синхронът с Meta на сървъра (/root/ads-spend-sync.py, всеки час)
 *    → ad_spend_ads_daily; кампаниите на уебинара се познават по датата в името
 *    („29.11“), както при Стефчо;
 *  - записаните, разговорите, офертите и плащанията — от CRM-а, на живо;
 *  - кой е дошъл и до кога е стоял — от Notifier (uebinar_prisastvie, кронът /api/cron/uebinar).
 */

export type Period = "vsichko" | "dnes" | "vchera" | "3";

export const PERIODI: readonly { kluch: Period; ime: string }[] = [
  { kluch: "vsichko", ime: "От старта" },
  { kluch: "dnes", ime: "Днес" },
  { kluch: "vchera", ime: "Вчера" },
  { kluch: "3", ime: "Последните 3 дни" },
] as const;

export interface StapkaFunia {
  kluch: string;
  ime: string;
  stoinost: number | null;
  /** процентът и от какво е */
  p: number | null;
  ot: string;
  cel: string | null;
  ton: Ton | null;
  belezhka?: string;
}

export interface Kupuvach {
  ime: string;
  kod: string | null;
  reklama: string | null;
  suma: number;
  koga: string | null;
}

export interface Tablo {
  uebinar: { ime: string; dataLabel: string; etiket: string; sastoyanie: Sastoyanie };
  period: Period;
  den: { ot: string | null; do: string | null };
  sinhron: { posledno: string | null; minutiPredi: number | null; imaNoviteMetriki: boolean };
  reklami: Record<Nivo, { redove: RedReklama[]; obshto: RedReklama }>;
  dni: { den: string; razhod: number; zapisani: number }[];
  marketing: {
    razhod: number;
    zapisani: number;
    metaZapisani: number | null;
    cenaZapisan: number | null;
    tonCenaZapisan: Ton | null;
    chasove: number;
    cenaChas: number | null;
    kupili: number;
    cac: number | null;
    prihod: number;
    roas: number | null;
    tonRoas: Ton | null;
  };
  pari: { prodadeno: number; plateno: number; kupili: number };
  funia: StapkaFunia[];
  kupuvachi: Kupuvach[];
  sobstveniPoseshteniya: number | null;
}

type Sb = ReturnType<typeof createServiceClient>;

const CHAS = 60 * 60_000;

function diapazon(p: Period, now: Date): { ot: string | null; do: string | null } {
  const dnes = denSofia(now);
  const predi = (n: number) => denSofia(new Date(now.getTime() - n * 24 * CHAS));
  if (p === "dnes") return { ot: dnes, do: dnes };
  if (p === "vchera") return { ot: predi(1), do: predi(1) };
  if (p === "3") return { ot: predi(2), do: dnes };
  return { ot: null, do: null };
}

const vDiapazona = (den: string, d: { ot: string | null; do: string | null }) => (!d.ot || den >= d.ot) && (!d.do || den <= d.do);

/** Голям списък от id-та на парчета (PostgREST има ограничение за дължината на адреса). */
async function poParcheta<T>(ids: string[], fn: (part: string[]) => PromiseLike<{ data: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 100) {
    const { data } = await fn(ids.slice(i, i + 100));
    out.push(...((data ?? []) as T[]));
  }
  return out;
}

async function metaRedove(sb: Sb, etiket: string): Promise<(MetaRed & { synced_at: string | null })[]> {
  const { data, error } = await sb
    .from("ad_spend_ads_daily")
    .select("day, campaign_id, campaign_name, adset_id, adset_name, ad_id, ad_name, spend_eur, impressions, clicks, reach, link_clicks, landing_views, registrations, synced_at")
    .or(`ad_name.ilike.%${etiket}%,campaign_name.ilike.%${etiket}%`)
    .order("day", { ascending: true })
    .limit(5000);
  if (error) throw new Error(`ad_spend_ads_daily: ${error.message}`);
  return ((data ?? []) as Array<Record<string, unknown>>).map((r) => ({
    day: String(r.day).slice(0, 10),
    campaign_id: String(r.campaign_id),
    campaign_name: (r.campaign_name as string | null) ?? null,
    adset_id: (r.adset_id as string | null) ?? null,
    adset_name: (r.adset_name as string | null) ?? null,
    ad_id: String(r.ad_id),
    ad_name: (r.ad_name as string | null) ?? null,
    spend_eur: Number(r.spend_eur) || 0,
    impressions: Number(r.impressions) || 0,
    clicks: Number(r.clicks) || 0,
    reach: r.reach == null ? null : Number(r.reach),
    link_clicks: r.link_clicks == null ? null : Number(r.link_clicks),
    landing_views: r.landing_views == null ? null : Number(r.landing_views),
    registrations: r.registrations == null ? null : Number(r.registrations),
    synced_at: (r.synced_at as string | null) ?? null,
  }));
}

interface ZapisanPalen extends Zapisan {
  contactId: string;
  ime: string | null;
  kupilKoga: string | null;
}

/** Записаните за този уебинар, всеки веднъж, с рекламата и докъде е стигнал след уебинара. */
async function zapisaniSDvizhenie(sb: Sb, startMs: number): Promise<ZapisanPalen[]> {
  const { data: akt } = await sb
    .from("contact_activities")
    .select("contact_id, created_at, metadata")
    .eq("activity_type", "uebinar_registration")
    // изданието се познава по датата (както във фунията на /ekip/uebinar)
    .eq("metadata->>date_iso", NA_ZHIVO.dateISO)
    .order("occurred_at", { ascending: true })
    .limit(5000);
  const parvi = new Map<string, { created_at: string; metadata: Record<string, unknown> | null }>();
  for (const a of (akt ?? []) as Array<{ contact_id: string | null; created_at: string; metadata: Record<string, unknown> | null }>) {
    if (a.contact_id && !parvi.has(a.contact_id)) parvi.set(a.contact_id, a);
  }
  const ids = [...parvi.keys()];
  if (!ids.length) return [];

  const sled = new Date(startMs - CHAS).toISOString();
  const kontakti = await poParcheta<{ id: string; full_name: string | null; email: string | null; phone: string | null; stage: string | null }>(ids, (part) =>
    sb.from("contacts").select("id, full_name, email, phone, stage").in("id", part)
  );
  const poImeil = new Map<string, string>();
  const poTelefon = new Map<string, string>();
  for (const k of kontakti) {
    const e = kluchImeil(k.email);
    const t = kluchTelefon(k.phone);
    if (e) poImeil.set(e, k.id);
    if (t) poTelefon.set(t, k.id);
  }

  const [{ data: chasove }, oferti] = await Promise.all([
    sb.from("bookings").select("attendee_email, attendee_phone, status").gte("created_at", sled).neq("status", "cancelled").limit(2000),
    poParcheta<{ contact_id: string; amount_gross: number | null; accepted_at: string | null }>(ids, (part) =>
      sb.from("offers").select("contact_id, amount_gross, accepted_at").in("contact_id", part).eq("status", "accepted").gte("accepted_at", sled)
    ),
  ]);
  const sChas = new Set<string>();
  for (const b of (chasove ?? []) as Array<{ attendee_email: string | null; attendee_phone: string | null }>) {
    const id = (kluchImeil(b.attendee_email) && poImeil.get(kluchImeil(b.attendee_email)!)) || (kluchTelefon(b.attendee_phone) && poTelefon.get(kluchTelefon(b.attendee_phone)!));
    if (id) sChas.add(id);
  }
  const prihod = new Map<string, { suma: number; koga: string | null }>();
  for (const o of oferti) {
    const cur = prihod.get(o.contact_id) ?? { suma: 0, koga: null };
    cur.suma += Number(o.amount_gross) || 0;
    if (o.accepted_at && (!cur.koga || o.accepted_at > cur.koga)) cur.koga = o.accepted_at;
    prihod.set(o.contact_id, cur);
  }
  const poId = new Map(kontakti.map((k) => [k.id, k]));

  return ids.map((id) => {
    const a = parvi.get(id)!;
    const m = a.metadata ?? {};
    const term = typeof m.utm_term === "string" && /^\d{6,}$/.test(m.utm_term) ? m.utm_term : null;
    const k = poId.get(id);
    const p = prihod.get(id);
    const kupil = k?.stage === "won" || !!p;
    return {
      contactId: id,
      ime: k?.full_name ?? (typeof m.full_name === "string" ? m.full_name : null),
      kod: typeof m.utm_content === "string" ? normKod(m.utm_content) : null,
      adsetId: term,
      den: denSofia(a.created_at),
      chas: sChas.has(id),
      kupil,
      prihod: p?.suma ?? 0,
      kupilKoga: p?.koga ?? null,
    };
  });
}

const OCENKA_TON: Record<Ocenka, Ton> = { dobre: "dobre", sredno: "sredno", zle: "zle" };

export async function zarediTablo(period: Period, now: Date = new Date()): Promise<Tablo> {
  const sb = createServiceClient();
  const etiket = etiketNaData(NA_ZHIVO.dateISO);
  const startMs = Date.parse(NA_ZHIVO.dateISO);
  const d = diapazon(period, now);

  const [meta, zapisani, funiyata, ab] = await Promise.all([
    metaRedove(sb, etiket),
    zapisaniSDvizhenie(sb, startMs),
    zarediFuniyata(now).catch(() => null),
    sb.from("uebinar_ab").select("vid", { count: "exact", head: true }).eq("sabitie", "vizita"),
  ]);

  const metaP = meta.filter((m) => vDiapazona(m.day, d));
  const zapisaniP = zapisani.filter((z) => vDiapazona(z.den, d));
  const reklami = {
    campaign: sabiraiReklami(metaP, zapisaniP, "campaign"),
    adset: sabiraiReklami(metaP, zapisaniP, "adset"),
    ad: sabiraiReklami(metaP, zapisaniP, "ad"),
  };
  const t = reklami.campaign.obshto;

  // Синхронът: кога е обновен и дали вече тегли новите полета (обхват, кликове към страницата).
  const posledno = meta.reduce<string | null>((x, m) => (m.synced_at && (!x || m.synced_at > x) ? m.synced_at : x), null);
  const imaNoviteMetriki = meta.some((m) => m.link_clicks != null);

  // Фунията — за целия уебинар, без значение от периода (като при Стефчо: една фуния на уебинар).
  const vsichko = sabiraiReklami(meta, zapisani, "campaign").obshto;
  const posetiteli = vsichko.poseshteniya ?? (vsichko.klikove || null);
  const imePosetiteli = vsichko.poseshteniya != null ? "Посетители от рекламите" : "Кликове към страницата";
  const predi = funiyata?.sastoyanie !== "sled";
  const stapka = (key: string) => funiyata?.stapki.find((s) => s.key === key);
  const sledStapka = (kluch: string, ime: string): StapkaFunia => {
    const s = stapka(kluch);
    return {
      kluch,
      ime,
      stoinost: predi ? null : (s?.a ?? null),
      p: predi || s?.p == null ? null : s.p / 100,
      ot: s?.ot ?? "",
      cel: s ? `${s.cel} %` : null,
      ton: !predi && s?.ocenka ? OCENKA_TON[s.ocenka] : null,
      belezhka: predi ? "след уебинара" : undefined,
    };
  };
  const optIn = div(zapisani.length, posetiteli);
  const funia: StapkaFunia[] = [
    { kluch: "posetiteli", ime: imePosetiteli, stoinost: posetiteli, p: null, ot: "по Meta", cel: null, ton: null },
    { kluch: "zapisani", ime: "Записани", stoinost: zapisani.length, p: optIn, ot: "от посетителите", cel: "15–20 %", ton: tonOptIn(optIn) },
    sledStapka("doshli", "Дошли на живо"),
    sledStapka("do_ofertata", "Стояха до офертата"),
    sledStapka("chas", "Записаха разговор"),
    sledStapka("yavili", "Дойдоха на разговора"),
    sledStapka("kupili", "Купиха"),
  ];

  const kupili = zapisani.filter((z) => z.kupil);
  const { data: plashtania } = kupili.length
    ? await sb
        .from("payments")
        .select("amount, contact_id")
        .in("contact_id", kupili.map((z) => z.contactId))
        .gte("paid_at", new Date(startMs - CHAS).toISOString())
    : { data: [] as Array<{ amount: number | null }> };

  const imeNaKod = new Map<string, string>();
  for (const m of meta) {
    const k = kodNaReklama(m.ad_name);
    if (k && m.ad_name) imeNaKod.set(k, m.ad_name);
  }

  const chasoveP = zapisaniP.filter((z) => z.chas).length;
  const kupiliP = zapisaniP.filter((z) => z.kupil).length;
  const prihodP = zapisaniP.reduce((s, z) => s + z.prihod, 0);

  return {
    uebinar: { ime: NA_ZHIVO.name, dataLabel: NA_ZHIVO.dateLabel, etiket, sastoyanie: funiyata?.sastoyanie ?? (now.getTime() < startMs ? "predi" : "sled") },
    period,
    den: d,
    sinhron: { posledno, minutiPredi: posledno ? Math.round((now.getTime() - Date.parse(posledno)) / 60_000) : null, imaNoviteMetriki },
    reklami,
    dni: poDni(metaP, zapisaniP),
    marketing: {
      razhod: t.razhod,
      zapisani: zapisaniP.length,
      metaZapisani: t.metaZapisani,
      cenaZapisan: div(t.razhod, zapisaniP.length),
      tonCenaZapisan: tonCenaZapisan(div(t.razhod, zapisaniP.length)),
      chasove: chasoveP,
      cenaChas: div(t.razhod, chasoveP),
      kupili: kupiliP,
      cac: div(t.razhod, kupiliP),
      prihod: prihodP,
      roas: div(prihodP, t.razhod),
      tonRoas: tonRoas(div(prihodP, t.razhod)),
    },
    pari: {
      prodadeno: zapisani.reduce((s, z) => s + z.prihod, 0),
      plateno: ((plashtania ?? []) as Array<{ amount: number | null }>).reduce((s, p) => s + (Number(p.amount) || 0), 0),
      kupili: kupili.length,
    },
    funia,
    kupuvachi: kupili
      .map((z) => ({ ime: z.ime ?? "Клиент", kod: z.kod, reklama: z.kod ? (imeNaKod.get(z.kod) ?? null) : null, suma: z.prihod, koga: z.kupilKoga }))
      .sort((a, b) => (b.koga ?? "").localeCompare(a.koga ?? "")),
    sobstveniPoseshteniya: ab.count ?? null,
  };
}
