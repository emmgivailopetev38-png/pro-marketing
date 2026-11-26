/* ---------------------------------------------------------------------------
   Уебинарът след края: кой е дошъл, докога е стоял и на кого кой звъни.

   26.11.2026 · Ивайло: „тези редици и колони за хората… да ги подреди в
   системите на всички… и статистиката… кой кога е стоял… опашките да стоят, после
   автоматично ще ги попълним след вебинара“. Преди уебинара НЕ се звъни.

   Редът е по системата на Йоан Йончев („Най-ценното обучение за уебинари“,
   51:00–55:00): разговорите са в 2–3 дни след уебинара; от деня след него се
   звъни на всеки, който НЕ си е записал час сам, в този ред:
     1. стояли до офертата, без час;
     2. дошли, но излезли преди офертата;
     3. записани, но не дошли (~70 %) — тях им пращаме парче от записа, преди час.
   Пон–ср календарът е за дошлите, чт–нд — за неявилите се. При неявилите
   ~50 % вдигат и 5–10 % от тях записват час.

   Целите по стъпки (пак неговите): дошли 30 % от записаните (20–30 ок) ·
   стояли до офертата 80 % от дошлите · записали час 30 % от чулите офертата ·
   явили се на разговора 60–70 % · купили 20–30 % от проведените.

   Чисти правила, без база — тестват се (prisastvie-rules.test.ts).
--------------------------------------------------------------------------- */

export type SegmentKey = "zapisal" | "oferta" | "rano" | "ne_doshal";

/** На кого се звъни и в какъв ред. „zapisal“ не е тук: те имат час, само се потвърждават. */
export const RED_NA_ZVANENE: readonly SegmentKey[] = ["oferta", "rano", "ne_doshal"] as const;

export const SEGMENT_KEYS: readonly SegmentKey[] = ["zapisal", "oferta", "rano", "ne_doshal"] as const;

export interface SegmentInfo {
  ikona: string;
  /** името на групата в опашката */
  ime: string;
  /** кога се звъни */
  koga: string;
  /** какво е целта на обаждането — един ред под заглавието */
  cel: string;
  /** първото изречение; {аз} = който звъни, {ден} = „в неделя“ */
  opener: string;
  /** цветът на рамката (Tailwind класове на сайта) */
  ton: "emerald" | "rose" | "amber" | "sky";
}

export const SEGMENTI: Record<SegmentKey, SegmentInfo> = {
  zapisal: {
    ikona: "✅",
    ime: "Записаха си час сами",
    koga: "вечерта на уебинара или до 10:00 на следващия ден",
    cel: "Само потвърждение, че часът е удобен — Viber съобщението е в „💜 Срещите“. Разговорът е при клоузъра.",
    opener: "Здравейте, {аз} съм от екипа на Ивайло Петев. Видях, че си записахте час за разговор след обучението. Звъня само да потвърдя, че часът Ви е удобен.",
    ton: "emerald",
  },
  oferta: {
    ikona: "🔥",
    ime: "1 · Стояха до офертата, без час",
    koga: "първи — още на следващия ден до обяд",
    cel: "Видели са цялата оферта. Целта е час с клоузъра в следващите 2 дни. Готов ли е веднага — прехвърли го на клоузъра.",
    opener: "Здравейте, {аз} съм от екипа на Ивайло Петев. Видях, че {ден} бяхте на обучението до края, благодаря Ви! Какво Ви хареса най-много?",
    ton: "rose",
  },
  rano: {
    ikona: "🚪",
    ime: "2 · Дойдоха, но излязоха преди офертата",
    koga: "след първата група — до 2-рия ден",
    cel: "Не са чули офертата. Прати им парчето от записа с офертата и запиши час в следващите 2 дни.",
    opener: "Здравейте, {аз} съм от екипа на Ивайло Петев. Видях, че {ден} влязохте на обучението, но излязохте по-рано. Какво успяхте да видите?",
    ton: "amber",
  },
  ne_doshal: {
    ikona: "📵",
    ime: "3 · Записаха се, но не дойдоха",
    koga: "от 3-тия ден до края на седмицата",
    cel: "Не пълни календара на сляпо: първо парче от записа, после час. Очаквано: половината вдигат, 5–10 % от тях записват.",
    opener: "Здравейте, {аз} съм от екипа на Ивайло Петев. Бяхте се записали за безплатното обучение {ден}, но не успяхте да влезете. Какво стана?",
    ton: "sky",
  },
};

/** Първото изречение за човек от групата. */
export function openerZaSegment(seg: SegmentKey, koiZvani: string | null | undefined, den: string): string {
  const az = (koiZvani ?? "").trim();
  const t = az ? SEGMENTI[seg].opener.replaceAll("{аз}", az) : SEGMENTI[seg].opener.replaceAll("{аз} съм", "обаждам се");
  return t.replaceAll("{ден}", den);
}

/** „в неделя“ — денят от седмицата на уебинара, по софийско време. */
export function denNaUebinara(dateISO: string): string {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return "на обучението";
  const den = new Intl.DateTimeFormat("bg-BG", { weekday: "long", timeZone: "Europe/Sofia" }).format(d);
  return `${den === "вторник" || den === "сряда" ? "във" : "в"} ${den}`;
}

/** Изданието на уебинара — датата му по софийско време: „2026-11-29“. */
export function uebinarKluch(dateISO: string): string {
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return dateISO.slice(0, 10);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Sofia" }).format(d);
}

/** Групата на човека. Записал си е час → „zapisal“, каквото и да е друго. */
export function segmentZa(x: { doshal: boolean; chulOfertata: boolean; zapisalChas: boolean }): SegmentKey {
  if (x.zapisalChas) return "zapisal";
  if (!x.doshal) return "ne_doshal";
  return x.chulOfertata ? "oferta" : "rano";
}

/* ----------------------------- кога е свършил ----------------------------- */

/** Колко след началото уебинарът се смята за свършил, ако Notifier още не е казал. */
export const KRAI_SLED_MIN = 4 * 60;
/** Ако никой не е задал часа на офертата — толкова минути след началото (по структурата на Стефчо). */
export const OFERTA_PRIBLIZITELNO_MIN = 90;
/** Колко след края се чака някой да зададе часа на офертата, преди да се сложи приблизителният. */
export const OFERTA_CHAKANE_MIN = 20;

export function priklyuchil(x: { krajAt: string | null; nachaloISO: string }, now: Date): boolean {
  if (x.krajAt) return new Date(x.krajAt).getTime() <= now.getTime();
  return now.getTime() >= new Date(x.nachaloISO).getTime() + KRAI_SLED_MIN * 60_000;
}

/**
 * Приблизителният час на офертата: 90 мин след началото, но поне 15 мин преди
 * края (кратък уебинар), и никога преди началото.
 */
export function ofertaPriblizitelno(nachaloISO: string, krajISO: string | null): string {
  const start = new Date(nachaloISO).getTime();
  let t = start + OFERTA_PRIBLIZITELNO_MIN * 60_000;
  if (krajISO) {
    const kraj = new Date(krajISO).getTime();
    t = Math.min(t, kraj - 15 * 60_000);
  }
  return new Date(Math.max(t, start)).toISOString();
}

/** Трябва ли сега да се сложи приблизителният час на офертата. */
export function triabvaPriblizitelnaOferta(x: { ofertaAt: string | null; krajAt: string | null }, now: Date): boolean {
  if (x.ofertaAt || !x.krajAt) return false;
  return now.getTime() >= new Date(x.krajAt).getTime() + OFERTA_CHAKANE_MIN * 60_000;
}

/* ------------------------------ свързване ------------------------------ */

export function kluchTelefon(phone: string | null | undefined): string | null {
  const d = String(phone ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : null;
}

export function kluchImeil(email: string | null | undefined): string | null {
  const e = String(email ?? "").trim().toLowerCase();
  return e.includes("@") ? e : null;
}

/* ------------------------------ Notifier ------------------------------ */

/** Само полетата, които ползваме от GET /webinars/{id}/statistics (tracksLeads: true). */
export interface NotifierLead {
  webinarRegistrantId: string;
  name: string;
  phone: string;
  email: string;
  clickedAt: string | null;
  joinedAt: string | null;
  watchSeconds: number;
  heardOffer: boolean;
  segment: "completed" | "partial" | "noShow";
  warmth?: { score: number; tier: "hot" | "warm" | "cold" } | null;
}

export interface NotifierGuest {
  id: string;
  name: string;
  email: string;
  joinedAt: string | null;
  watchSeconds: number;
  segment: "completed" | "partial" | "noShow";
}

export interface NotifierStatistika {
  tracksLeads: boolean;
  current: {
    webinar: { id: string; name: string; startAt: string; endedAt: string | null };
    rates: Record<string, number | null>;
    statistics: {
      registeredCount: number;
      joinedCount: number;
      heardOfferCount: number | null;
      completedCount: number;
      averageWatchMinutes: number;
      curve: number[];
      peakCount: number;
      peakAt: string | null;
      startedAt: string | null;
      worstDrop: { fromMinute: number; toMinute: number; lost: number } | null;
      offerMinute: number | null;
      leads?: NotifierLead[];
      guests?: NotifierGuest[];
    };
  };
}

/** Часът на офертата от статистиката: startedAt + offerMinute. */
export function ofertaOtStatistika(s: NotifierStatistika["current"]["statistics"]): string | null {
  if (s.offerMinute == null || !s.startedAt) return null;
  return new Date(new Date(s.startedAt).getTime() + s.offerMinute * 60_000).toISOString();
}

/* ------------------------- редовете на човек ------------------------- */

export interface ZapisanKontakt {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

export interface ZapisanChas {
  email: string | null;
  phone: string | null;
  created_at: string;
}

export interface PrisastvieRed {
  uebinar: string;
  contact_id: string;
  ime: string | null;
  email: string | null;
  telefon: string | null;
  notifier_id: string | null;
  vlyazal_at: string | null;
  minuti: number;
  chul_ofertata: boolean;
  notifier_segment: string | null;
  toplina: number | null;
  toplina_nivo: string | null;
  kliknal_at: string | null;
  segment: SegmentKey;
  zapisal_chas_at: string | null;
}

/**
 * Всеки записан (картон в CRM-а) → един ред. Свързване с Notifier по имейл,
 * после по телефон; гостите от страницата за влизане също се броят като дошли.
 * Записан час = среща, създадена след `chasoveOt` (часът преди уебинара), със
 * същия имейл или телефон.
 */
export function izchisliRedove(args: {
  uebinar: string;
  zapisani: ZapisanKontakt[];
  leads: NotifierLead[];
  guests: NotifierGuest[];
  chasove: ZapisanChas[];
  chasoveOt: string;
}): PrisastvieRed[] {
  const poImeil = new Map<string, NotifierLead>();
  const poTel = new Map<string, NotifierLead>();
  for (const l of args.leads) {
    const e = kluchImeil(l.email);
    const t = kluchTelefon(l.phone);
    if (e && !poImeil.has(e)) poImeil.set(e, l);
    if (t && !poTel.has(t)) poTel.set(t, l);
  }
  const gostPoImeil = new Map<string, NotifierGuest>();
  for (const g of args.guests) {
    const e = kluchImeil(g.email);
    if (e && g.joinedAt && !gostPoImeil.has(e)) gostPoImeil.set(e, g);
  }
  const ot = new Date(args.chasoveOt).getTime();
  const chasPoImeil = new Map<string, string>();
  const chasPoTel = new Map<string, string>();
  for (const c of args.chasove) {
    if (new Date(c.created_at).getTime() < ot) continue;
    const e = kluchImeil(c.email);
    const t = kluchTelefon(c.phone);
    if (e && (!chasPoImeil.has(e) || c.created_at < chasPoImeil.get(e)!)) chasPoImeil.set(e, c.created_at);
    if (t && (!chasPoTel.has(t) || c.created_at < chasPoTel.get(t)!)) chasPoTel.set(t, c.created_at);
  }

  return args.zapisani.map((k) => {
    const e = kluchImeil(k.email);
    const t = kluchTelefon(k.phone);
    const lead = (e && poImeil.get(e)) || (t && poTel.get(t)) || null;
    const gost = !lead?.joinedAt && e ? (gostPoImeil.get(e) ?? null) : null;
    const vlyazal = lead?.joinedAt ?? gost?.joinedAt ?? null;
    const sekundi = Math.max(lead?.watchSeconds ?? 0, gost?.watchSeconds ?? 0);
    const chul = !!lead?.heardOffer;
    const chas = (e && chasPoImeil.get(e)) || (t && chasPoTel.get(t)) || null;
    return {
      uebinar: args.uebinar,
      contact_id: k.id,
      ime: k.full_name ?? lead?.name ?? null,
      email: k.email ?? lead?.email ?? null,
      telefon: k.phone ?? lead?.phone ?? null,
      notifier_id: lead?.webinarRegistrantId ?? null,
      vlyazal_at: vlyazal,
      minuti: Math.round(sekundi / 60),
      chul_ofertata: chul,
      notifier_segment: lead?.segment ?? gost?.segment ?? null,
      toplina: lead?.warmth?.score ?? null,
      toplina_nivo: lead?.warmth?.tier ?? null,
      kliknal_at: lead?.clickedAt ?? null,
      segment: segmentZa({ doshal: !!vlyazal, chulOfertata: chul, zapisalChas: !!chas }),
      zapisal_chas_at: chas,
    };
  });
}

/** В опашката: най-топлите най-горе, после по минути, после по име. */
export function podrediZaZvanene<T extends { toplina: number | null; minuti: number; ime: string | null }>(redove: T[]): T[] {
  return [...redove].sort(
    (a, b) => (b.toplina ?? -1) - (a.toplina ?? -1) || b.minuti - a.minuti || (a.ime ?? "").localeCompare(b.ime ?? "", "bg")
  );
}

/** Един ред на картата: „🔥 Стоя до офертата · 112 мин · топъл“. */
export function redNaKartata(r: Pick<PrisastvieRed, "segment" | "minuti" | "toplina_nivo" | "vlyazal_at">): string {
  const s = SEGMENTI[r.segment];
  const chasti = [`${s.ikona} ${s.ime.replace(/^\d · /, "")}`];
  if (r.vlyazal_at && r.minuti > 0) chasti.push(`${r.minuti} мин на обучението`);
  if (r.toplina_nivo) chasti.push(r.toplina_nivo === "hot" ? "горещ" : r.toplina_nivo === "warm" ? "топъл" : "студен");
  return chasti.join(" · ");
}

/* --------------------------- обажданията --------------------------- */

/** Изходи, при които човекът НЕ е вдигнал. */
const NE_VDIGNA = new Set(["no_answer", "give_up", "wrong_number"]);

export interface OpitRed {
  contact_id: string;
  activity_type: string;
  occurred_at: string;
  outcome: string | null;
}

export interface Progres {
  obshto: number;
  obadeni: number;
  vdignali: number;
  zapisali: number;
}

/**
 * Докъде е стигнало звъненето в една група: колко са набрани след края на
 * уебинара, колко са вдигнали, колко са записали час (изход „meeting“ или нова
 * среща след края).
 */
export function progresNaGrupa(ids: string[], opiti: OpitRed[], sled: string, sChas: Set<string> = new Set()): Progres {
  const ot = new Date(sled).getTime();
  const moi = new Set(ids);
  const obadeni = new Set<string>();
  const vdignali = new Set<string>();
  const zapisali = new Set<string>([...sChas].filter((id) => moi.has(id)));
  for (const o of opiti) {
    if (!moi.has(o.contact_id) || new Date(o.occurred_at).getTime() < ot) continue;
    if (o.activity_type !== "call" && o.activity_type !== "meeting") continue;
    obadeni.add(o.contact_id);
    if (!NE_VDIGNA.has(o.outcome ?? "")) vdignali.add(o.contact_id);
    if (o.outcome === "meeting" || o.activity_type === "meeting") zapisali.add(o.contact_id);
  }
  return { obshto: moi.size, obadeni: obadeni.size, vdignali: vdignali.size, zapisali: zapisali.size };
}

/** Картоните, на които още НЕ е звънено след края — те стоят в опашката. */
export function oshteNeobadeni(ids: string[], opiti: OpitRed[], sled: string): string[] {
  const ot = new Date(sled).getTime();
  const pipnati = new Set(
    opiti
      .filter((o) => ["call", "meeting", "viber_sent"].includes(o.activity_type) && new Date(o.occurred_at).getTime() >= ot)
      .map((o) => o.contact_id)
  );
  return ids.filter((id) => !pipnati.has(id));
}

/* ------------------------------ целите ------------------------------ */

export type Ocenka = "dobre" | "sredno" | "zle";

export interface Cel {
  key: "doshli" | "do_ofertata" | "chas" | "yavili" | "kupili";
  ime: string;
  /** от какво е процентът */
  ot: string;
  /** при това и нагоре — добре */
  cel: number;
  /** под това — зле; между двете — средно */
  minimum: number;
}

export const CELI: readonly Cel[] = [
  { key: "doshli", ime: "Дошли", ot: "от записаните", cel: 30, minimum: 20 },
  { key: "do_ofertata", ime: "Стояха до офертата", ot: "от дошлите", cel: 80, minimum: 70 },
  { key: "chas", ime: "Записаха час", ot: "от чулите офертата", cel: 30, minimum: 20 },
  { key: "yavili", ime: "Явиха се на разговора", ot: "от записалите час", cel: 60, minimum: 50 },
  { key: "kupili", ime: "Купиха", ot: "от проведените разговори", cel: 20, minimum: 15 },
] as const;

export function procent(a: number, b: number): number | null {
  return b > 0 ? Math.round((a / b) * 100) : null;
}

export function ocenka(p: number | null, c: Pick<Cel, "cel" | "minimum">): Ocenka | null {
  if (p === null) return null;
  if (p >= c.cel) return "dobre";
  if (p >= c.minimum) return "sredno";
  return "zle";
}

/**
 * Къде е най-голямото тясно място: стъпката с най-лоша оценка (зле преди средно),
 * а при равни — тази, която е най-далеч под целта си. Йончев: „по една промяна
 * на уебинар — там, където числото е най-слабо“.
 */
export function tyasnoMyasto(stapki: Array<{ key: Cel["key"]; p: number | null }>): Cel["key"] | null {
  let best: { key: Cel["key"]; rank: number; gap: number } | null = null;
  for (const s of stapki) {
    const c = CELI.find((x) => x.key === s.key);
    if (!c || s.p === null) continue;
    const o = ocenka(s.p, c);
    if (o === "dobre") continue;
    const rank = o === "zle" ? 2 : 1;
    const gap = (c.cel - s.p) / c.cel;
    if (!best || rank > best.rank || (rank === best.rank && gap > best.gap)) best = { key: s.key, rank, gap };
  }
  return best?.key ?? null;
}

/** Графиката по минути → по една стойност на `stapka` минути (най-голямата в прозореца). */
export function krivaPoStapki(kriva: number[], stapka = 5): number[] {
  const out: number[] = [];
  for (let i = 0; i < kriva.length; i += stapka) out.push(Math.max(0, ...kriva.slice(i, i + stapka)));
  return out;
}
