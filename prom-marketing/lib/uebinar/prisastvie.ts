import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { NA_ZHIVO } from "@/lib/uebinar/na-zhivo";
import { UEBINAR_LINKOVE } from "@/lib/uebinar/linkove";
import { loadLeadCards } from "@/lib/team/queue";
import { loadRotationPool } from "@/lib/team/routing";
import { seesLead } from "@/lib/team/routing-rules";
import { loadIvailoClaims } from "@/lib/team/ivailo";
import type { QueueLead } from "@/lib/team/types";
import {
  CELI,
  RED_NA_ZVANENE,
  SEGMENT_KEYS,
  denNaUebinara,
  izchisliRedove,
  kluchImeil,
  kluchTelefon,
  ocenka,
  ofertaOtStatistika,
  ofertaPriblizitelno,
  oshteNeobadeni,
  openerZaSegment,
  podrediZaZvanene,
  priklyuchil,
  procent,
  progresNaGrupa,
  redNaKartata,
  triabvaPriblizitelnaOferta,
  tyasnoMyasto,
  uebinarKluch,
  type Cel,
  type NotifierStatistika,
  type Ocenka,
  type OpitRed,
  type PrisastvieRed,
  type Progres,
  type SegmentKey,
} from "./prisastvie-rules";

/* ---------------------------------------------------------------------------
   Присъствието на уебинара → опашките за звънене и статистиката (26.11.2026).

   Notifier (notifierbg.com) следи всеки записан с личен линк за Zoom: кой е
   влязъл, колко минути е стоял и дали е бил в стаята, когато е почнала
   офертата. Крона /api/cron/uebinar вика `sinhroniziraiPrisastvie` на 5 мин —
   от 15 мин преди началото до 8 дни след него (след 6-ия час — на 30 мин).
   Ако никой не зададе часа на офертата до 20 мин след края, слагаме
   приблизителния (90-ата минута) и го пишем на екрана, за да се поправи.

   Опашките излизат при сетъра чак след края на уебинара (преди него не се
   звъни — Ивайло, 26.11.2026).
--------------------------------------------------------------------------- */

type Sb = ReturnType<typeof createServiceClient>;

const NOTIFIER = "https://notifierbg.com/api/v1";
const OPIT_TIPOVE = ["call", "meeting", "viber_sent"];
const MAX_KARTI_NA_GRUPA = 60;
const TIMELINE_TYPE = "uebinar_prisastvie";

export const UEBINAR_KLUCH = uebinarKluch(NA_ZHIVO.dateISO);

function notifierCfg(): { key: string; web: string } | null {
  const key = process.env.NOTIFIER_API_KEY;
  const web = UEBINAR_LINKOVE.notifierWebinar;
  return key && web ? { key, web } : null;
}

async function vzemiStatistika(cfg: { key: string; web: string }): Promise<NotifierStatistika | null> {
  try {
    const r = await fetch(`${NOTIFIER}/webinars/${encodeURIComponent(cfg.web)}/statistics`, {
      headers: { Authorization: `Bearer ${cfg.key}` },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    if (!r.ok) {
      console.error("[uebinar/prisastvie] statistics", r.status, (await r.text()).slice(0, 200));
      return null;
    }
    return (await r.json()) as NotifierStatistika;
  } catch (e) {
    console.error("[uebinar/prisastvie] statistics", e instanceof Error ? e.message : e);
    return null;
  }
}

/** PUT /webinars/{id}/offer — `offerAt` null = „сега“. */
async function pratiOferta(cfg: { key: string; web: string }, offerAt: string | null): Promise<{ ok: boolean; offerAt?: string | null; error?: string }> {
  try {
    const r = await fetch(`${NOTIFIER}/webinars/${encodeURIComponent(cfg.web)}/offer`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${cfg.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(offerAt ? { offerAt } : {}),
      signal: AbortSignal.timeout(15_000),
    });
    const j = (await r.json().catch(() => ({}))) as { offerAt?: string | null; message?: string; error?: string };
    if (!r.ok) return { ok: false, error: `${r.status}: ${j.message ?? j.error ?? ""}`.trim() };
    return { ok: true, offerAt: j.offerAt ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Записаните за ТОВА издание (по датата в записването). */
async function zapisaniIds(sb: Sb): Promise<string[]> {
  const { rows } = await allRows<{ contact_id: string }>((from, to) =>
    sb
      .from("contact_activities")
      .select("contact_id")
      .eq("activity_type", "uebinar_registration")
      .eq("metadata->>date_iso", NA_ZHIVO.dateISO)
      .order("occurred_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  );
  return [...new Set(rows.map((r) => r.contact_id))];
}

async function poParcheta<T>(ids: string[], fn: (part: string[]) => PromiseLike<{ data: T[] | null }>): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await fn(ids.slice(i, i + 200));
    out.push(...(data ?? []));
  }
  return out;
}

/** Срещите, създадени от часа преди уебинара насам (без отменените) — „записал час“. */
async function chasoveSled(sb: Sb, ot: string): Promise<Array<{ email: string | null; phone: string | null; created_at: string; status: string; scheduled_at: string }>> {
  const { rows } = await allRows<{ attendee_email: string | null; attendee_phone: string | null; created_at: string; status: string; scheduled_at: string }>((from, to) =>
    sb
      .from("bookings")
      .select("attendee_email, attendee_phone, created_at, status, scheduled_at")
      .gte("created_at", ot)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  );
  return rows
    .filter((b) => b.status !== "rejected" && !(b.status === "cancelled"))
    .map((b) => ({ email: b.attendee_email, phone: b.attendee_phone, created_at: b.created_at, status: b.status, scheduled_at: b.scheduled_at }));
}

export interface SinhronRezultat {
  ok: boolean;
  prichina?: string;
  redove?: number;
  segmenti?: Record<SegmentKey, number>;
  oferta?: string | null;
}

/**
 * Тегли статистиката от Notifier и пише групите на всеки записан. Безопасно е
 * да се вика колкото пъти искаш — upsert по (издание, картон).
 */
export async function sinhroniziraiPrisastvie(opts: { now?: Date; sila?: boolean } = {}): Promise<SinhronRezultat> {
  const now = opts.now ?? new Date();
  const cfg = notifierCfg();
  if (!cfg) return { ok: false, prichina: "няма NOTIFIER_API_KEY или уебинар в Notifier" };
  const start = Date.parse(NA_ZHIVO.dateISO);
  const t = now.getTime();
  if (!opts.sila && (t < start - 15 * 60_000 || t > start + 8 * 86_400_000)) return { ok: true, prichina: "извън прозореца" };

  const sb = createServiceClient();
  const { data: prev } = await sb
    .from("uebinar_statistika")
    .select("obnoveno_at, oferta_at, oferta_izvor")
    .eq("uebinar", UEBINAR_KLUCH)
    .maybeSingle();
  const prevRow = prev as { obnoveno_at: string; oferta_at: string | null; oferta_izvor: string | null } | null;
  if (!opts.sila && prevRow && t > start + 6 * 3_600_000 && t - Date.parse(prevRow.obnoveno_at) < 30 * 60_000) {
    return { ok: true, prichina: "обновено скоро" };
  }

  let stat = await vzemiStatistika(cfg);
  if (!stat) return { ok: false, prichina: "Notifier не върна статистика" };
  let s = stat.current.statistics;
  let ofertaAt = ofertaOtStatistika(s);
  let izvor: string | null = ofertaAt
    ? prevRow?.oferta_izvor && prevRow.oferta_at && Math.abs(Date.parse(prevRow.oferta_at) - Date.parse(ofertaAt)) < 60_000
      ? prevRow.oferta_izvor
      : "notifier"
    : null;
  if (triabvaPriblizitelnaOferta({ ofertaAt, krajAt: stat.current.webinar.endedAt }, now)) {
    const koga = ofertaPriblizitelno(stat.current.webinar.startAt, stat.current.webinar.endedAt);
    const r = await pratiOferta(cfg, koga);
    if (r.ok) {
      const nov = await vzemiStatistika(cfg);
      if (nov) {
        stat = nov;
        s = nov.current.statistics;
        ofertaAt = ofertaOtStatistika(s) ?? koga;
        izvor = "priblizitelno";
      }
    } else console.error("[uebinar/prisastvie] приблизителна оферта:", r.error);
  }

  const ids = await zapisaniIds(sb);
  const kontakti = await poParcheta<{ id: string; full_name: string | null; email: string | null; phone: string | null }>(ids, (part) =>
    sb.from("contacts").select("id, full_name, email, phone").in("id", part)
  );
  const chasove = await chasoveSled(sb, new Date(start - 60 * 60_000).toISOString());
  const redove = izchisliRedove({
    uebinar: UEBINAR_KLUCH,
    zapisani: kontakti,
    leads: s.leads ?? [],
    guests: s.guests ?? [],
    chasove,
    chasoveOt: new Date(start - 60 * 60_000).toISOString(),
  });

  const obnoveno = now.toISOString();
  for (let i = 0; i < redove.length; i += 500) {
    const { error } = await sb
      .from("uebinar_prisastvie")
      .upsert(redove.slice(i, i + 500).map((r) => ({ ...r, obnoveno_at: obnoveno })), { onConflict: "uebinar,contact_id" });
    if (error) {
      console.error("[uebinar/prisastvie] upsert", error.message);
      return { ok: false, prichina: `базата: ${error.message}` };
    }
  }

  const { error: stErr } = await sb.from("uebinar_statistika").upsert(
    {
      uebinar: UEBINAR_KLUCH,
      notifier_webinar: cfg.web,
      nachalo_at: stat.current.webinar.startAt,
      kraj_at: stat.current.webinar.endedAt,
      oferta_at: ofertaAt,
      oferta_izvor: izvor,
      zapisani: ids.length,
      doshli: redove.filter((r) => r.vlyazal_at).length,
      chuli_ofertata: ofertaAt ? redove.filter((r) => r.chul_ofertata).length : null,
      do_kraya: s.completedCount ?? 0,
      pik: s.peakCount ?? 0,
      pik_at: s.peakAt,
      sredno_minuti: s.averageWatchMinutes ?? 0,
      kriva_start_at: s.startedAt,
      kriva: Array.isArray(s.curve) ? s.curve : [],
      nai_golyam_spad: s.worstDrop,
      rates: stat.current.rates,
      obnoveno_at: obnoveno,
    },
    { onConflict: "uebinar" }
  );
  if (stErr) console.error("[uebinar/prisastvie] statistika", stErr.message);

  // В картона на всеки — веднъж, щом уебинарът е свършил и часът на офертата е ясен.
  if (stat.current.webinar.endedAt && ofertaAt) await vTimeline(sb, redove).catch((e) => console.error("[uebinar/prisastvie] timeline", e));

  const segmenti = Object.fromEntries(SEGMENT_KEYS.map((k) => [k, redove.filter((r) => r.segment === k).length])) as Record<SegmentKey, number>;
  return { ok: true, redove: redove.length, segmenti, oferta: ofertaAt };
}

/** Ред в картона на човека: „🎓 Беше на уебинара 29.11 · 110 мин · до офертата“. */
async function vTimeline(sb: Sb, redove: PrisastvieRed[]): Promise<void> {
  const { rows } = await allRows<{ contact_id: string }>((from, to) =>
    sb
      .from("contact_activities")
      .select("contact_id")
      .eq("activity_type", TIMELINE_TYPE)
      .eq("metadata->>uebinar", UEBINAR_KLUCH)
      .order("id", { ascending: true })
      .range(from, to)
  );
  const veche = new Set(rows.map((r) => r.contact_id));
  const den = new Intl.DateTimeFormat("bg-BG", { day: "2-digit", month: "2-digit", timeZone: "Europe/Sofia" }).format(new Date(NA_ZHIVO.dateISO));
  const novi = redove
    .filter((r) => !veche.has(r.contact_id))
    .map((r) => {
      const doshal = !!r.vlyazal_at;
      const title = !doshal
        ? r.segment === "zapisal"
          ? `🎓 Не влезе на уебинара ${den}, но си записа час`
          : `🎓 Не дойде на уебинара ${den}`
        : `🎓 Беше на уебинара ${den} · ${r.minuti} мин · ${r.chul_ofertata ? "чу офертата" : "излезе преди офертата"}${r.segment === "zapisal" ? " · записа си час" : ""}`;
      return {
        contact_id: r.contact_id,
        activity_type: TIMELINE_TYPE,
        title,
        body: `„${NA_ZHIVO.name}“ · ${NA_ZHIVO.dateLabel}. Групата за звънене: ${redNaKartata(r)}. Данните са от Notifier (личният линк за Zoom).`,
        occurred_at: new Date().toISOString(),
        created_by: "notifier",
        metadata: { uebinar: UEBINAR_KLUCH, segment: r.segment, minuti: r.minuti, chul_ofertata: r.chul_ofertata, toplina: r.toplina },
      };
    });
  for (let i = 0; i < novi.length; i += 500) {
    const { error } = await sb.from("contact_activities").insert(novi.slice(i, i + 500));
    if (error) throw new Error(error.message);
  }
}

/** Бутонът „🎯 Офертата започва сега“ / часът след уебинара. Връща новия час. */
export async function zadaiChasNaOfertata(offerAt: string | null): Promise<{ ok: boolean; error?: string; offerAt?: string | null }> {
  const cfg = notifierCfg();
  if (!cfg) return { ok: false, error: "Няма ключ за Notifier." };
  const r = await pratiOferta(cfg, offerAt);
  if (!r.ok) return r;
  const sb = createServiceClient();
  await sb
    .from("uebinar_statistika")
    .upsert({ uebinar: UEBINAR_KLUCH, notifier_webinar: cfg.web, oferta_at: r.offerAt ?? offerAt, oferta_izvor: "rachno", obnoveno_at: new Date(0).toISOString() }, { onConflict: "uebinar" });
  await sinhroniziraiPrisastvie({ sila: true }).catch(() => null);
  return r;
}

/* ============================== за екраните ============================== */

export type Sastoyanie = "predi" | "na_zhivo" | "sled";

interface StatRed {
  nachalo_at: string | null;
  kraj_at: string | null;
  oferta_at: string | null;
  oferta_izvor: string | null;
  zapisani: number;
  doshli: number;
  chuli_ofertata: number | null;
  do_kraya: number;
  pik: number;
  pik_at: string | null;
  sredno_minuti: number;
  kriva_start_at: string | null;
  kriva: number[];
  nai_golyam_spad: { fromMinute: number; toMinute: number; lost: number } | null;
  rates: Record<string, number | null> | null;
  obnoveno_at: string;
}

async function statRed(sb: Sb): Promise<StatRed | null> {
  const { data } = await sb.from("uebinar_statistika").select("*").eq("uebinar", UEBINAR_KLUCH).maybeSingle();
  return (data as StatRed | null) ?? null;
}

function sastoyanieNa(st: StatRed | null, now: Date): Sastoyanie {
  if (now.getTime() < Date.parse(NA_ZHIVO.dateISO)) return "predi";
  return priklyuchil({ krajAt: st?.kraj_at ?? null, nachaloISO: NA_ZHIVO.dateISO }, now) ? "sled" : "na_zhivo";
}

/** Краят, от който се броят обажданията — Notifier, иначе 4 часа след началото. */
function krajIso(st: StatRed | null): string {
  return st?.kraj_at ?? new Date(Date.parse(NA_ZHIVO.dateISO) + 4 * 3_600_000).toISOString();
}

async function opitiSled(sb: Sb, ids: string[], sled: string): Promise<OpitRed[]> {
  const rows = await poParcheta<{ contact_id: string; activity_type: string; occurred_at: string; metadata: Record<string, unknown> | null }>(ids, (part) =>
    sb
      .from("contact_activities")
      .select("contact_id, activity_type, occurred_at, metadata")
      .in("contact_id", part)
      .in("activity_type", OPIT_TIPOVE)
      .gte("occurred_at", sled)
      .limit(5000)
  );
  return rows.map((r) => ({
    contact_id: r.contact_id,
    activity_type: r.activity_type,
    occurred_at: r.occurred_at,
    outcome: typeof r.metadata?.outcome === "string" ? (r.metadata.outcome as string) : null,
  }));
}

export interface GrupaZaZvanene {
  seg: SegmentKey;
  leads: QueueLead[];
  /** колко още чакат обаждане (може да са повече от картите на екрана) */
  chakat: number;
  progres: Progres;
}

export interface UebinarOpashka {
  sastoyanie: Sastoyanie;
  dateLabel: string;
  den: string;
  /** записаните, които са при този човек */
  zapisani: number;
  /** записали си час сами — потвърждават се от „💜 Срещите“ */
  zapisaliChas: number;
  grupi: GrupaZaZvanene[];
  /** колко чакат обаждане общо — числото на таба */
  zaZvanene: number;
  ofertaPriblizitelno: boolean;
  imaDanni: boolean;
}

/**
 * Опашките „🎓 Уебинар“ при сетъра (`viewerId` = неговите по ротацията; null =
 * собственикът вижда всички). Преди края — само броят записани.
 */
export async function zarediUebinarOpashka(viewerId: string | null, koiZvani: string, now: Date = new Date()): Promise<UebinarOpashka> {
  const sb = createServiceClient();
  const den = denNaUebinara(NA_ZHIVO.dateISO);
  const [ids, st, pool] = await Promise.all([zapisaniIds(sb), statRed(sb), viewerId ? loadRotationPool() : Promise.resolve([])]);
  const kontakti = await poParcheta<{ id: string; email: string | null; phone: string | null; source: string; created_at: string; routed_to: string | null }>(ids, (part) =>
    sb.from("contacts").select("id, email, phone, source, created_at, routed_to").in("id", part)
  );
  const claims = await loadIvailoClaims(kontakti, { now }, sb).catch(() => new Map());
  const moi = kontakti.filter((c) => seesLead(viewerId, c.routed_to, pool) && !claims.has(c.id)).map((c) => c.id);
  const sastoyanie = sastoyanieNa(st, now);
  const prazno: UebinarOpashka = {
    sastoyanie,
    dateLabel: NA_ZHIVO.dateLabel,
    den,
    zapisani: moi.length,
    zapisaliChas: 0,
    grupi: [],
    zaZvanene: 0,
    ofertaPriblizitelno: st?.oferta_izvor === "priblizitelno",
    imaDanni: false,
  };
  if (sastoyanie !== "sled" || moi.length === 0) return prazno;

  const redove = await poParcheta<PrisastvieRed>(moi, (part) =>
    sb.from("uebinar_prisastvie").select("*").eq("uebinar", UEBINAR_KLUCH).in("contact_id", part)
  );
  if (redove.length === 0) return prazno;
  const sled = krajIso(st);
  const opiti = await opitiSled(sb, redove.map((r) => r.contact_id), sled);

  const grupi: GrupaZaZvanene[] = [];
  for (const seg of RED_NA_ZVANENE) {
    const vGrupata = redove.filter((r) => r.segment === seg);
    const chakat = podrediZaZvanene(vGrupata.filter((r) => oshteNeobadeni([r.contact_id], opiti, sled).length > 0));
    const pokazani = chakat.slice(0, MAX_KARTI_NA_GRUPA);
    const karti = await loadLeadCards(pokazani.map((r) => r.contact_id));
    const poId = new Map(pokazani.map((r) => [r.contact_id, r]));
    grupi.push({
      seg,
      chakat: chakat.length,
      progres: progresNaGrupa(vGrupata.map((r) => r.contact_id), opiti, sled),
      leads: karti.map((l) => ({
        ...l,
        given_reason: redNaKartata(poId.get(l.id)!),
        opener_override: openerZaSegment(seg, koiZvani, den),
      })),
    });
  }
  return {
    ...prazno,
    zapisaliChas: redove.filter((r) => r.segment === "zapisal").length,
    grupi,
    zaZvanene: grupi.reduce((n, g) => n + g.chakat, 0),
    imaDanni: true,
  };
}

/** Само числото за таба — без картите (бързо, за всеки изглед на /ekip). */
export async function broiZaZvanene(viewerId: string | null, now: Date = new Date()): Promise<number | null> {
  try {
    const sb = createServiceClient();
    const st = await statRed(sb);
    if (sastoyanieNa(st, now) !== "sled") return 0;
    const [ids, pool] = await Promise.all([zapisaniIds(sb), viewerId ? loadRotationPool() : Promise.resolve([])]);
    const kontakti = await poParcheta<{ id: string; email: string | null; phone: string | null; source: string; created_at: string; routed_to: string | null }>(ids, (part) =>
      sb.from("contacts").select("id, email, phone, source, created_at, routed_to").in("id", part)
    );
    // Същото като в опашката: хората на Ивайло не са за екипа — иначе числото на таба не съвпада с картите.
    const claims = await loadIvailoClaims(kontakti, { now }, sb).catch(() => new Map());
    const moi = kontakti.filter((c) => seesLead(viewerId, c.routed_to, pool) && !claims.has(c.id)).map((c) => c.id);
    const redove = await poParcheta<{ contact_id: string; segment: SegmentKey }>(moi, (part) =>
      sb.from("uebinar_prisastvie").select("contact_id, segment").eq("uebinar", UEBINAR_KLUCH).in("contact_id", part)
    );
    const zaGrupi = redove.filter((r) => (RED_NA_ZVANENE as readonly string[]).includes(r.segment)).map((r) => r.contact_id);
    const sled = krajIso(st);
    const opiti = await opitiSled(sb, zaGrupi, sled);
    return oshteNeobadeni(zaGrupi, opiti, sled).length;
  } catch {
    return null;
  }
}

/* ------------------------------ фунията ------------------------------ */

export interface Stapka {
  key: Cel["key"];
  ime: string;
  ot: string;
  a: number;
  b: number;
  p: number | null;
  cel: number;
  ocenka: Ocenka | null;
}

export interface ChovekRed {
  contact_id: string;
  ime: string | null;
  telefon: string | null;
  vlyazal_at: string | null;
  minuti: number;
  chul_ofertata: boolean;
  toplina_nivo: string | null;
  segment: SegmentKey;
  zvanene: "chaka" | "ne_vdigna" | "govoril" | "chas" | null;
}

export interface UebinarFunia {
  sastoyanie: Sastoyanie;
  dateLabel: string;
  zapisani: number;
  st: StatRed | null;
  stapki: Stapka[];
  tyasno: Cel["key"] | null;
  grupi: Record<SegmentKey, Progres>;
  hora: ChovekRed[];
  imaNotifier: boolean;
}

/** Числата на уебинара за /ekip/uebinar, мениджърите и клоузърите. */
export async function zarediFuniyata(now: Date = new Date()): Promise<UebinarFunia> {
  const sb = createServiceClient();
  const [ids, st] = await Promise.all([zapisaniIds(sb), statRed(sb)]);
  const sastoyanie = sastoyanieNa(st, now);
  const redove = await poParcheta<PrisastvieRed>(ids, (part) =>
    sb.from("uebinar_prisastvie").select("*").eq("uebinar", UEBINAR_KLUCH).in("contact_id", part)
  );
  const sled = krajIso(st);
  const opiti = redove.length ? await opitiSled(sb, redove.map((r) => r.contact_id), sled) : [];

  // Срещите на записаните след началото на уебинара: проведени, неявили се.
  const start = Date.parse(NA_ZHIVO.dateISO);
  const kontakti = await poParcheta<{ id: string; email: string | null; phone: string | null; stage: string }>(ids, (part) =>
    sb.from("contacts").select("id, email, phone, stage").in("id", part)
  );
  const imeili = new Set(kontakti.map((k) => kluchImeil(k.email)).filter((x): x is string => !!x));
  const telefoni = new Set(kontakti.map((k) => kluchTelefon(k.phone)).filter((x): x is string => !!x));
  const sreshti = (await chasoveSled(sb, new Date(start - 60 * 60_000).toISOString()).catch(() => [])).filter(
    (b) => (kluchImeil(b.email) && imeili.has(kluchImeil(b.email)!)) || (kluchTelefon(b.phone) && telefoni.has(kluchTelefon(b.phone)!))
  );
  const { data: resheni } = await sb
    .from("bookings")
    .select("attendee_email, attendee_phone, status")
    .gte("created_at", new Date(start - 60 * 60_000).toISOString())
    .in("status", ["completed", "no_show"])
    .limit(2000);
  const nashi = ((resheni ?? []) as Array<{ attendee_email: string | null; attendee_phone: string | null; status: string }>).filter(
    (b) => (kluchImeil(b.attendee_email) && imeili.has(kluchImeil(b.attendee_email)!)) || (kluchTelefon(b.attendee_phone) && telefoni.has(kluchTelefon(b.attendee_phone)!))
  );
  const provedeni = nashi.filter((b) => b.status === "completed").length;
  const neyavili = nashi.filter((b) => b.status === "no_show").length;
  const kupili = kontakti.filter((k) => k.stage === "won").length;

  const doshli = redove.filter((r) => r.vlyazal_at).length;
  const chuli = redove.filter((r) => r.chul_ofertata).length;
  const sChasIds = new Set(redove.filter((r) => r.segment === "zapisal").map((r) => r.contact_id));
  const grupi = Object.fromEntries(
    SEGMENT_KEYS.map((k) => [k, progresNaGrupa(redove.filter((r) => r.segment === k).map((r) => r.contact_id), opiti, sled, k === "zapisal" ? sChasIds : new Set())])
  ) as Record<SegmentKey, Progres>;
  const zapisaliChas = Math.max(sreshti.length ? new Set(sreshti.map((b) => kluchImeil(b.email) ?? kluchTelefon(b.phone))).size : 0, sChasIds.size);

  const vals: Record<Cel["key"], [number, number]> = {
    doshli: [doshli, ids.length],
    do_ofertata: [chuli, doshli],
    chas: [zapisaliChas, chuli],
    yavili: [provedeni, provedeni + neyavili],
    kupili: [kupili, provedeni],
  };
  const imaOferta = !!st?.oferta_at;
  const stapki: Stapka[] = CELI.map((c) => {
    const [a, b] = vals[c.key];
    const p = c.key === "do_ofertata" && !imaOferta ? null : procent(a, b);
    return { key: c.key, ime: c.ime, ot: c.ot, a, b, p, cel: c.cel, ocenka: ocenka(p, c) };
  });

  const poKontakt = new Map<string, OpitRed[]>();
  for (const o of opiti) poKontakt.set(o.contact_id, [...(poKontakt.get(o.contact_id) ?? []), o]);
  const hora: ChovekRed[] = podrediZaZvanene(redove).map((r) => {
    const os = poKontakt.get(r.contact_id) ?? [];
    const zvanene: ChovekRed["zvanene"] =
      sastoyanie !== "sled" || r.segment === "zapisal"
        ? null
        : os.some((o) => o.outcome === "meeting" || o.activity_type === "meeting")
          ? "chas"
          : os.some((o) => o.activity_type === "call" && !["no_answer", "give_up", "wrong_number"].includes(o.outcome ?? ""))
            ? "govoril"
            : os.some((o) => o.activity_type === "call")
              ? "ne_vdigna"
              : "chaka";
    return {
      contact_id: r.contact_id,
      ime: r.ime,
      telefon: r.telefon,
      vlyazal_at: r.vlyazal_at,
      minuti: r.minuti,
      chul_ofertata: r.chul_ofertata,
      toplina_nivo: r.toplina_nivo,
      segment: r.segment,
      zvanene,
    };
  });

  return {
    sastoyanie,
    dateLabel: NA_ZHIVO.dateLabel,
    zapisani: ids.length,
    st,
    stapki,
    tyasno: sastoyanie === "sled" ? tyasnoMyasto(stapki.map((s) => ({ key: s.key, p: s.p }))) : null,
    grupi,
    hora,
    imaNotifier: !!notifierCfg(),
  };
}
