/**
 * Чий е човекът: на екипа за звънене (Димитър) или вече на Ивайло.
 *
 * Правилото на Ивайло (06.10.2026): „говорили ли сме поне един път / има ли
 * записана среща и ми е била в календара — човекът приключва за Димитър“.
 * И: „тези от менторската са в Академията — няма смисъл да се виждат на Димитър“.
 *
 * Поводът: на 30.09 и 06.10 Димитър звъня на четирима от Академията —
 * заявката за достъп влизаше в CRM-а като обикновена форма от сайта и
 * ротацията я даваше на него — и ги отбеляза „Не се интересува“. На 05.10 му
 * излезе Subay, който вече имаше оферта от Ивайло за менторската: проверката
 * на срещите беше сложила „не се яви“ на разговор, проведен по телефона.
 *
 * Човекът е на Ивайло, ако има поне едно от:
 *   🎓 Академията — заявка или регистрация в akademia.promarketing.pw;
 *   🤝 разговор с Ивайло — обаждане, записано от Ивайло, Хермес или Клод
 *      (телефонът на Ивайло); „не вдигна“, „изключен“, „пропуснато“ не са разговор;
 *   📅 среща в календара му — предстояща или минала (проведена, „не се яви“).
 *      Отменената преди часа не се брои: тя не е стояла в календара, а за нея
 *      е „❌ Отказаха срещата“ — Димитър я мести.
 *
 * Изключението е едно: Ивайло сам е дал картона на екипа („🤝 Дай на екипа“)
 * СЛЕД последния от тези знаци. Това е изрично негово решение.
 *
 * Чисти правила, без база — тестват се. Базата е в ivailo.ts.
 */
import { isNoAnswer } from "./queue-rules";
import { last9, realEmail } from "./sreshti-zastapvane";
import { fmtSofia } from "./time";

/** Източникът на картон, създаден от заявка в Академията. */
export const AKADEMIA_SOURCE = "akademia";

/** Академията праща заявките през формата на сайта със съобщение „Академия · …“ (виж akademia/lib/crm.ts). */
export const AKADEMIA_PREFIX = "Академия · ";

export function isAkademiaMessage(message: string | null | undefined): boolean {
  return (message ?? "").trimStart().startsWith(AKADEMIA_PREFIX);
}

/** Активностите, по които се познава чий е човекът — заявката от Академията, разговорите, срещите, „дай на екипа“. */
export const CLAIM_ACTIVITY_TYPES = ["call", "meeting", "website_form", "team_assigned"] as const;

export interface SignalRow {
  contact_id: string;
  activity_type: string;
  title: string | null;
  body?: string | null;
  occurred_at: string;
  /** кога е записан редът — среща напред във времето се знае от деня на записа */
  created_at?: string | null;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

export interface BookingRef {
  id: string;
  status: string | null;
  scheduled_at: string;
  created_at?: string | null;
  attendee_email: string | null;
  attendee_phone: string | null;
}

export interface ContactRef {
  id: string;
  email: string | null;
  phone: string | null;
  source?: string | null;
  created_at?: string | null;
}

export type IvailoWhy = "akademia" | "talked" | "meeting";

export interface IvailoClaim {
  why: IvailoWhy;
  /** последният знак — с него се сравнява изричното „дай на екипа“ */
  at: string;
  /** при среща — часът ѝ (последната или предстоящата) */
  meetingAt: string | null;
  /** защо, без обръщение — за известията до Ивайло: „🎓 в Академията е“ */
  reason: string;
  /** какво пише на картата на екипа: защо + „не му звъни“ */
  label: string;
}

/**
 * Знак от Академията: заявката през формата на сайта („Съобщение: Академия · …“),
 * запис от самата Академия (`created_by: akademia`) или бележка на Ивайло/Клод
 * за Академията. Бележка на екипа („иска Академията“) не прави човека член.
 */
export function isAkademiaSignal(row: Pick<SignalRow, "activity_type" | "title" | "body" | "created_by" | "metadata">): boolean {
  const m = row.metadata ?? {};
  if (m.team === true) return false;
  if (row.created_by === "akademia" || m.source === AKADEMIA_SOURCE) return true;
  if (row.activity_type === "website_form") {
    if (typeof m.message === "string" && isAkademiaMessage(m.message)) return true;
    if (/(^|\n)Съобщение: Академия · /.test(row.body ?? "")) return true;
  }
  return (row.activity_type === "note" || row.activity_type === "website_form") && /Академи/i.test(row.title ?? "");
}

/** Изходи, при които разговор няма: никой не вдигна, номерът не работи, обаждането е пропуснато. */
const NO_CONTACT_OUTCOMES = new Set(["no_answer", "voicemail", "give_up", "wrong_number", "missed", "busy", "not_reached"]);

/** Старите записи на Ивайло и Хермес казват „няма разговор“ само в заглавието. */
const NO_CONTACT_TITLE = /не вдиг|не отговор|изключен|извън покритие|зает|заето|не се осъществи|грешен|не е реален|несъществ|пропуснат|няма връзка/i;

/** Разговор с Ивайло: обаждане, което не е от екипа и не е „нямаше разговор“. */
export function isIvailoTalk(row: Pick<SignalRow, "activity_type" | "title" | "metadata">): boolean {
  if (row.activity_type !== "call") return false;
  const m = row.metadata ?? {};
  if (m.team === true) return false;
  if (typeof m.outcome === "string" && NO_CONTACT_OUTCOMES.has(m.outcome)) return false;
  if (isNoAnswer({ title: row.title ?? "", metadata: row.metadata })) return false;
  return !NO_CONTACT_TITLE.test(row.title ?? "");
}

/** Среща, записана от страната на Ивайло (Хермес, Клод, Fathom, той самият). Срещата на екипа се чете от bookings. */
export function isIvailoMeeting(row: Pick<SignalRow, "activity_type" | "metadata">): boolean {
  return row.activity_type === "meeting" && row.metadata?.team !== true;
}

/** Отменената преди часа и отхвърлената среща не са стояли в календара. Преместената е `cancelled` + нова среща. */
const OFF_CALENDAR = new Set(["cancelled", "rejected"]);

export function wasInCalendar(b: Pick<BookingRef, "status">): boolean {
  return !OFF_CALENDAR.has(String(b.status ?? ""));
}

/**
 * Изричното „🤝 Дай на екипа“ от Ивайло — не „отказа срещата“, не „не се яви“,
 * не продавачът и не „пак остави данни“ (relead): последното го слага входът на
 * лийда сам и не бива да отнема човек от Ивайло.
 */
export function isManualGive(row: Pick<SignalRow, "activity_type" | "metadata">): boolean {
  if (row.activity_type !== "team_assigned") return false;
  const kind = row.metadata?.kind;
  return kind !== "sales" && kind !== "cancelled" && kind !== "noshow" && kind !== "relead";
}

function ms(iso: string | null | undefined): number {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isFinite(t) ? t : NaN;
}

/** По-ранното от двете: минал разговор се знае от часа си, бъдеща среща — от деня, в който е записана. */
function knownAt(a: string, b?: string | null): string {
  const x = ms(a);
  const y = ms(b);
  if (!Number.isFinite(y)) return a;
  if (!Number.isFinite(x)) return b as string;
  return y < x ? (b as string) : a;
}

export function claimReason(why: IvailoWhy, meetingAt: string | null, now: Date): string {
  if (why === "akademia") return "🎓 в Академията е";
  if (why === "talked") return "🤝 говорил е с Ивайло";
  if (meetingAt && ms(meetingAt) > now.getTime()) return `📅 има среща с Ивайло · ${fmtSofia(meetingAt)}`;
  return `📅 имал е среща в календара на Ивайло${meetingAt ? ` (${fmtSofia(meetingAt)})` : ""}`;
}

/** „🎓 в Академията е“ → „🎓 В Академията е — човек на Ивайло. Не му звъни.“ */
export function claimLabel(reason: string): string {
  const capital = reason.replace(/^(\S+\s+)(\p{Ll})/u, (_m, lead: string, first: string) => lead + first.toUpperCase());
  return `${capital} — човек на Ивайло. Не му звъни.`;
}

const PRIORITY: Record<IvailoWhy, number> = { akademia: 3, talked: 2, meeting: 1 };

/** Ключовете, по които срещата намира човека си: истински имейл и последните 9 цифри от телефона. */
export function personKeys(p: { email?: string | null; phone?: string | null }): string[] {
  const keys: string[] = [];
  const e = realEmail(p.email);
  if (e) keys.push(`e:${e}`);
  const t = last9(p.phone);
  if (t) keys.push(`p:${t}`);
  return keys;
}

export interface BookingIndex {
  byKey: Map<string, BookingRef[]>;
  byId: Map<string, BookingRef>;
}

/** Срещите, подредени по човек и по id — за да не се сравнява всеки картон с всяка среща. */
export function indexBookings(bookings: BookingRef[]): BookingIndex {
  const byKey = new Map<string, BookingRef[]>();
  const byId = new Map<string, BookingRef>();
  for (const b of bookings) {
    byId.set(b.id, b);
    for (const k of personKeys({ email: b.attendee_email, phone: b.attendee_phone })) {
      const list = byKey.get(k) ?? [];
      list.push(b);
      byKey.set(k, list);
    }
  }
  return { byKey, byId };
}

export interface ClaimOptions {
  now: Date;
  /** Само знаци отпреди този момент — за напомнянията: предстоящата среща сама не е знак. */
  before?: Date | null;
  /** Тази среща не е знак (напомнянето е точно за нея). */
  ignoreBookingId?: string | null;
}

/**
 * Човекът на Ивайло ли е — и защо. null = на екипа е (или никой не е стигал до Ивайло).
 * `rows` = активностите на този човек; `bookings` = срещите (индекс от indexBookings
 * или списък — от тях се вземат само неговите).
 */
export function ivailoClaim(
  contact: ContactRef,
  rows: SignalRow[],
  bookings: BookingIndex | BookingRef[],
  opts: ClaimOptions
): IvailoClaim | null {
  const idx = Array.isArray(bookings) ? indexBookings(bookings) : bookings;
  const cut = opts.before ? opts.before.getTime() : Infinity;
  const marks: Array<{ why: IvailoWhy; at: string; meetingAt: string | null }> = [];
  if (contact.source === AKADEMIA_SOURCE) {
    marks.push({ why: "akademia", at: contact.created_at ?? new Date(0).toISOString(), meetingAt: null });
  }

  const teamBookingIds = new Set<string>();
  let manualGiveAt = NaN;
  for (const r of rows) {
    if (isManualGive(r)) {
      manualGiveAt = Math.max(Number.isFinite(manualGiveAt) ? manualGiveAt : -Infinity, ms(r.occurred_at));
      continue;
    }
    if (isAkademiaSignal(r)) {
      marks.push({ why: "akademia", at: knownAt(r.occurred_at, r.created_at), meetingAt: null });
      continue;
    }
    if (ms(r.occurred_at) >= cut) continue;
    if (isIvailoTalk(r)) marks.push({ why: "talked", at: knownAt(r.occurred_at, r.created_at), meetingAt: null });
    else if (isIvailoMeeting(r)) marks.push({ why: "meeting", at: knownAt(r.occurred_at, r.created_at), meetingAt: r.occurred_at });
    else if (r.activity_type === "meeting" && typeof r.metadata?.booking_id === "string") teamBookingIds.add(r.metadata.booking_id);
  }

  // Неговите срещи: по имейл/телефон и тези, които екипът е записал от картона му.
  const mine = new Map<string, BookingRef>();
  for (const k of personKeys(contact)) for (const b of idx.byKey.get(k) ?? []) mine.set(b.id, b);
  for (const id of teamBookingIds) {
    const b = idx.byId.get(id);
    if (b) mine.set(b.id, b);
  }
  for (const b of mine.values()) {
    if (b.id === opts.ignoreBookingId || !wasInCalendar(b) || ms(b.scheduled_at) >= cut) continue;
    marks.push({ why: "meeting", at: knownAt(b.scheduled_at, b.created_at), meetingAt: b.scheduled_at });
  }

  if (marks.length === 0) return null;
  const latest = marks.reduce((a, b) => (ms(b.at) > ms(a.at) ? b : a));
  // Ивайло го е дал на екипа СЛЕД последния знак — неговото решение важи.
  if (Number.isFinite(manualGiveAt) && manualGiveAt > ms(latest.at)) return null;

  const why = marks.reduce((a, b) => (PRIORITY[b.why] > PRIORITY[a.why] ? b : a)).why;
  // За надписа: предстоящата среща, ако има; иначе последната.
  const meetings = marks.filter((m) => m.meetingAt).map((m) => m.meetingAt as string);
  const upcoming = meetings.filter((t) => ms(t) > opts.now.getTime()).sort();
  const past = meetings.filter((t) => ms(t) <= opts.now.getTime()).sort();
  const meetingAt = upcoming[0] ?? past[past.length - 1] ?? null;
  const reason = claimReason(why, why === "meeting" ? meetingAt : null, opts.now);
  return { why, at: latest.at, meetingAt, reason, label: claimLabel(reason) };
}

/** Активностите по картон — за ivailoClaim на много хора наведнъж. */
export function rowsByContact(rows: SignalRow[]): Map<string, SignalRow[]> {
  const out = new Map<string, SignalRow[]>();
  for (const r of rows) {
    const list = out.get(r.contact_id) ?? [];
    list.push(r);
    out.set(r.contact_id, list);
  }
  return out;
}
