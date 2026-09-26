/**
 * Студените обаждания — чистите правила, без база (26.09.2026).
 *
 * Ивайло: „има в драфт клиенти за студени обаждания — въведи ги в системата,
 * сложи от София кои са първите, тя да има достъп до първите; при мен — всички“.
 *
 * Студената фирма живее в `prospects`, не в `contacts`: картон в CRM-а се ражда
 * едва при истински разговор („говорихме“ / „записах среща“). Така тя не влиза в
 * „Първо обаждане“, в топлия кръг с писмата и в отчетите за лийдове от реклами.
 *
 * Без импорти по време на изпълнение — файлът се чете и от скрипта за вкарване
 * (`node --experimental-strip-types scripts/studeni-import.mjs`).
 */

export const PROSPECT_STATUSES = ["new", "no_answer", "callback", "unreachable", "not_interested", "bad_number", "converted"] as const;
export type ProspectStatus = (typeof PROSPECT_STATUSES)[number];

export const PROSPECT_STATUS_LABEL: Record<ProspectStatus, string> = {
  new: "за първо обаждане",
  no_answer: "не вдигна",
  callback: "звънни пак",
  unreachable: "не вдига — спряно",
  not_interested: "не се интересува",
  bad_number: "грешен номер",
  converted: "картон в CRM-а",
};

/** Изходите от студената карта. „Говорихме“ и „среща“ правят картон в CRM-а. */
export const PROSPECT_OUTCOMES = ["no_answer", "callback", "talked", "meeting", "not_interested", "bad_number"] as const;
export type ProspectOutcome = (typeof PROSPECT_OUTCOMES)[number];

/** Живите — тези, на които още се звъни. */
export const LIVE_STATUSES: ProspectStatus[] = ["new", "no_answer", "callback"];

/** След толкова „не вдигна“ подред фирмата излиза от опашката (остава в базата). */
export const MAX_NO_ANSWER = 4;

/** Градът, от който се започва (Ивайло: „сложи от София кои са първите“). */
export const FIRST_CITY = "София";

export interface Prospect {
  id: string;
  company: string;
  city: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  sector: string | null;
  opener: string | null;
  offer: string | null;
  gaps: string | null;
  email_subject: string | null;
  email_draft: string | null;
  decision_maker: string | null;
  buying_signal: string | null;
  score: number | null;
  tier: string | null;
  batch: string;
  priority: number;
  assigned_to: string | null;
  status: ProspectStatus;
  attempts: number;
  no_answers: number;
  last_called_at: string | null;
  next_call_at: string | null;
  last_note: string | null;
  contact_id: string | null;
}

// ── Телефон и град ────────────────────────────────────────────────────────────

/**
 * Телефонът като ключ: 359 + номера, само цифри. Приема +359…, 00359…, 08…,
 * 02…, с интервали и тирета. Два номера в едно поле → първият.
 */
export function phoneKey(raw: string | null | undefined): string | null {
  const first = String(raw ?? "").split(/[,;/|]|\sили\s/)[0];
  let d = first.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("359")) return d.length >= 11 && d.length <= 12 ? d : null;
  if (d.startsWith("0")) d = d.slice(1);
  return d.length >= 8 && d.length <= 9 ? `359${d}` : null;
}

/** Линкът за звънене с едно докосване. */
export function telHref(raw: string | null | undefined): string | null {
  const k = phoneKey(raw);
  return k ? `tel:+${k}` : null;
}

/** Номерът за четене: +359 88 812 3456. */
export function phoneDisplay(raw: string | null | undefined): string {
  const k = phoneKey(raw);
  if (!k) return String(raw ?? "").trim();
  const n = k.slice(3);
  return n.length === 9 ? `+359 ${n.slice(0, 2)} ${n.slice(2, 5)} ${n.slice(5)}` : `+359 ${n.slice(0, 1)} ${n.slice(1, 4)} ${n.slice(4)}`;
}

const LATIN_CITY: Record<string, string> = {
  sofia: "София", plovdiv: "Пловдив", varna: "Варна", burgas: "Бургас", ruse: "Русе", rousse: "Русе",
  "stara zagora": "Стара Загора", pleven: "Плевен", "veliko tarnovo": "Велико Търново", gabrovo: "Габрово",
  asenovgrad: "Асеновград", bozhurishte: "Божурище", botevgrad: "Ботевград", kostinbrod: "Костинброд",
  pravets: "Правец", peshtera: "Пещера", panagyurishte: "Панагюрище", chelopech: "Челопеч", septemvri: "Септември",
  blagoevgrad: "Благоевград", shumen: "Шумен", dobrich: "Добрич", sliven: "Сливен", haskovo: "Хасково",
  pernik: "Перник", yambol: "Ямбол", pazardzhik: "Пазарджик", vratsa: "Враца", kazanlak: "Казанлък",
};

/** „гр. София“, „SOFIA“, „София-град“ → „София“; другото — с главни букви на думите. */
export function normalizeCity(raw: string | null | undefined): string | null {
  const s = String(raw ?? "")
    .trim()
    .replace(/^(гр\.?|град|с\.|село)\s*/i, "")
    .replace(/\s+/g, " ");
  if (!s) return null;
  if (/^(софия|sofia)(\b|[-\s(]|$)/i.test(s)) return FIRST_CITY;
  const latin = LATIN_CITY[s.toLowerCase()];
  if (latin) return latin;
  return s
    .toLowerCase()
    .split(/(\s|-)/)
    .map((w) => (w === " " || w === "-" ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");
}

/**
 * Редът на градовете: София първа (1), после по брой фирми в пакета (10, 11, …)
 * — обажданията се групират по град. Непознат град — накрая (900).
 */
export function cityPriorities(cities: Array<string | null>): Map<string, number> {
  const counts = new Map<string, number>();
  for (const c of cities) if (c) counts.set(c, (counts.get(c) ?? 0) + 1);
  const out = new Map<string, number>();
  if (counts.has(FIRST_CITY)) out.set(FIRST_CITY, 1);
  [...counts.entries()]
    .filter(([c]) => c !== FIRST_CITY)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "bg"))
    .forEach(([c], i) => out.set(c, 10 + i));
  return out;
}

export const UNKNOWN_CITY_PRIORITY = 900;

// ── Опашката ──────────────────────────────────────────────────────────────────

export interface ProspectQueue {
  /** обещано „звънни пак“ и „не вдигна“, чийто час е дошъл — първо те */
  due: Prospect[];
  /** на които още никой не е звънял — София първа */
  fresh: Prospect[];
  /** чакат часа си — за брояча */
  later: number;
}

const ms = (iso: string | null) => (iso ? new Date(iso).getTime() : 0);

export function isDue(p: Pick<Prospect, "status" | "next_call_at">, now: Date): boolean {
  if (p.status !== "no_answer" && p.status !== "callback") return false;
  return !p.next_call_at || ms(p.next_call_at) <= now.getTime();
}

/** Реда на картите: дошлите за повторно по час, после новите по град и име. */
export function splitProspectQueue(rows: Prospect[], now: Date): ProspectQueue {
  const live = rows.filter((p) => p.phone && LIVE_STATUSES.includes(p.status));
  const due = live.filter((p) => isDue(p, now)).sort((a, b) => ms(a.next_call_at) - ms(b.next_call_at));
  const fresh = live
    .filter((p) => p.status === "new")
    .sort(
      (a, b) =>
        a.priority - b.priority ||
        (a.city ?? "").localeCompare(b.city ?? "", "bg") ||
        (b.score ?? 0) - (a.score ?? 0) ||
        a.company.localeCompare(b.company, "bg")
    );
  const later = live.filter((p) => p.status !== "new" && !isDue(p, now)).length;
  return { due, fresh, later };
}

// ── Изходът от обаждането ─────────────────────────────────────────────────────

export interface ProspectPatch {
  status: ProspectStatus;
  attempts: number;
  no_answers: number;
  next_call_at: string | null;
  last_called_at: string;
  last_note: string | null;
}

/**
 * Какво става с фирмата след натискането. `retryAt` идва отвън (бързите избори
 * и часовата зона са в retry-rules/time) — тук е само решението.
 */
export function prospectAfter(
  p: Pick<Prospect, "attempts" | "no_answers" | "last_note">,
  outcome: ProspectOutcome,
  at: { now: Date; retryAt?: Date | null; note?: string | null }
): ProspectPatch {
  const note = at.note?.trim() || null;
  const base = {
    attempts: p.attempts + 1,
    last_called_at: at.now.toISOString(),
    last_note: note ?? p.last_note,
  };
  switch (outcome) {
    case "no_answer": {
      const noAnswers = p.no_answers + 1;
      const done = noAnswers >= MAX_NO_ANSWER;
      return {
        ...base,
        no_answers: noAnswers,
        status: done ? "unreachable" : "no_answer",
        next_call_at: done ? null : (at.retryAt ?? at.now).toISOString(),
      };
    }
    case "callback":
      return { ...base, no_answers: 0, status: "callback", next_call_at: (at.retryAt ?? at.now).toISOString() };
    case "not_interested":
      return { ...base, no_answers: 0, status: "not_interested", next_call_at: null };
    case "bad_number":
      return { ...base, no_answers: p.no_answers, status: "bad_number", next_call_at: null };
    case "talked":
    case "meeting":
      return { ...base, no_answers: 0, status: "converted", next_call_at: null };
  }
}

/** Изходът като в „Напредък“ (napredak-rules.callOutcome) — за да се брои обаждането. */
export function napredakOutcome(outcome: string): string {
  return outcome === "bad_number" ? "wrong_number" : outcome;
}

/** Проучването като бележка в картона — Ивайло вижда откъде е и какво ѝ предлагаме. */
export function prospectNotes(p: Prospect, when: string): string {
  return [
    `❄️ Студено обаждане · ${when}`,
    p.city ? `Град: ${p.city}` : null,
    p.sector ? `Бранш: ${p.sector}` : null,
    p.website ? `Сайт: ${p.website}` : null,
    p.decision_maker ? `Решава: ${p.decision_maker}` : null,
    p.offer ? `Какво да предложим: ${p.offer}` : null,
    p.gaps ? `Пропуски: ${p.gaps}` : null,
    p.buying_signal ? `Сигнал: ${p.buying_signal}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

// ── Вкарването от таблиците ───────────────────────────────────────────────────

export const PROSPECT_FIELDS = [
  "company", "city", "area", "phone", "email", "website", "sector", "opener", "offer", "gaps",
  "email_subject", "email_draft", "decision_maker", "buying_signal", "score", "tier",
] as const;
export type ProspectField = (typeof PROSPECT_FIELDS)[number];

/**
 * Имената на колоните, както могат да дойдат (на български и английски). Точното
 * съвпадение бие „съдържа“, затова „тема“ не се бърка с „тема на имейла“.
 */
const ALIASES: Record<ProspectField, string[]> = {
  company: ["фирма", "компания", "име на фирмата", "company", "company name", "business name", "name"],
  city: ["град", "населено място", "city", "town"],
  area: ["община", "област", "region", "municipality", "area"],
  phone: ["телефон", "тел", "phone", "phone number", "tel", "mobile"],
  email: ["имейл", "e mail", "email", "mail"],
  website: ["сайт", "уебсайт", "website", "web", "url", "domain"],
  sector: ["бранш", "сектор", "индустрия", "industry", "sector", "category", "niche"],
  opener: ["начало на разговора", "готово начало", "опенър", "opener", "call opener", "call opening", "personalized opener", "opening line", "first line"],
  offer: [
    "автоматизационни възможности", "възможности", "идеи за автоматизация", "automation opportunities", "opportunities", "ideas",
    "automation idea", "recommended first offer",
  ],
  gaps: ["пропуски", "пропуски в автоматизацията", "маркетингови пропуски", "automation gaps", "marketing gaps", "gaps", "likely problem"],
  email_subject: ["тема", "тема на имейла", "subject", "email subject"],
  email_draft: ["черновик на имейл", "имейл черновик", "черновик", "email draft", "email body", "draft"],
  decision_maker: ["decision maker", "decision maker role", "лице за контакт", "управител", "контактно лице", "contact person", "owner"],
  buying_signal: ["buying signal", "сигнал", "сигнал за покупка"],
  // Общата оценка от 100 — преди „score“, иначе „съдържа“ хваща подоценките (need_score_30).
  score: ["total score 100", "total score", "score", "скор", "скоринг", "оценка"],
  tier: ["tier", "клас"],
};

/** Полета, които събират няколко колони (три идеи, два вида пропуски, име + роля). */
const MULTI: ReadonlySet<ProspectField> = new Set(["offer", "gaps", "decision_maker"]);

/** С какво се лепят събраните колони: в картата името и ролята са на един ред. */
const JOIN: Partial<Record<ProspectField, string>> = { decision_maker: " · " };

export function normHeader(h: string): string {
  return h.replace(/^﻿/, "").toLowerCase().replace(/[_\-.:/]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Коя колона за кое поле е. Всяка колона отива най-много на едно поле. */
export function mapHeaders(headers: string[]): Partial<Record<ProspectField, number[]>> {
  const norm = headers.map(normHeader);
  const taken = new Set<number>();
  const out: Partial<Record<ProspectField, number[]>> = {};
  const claim = (f: ProspectField, i: number) => {
    taken.add(i);
    (out[f] ??= []).push(i);
  };
  // 1) точните имена
  for (const f of PROSPECT_FIELDS) {
    norm.forEach((h, i) => {
      if (taken.has(i) || !ALIASES[f].includes(h)) return;
      if (out[f] && !MULTI.has(f)) return;
      claim(f, i);
    });
  }
  // 2) „съдържа“ — за по-дългите имена („Готово начало на разговора (BG)“). Кратките
  //    („name“, „град“, „тема“) — само точно, иначе „decision maker name“ става фирма.
  for (const f of PROSPECT_FIELDS) {
    if (out[f] && !MULTI.has(f)) continue;
    norm.forEach((h, i) => {
      if (taken.has(i)) return;
      // Подоценките („decision_maker_access_score_15“) не са име, сайт или сигнал.
      if (f !== "score" && /\bscore\b/.test(h)) return;
      if (!ALIASES[f].some((a) => a.length >= 5 && h.includes(a))) return;
      if (out[f] && !MULTI.has(f)) return;
      claim(f, i);
    });
  }
  // Събраните колони — по реда им в таблицата (идея 1, 2, 3, после препоръката).
  for (const f of PROSPECT_FIELDS) out[f]?.sort((a, b) => a - b);
  return out;
}

export type ProspectRow = Partial<Record<ProspectField, string | number | null>>;

/** Един ред от таблицата → полетата на фирмата (празните — null). */
export function rowToProspect(cells: string[], map: Partial<Record<ProspectField, number[]>>): ProspectRow {
  const out: ProspectRow = {};
  for (const f of PROSPECT_FIELDS) {
    const idx = map[f];
    if (!idx) continue;
    const vals = idx.map((i) => (cells[i] ?? "").trim()).filter(Boolean);
    if (vals.length === 0) continue;
    if (f === "score") {
      const n = Number(vals[0].replace(",", "."));
      out.score = Number.isFinite(n) ? Math.round(n) : null;
    } else if (f === "city") {
      out.city = normalizeCity(vals[0]);
    } else {
      out[f] = MULTI.has(f) ? vals.join(JOIN[f] ?? "\n") : vals[0];
    }
  }
  return out;
}

/** CSV с кавички, запетая или точка и запетая, CRLF и BOM. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const nl = src.search(/\r?\n/);
  const firstLine = nl === -1 ? src : src.slice(0, nl);
  const delim = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else quoted = false;
      } else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === delim) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      if (row.some((c) => c.trim() !== "")) rows.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c.trim() !== "")) rows.push(row);
  return rows;
}

// ── Редът, който влиза в базата ───────────────────────────────────────────────

export interface ImportRow {
  company: string;
  city: string | null;
  area: string | null;
  phone: string | null;
  phone_key: string | null;
  email: string | null;
  website: string | null;
  sector: string | null;
  opener: string | null;
  offer: string | null;
  gaps: string | null;
  email_subject: string | null;
  email_draft: string | null;
  decision_maker: string | null;
  buying_signal: string | null;
  score: number | null;
  tier: string | null;
  batch: string;
  priority: number;
}

const TEXT_LIMIT: Partial<Record<keyof ImportRow, number>> = { company: 300, email_draft: 8000 };

function text(v: unknown, max = 4000): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, max) : null;
}

/** Пакетът като етикет: малки латински, цифри и тире. */
export function cleanBatch(raw: unknown): string {
  const s = String(raw ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "bez-paket";
}

/** Един ред от скрипта → редът за базата. Без фирма — null (прескача се). */
export function cleanImportRow(raw: Record<string, unknown>, batch: string): ImportRow | null {
  const company = text(raw.company, TEXT_LIMIT.company);
  if (!company) return null;
  const phone = text(raw.phone, 60);
  const email = text(raw.email, 200)?.toLowerCase() ?? null;
  const score = Number(raw.score);
  const priority = Math.round(Number(raw.priority));
  return {
    company,
    city: normalizeCity(text(raw.city, 120)),
    area: text(raw.area, 120),
    phone,
    phone_key: phoneKey(phone),
    email: email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) ? email : null,
    website: text(raw.website, 300),
    sector: text(raw.sector, 200),
    opener: text(raw.opener),
    offer: text(raw.offer),
    gaps: text(raw.gaps),
    email_subject: text(raw.email_subject, 300),
    email_draft: text(raw.email_draft, TEXT_LIMIT.email_draft),
    decision_maker: text(raw.decision_maker, 200),
    buying_signal: text(raw.buying_signal, 1000),
    score: raw.score !== null && raw.score !== undefined && raw.score !== "" && Number.isFinite(score) ? Math.round(score) : null,
    tier: text(raw.tier, 20),
    batch: cleanBatch(batch),
    priority: Number.isFinite(priority) && priority >= 1 && priority <= 100000 ? priority : 100,
  };
}
