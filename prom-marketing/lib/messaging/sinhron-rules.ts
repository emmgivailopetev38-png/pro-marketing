import { TZ, bgMobileE164, firstName, phoneKey, zayavkaFrom, type AcAct } from "@/lib/voice/auto-call-rules";

/**
 * Синхронът Ели ↔ Viber/WhatsApp (Ивайло, 29.10.2026): „задачата, като се
 * пуска, да вижда какво е станало преди и тогава да почне да пише на хората“.
 *
 * Чисти правила без база: по картона на човека (всичките му активности) и
 * бъдещите му часове казват ДАЛИ да му се пише след обаждане, ПО КОЙ канал и
 * КАКВО. Пращането остава в машината на Мака (viber-vylni / whatsapp), която
 * пази Viber-а и WhatsApp-а на Ивайло със своите тавани.
 *
 * Поводът е последното обаждане (до `maxAgeDays` назад):
 *   - Ели набра, никой не вдигна (или < 25 сек = гласова поща) → `eli_no_answer`
 *   - Ели говори с човека и той си записа час              → `eli_booked`
 *   - Ели говори, час няма                                  → `eli_no_booking`
 *   - Ивайло звъня (активност `call` „Не вдигна“)           → `ivailo_no_answer`
 *   - Ивайло е говорил (`call` без „Не вдигна“)             → нищо (той води)
 * Не се пише, ако след повода човекът ни е писал (тече разговор), вече сме му
 * писали, Ивайло го е чул, има среща след повода, отказал е, клиент е.
 */

export type SnKind = "eli_no_answer" | "eli_no_booking" | "eli_booked" | "ivailo_no_answer";
export type SnChannel = "viber" | "whatsapp";

export type SnAct = AcAct;

export interface SnContact {
  id: string;
  full_name: string | null;
  phone: string | null;
  email?: string | null;
  source?: string | null;
  stage?: string | null;
  followup_status?: string | null;
  last_heard_from_at?: string | null;
}

export interface SnBooking {
  scheduled_at: string;
  meeting_url?: string | null;
  status?: string | null;
}

export interface SnItem {
  contactId: string;
  name: string | null;
  /** Галеното/първото име за обръщението; празно → „Здравейте!“ */
  ime: string;
  /** Последните 9 цифри — ключът на Мака (otvori.sh / wa-otvori.sh). */
  phone9: string;
  toNumber: string;
  kind: SnKind;
  channel: SnChannel;
  /** Ключът в plan.json: en-/eb-/ei-/p-eli- + име + MMDD. */
  key: string;
  triggerAt: string;
  /** Кога беше обаждането, казано по човешки („преди малко“, „вчера“). */
  when: string;
  meetingAt?: string;
  meetingUrl?: string | null;
  zayavka: string;
  text: string;
  /** За CRM активността viber_sent/whatsapp_sent — да не се повтаря. */
  dedupeKey: string;
}

export type SnDecision = { item: SnItem } | { skip: string };

export interface SnOptions {
  /** Колко дни назад важи едно обаждане като повод. */
  maxAgeDays: number;
  /** Вдигнал = поне толкова секунди (иначе гласова поща). */
  answeredSecs: number;
}

export const SN_DEFAULTS: SnOptions = { maxAgeDays: 2, answeredSecs: 25 };

export const BOOKING_URL = "https://promarketing.pw/booking";
export const SIGNATURE = "🌐 promarketing.pw";
export const ELI_NUMBER = "0876 447 159";

const REPLY_TYPES = new Set(["viber_received", "whatsapp_received", "email_received", "email_reply"]);
const SENT_TYPES = new Set(["viber_sent", "whatsapp_sent"]);
const CLIENT_TYPES = new Set(["payment_received", "invoice", "project_created"]);
const NO_ANSWER = /(Не вдигна|не вдига|Заето|изключен|без отговор|Не отговаря|Пропусна|пропуснат|📵)/i;
const REFUSAL = /(Не се интересува|Не е заинтересован|Грешен номер|Несъществуващ номер|не звъни|не ме търсете|не търсете|не желае)/i;

const ms = (iso: string) => new Date(iso).getTime();
const meta = (a: SnAct): Record<string, unknown> => (a.metadata && typeof a.metadata === "object" ? (a.metadata as Record<string, unknown>) : {});

/** Латиница за ключа в plan.json („Йордан“ → „yordan“). */
export function slug(name: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ж: "zh", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n",
    о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sht", ъ: "a", ь: "y", ю: "yu", я: "ya",
  };
  const out = Array.from(name.toLowerCase())
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return out || "chovek";
}

function sofia(at: string | Date): { day: string; hour: number; minute: number; weekday: number; dm: string; mmdd: string } {
  const d = typeof at === "string" ? new Date(at) : at;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return {
    day: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    weekday: wd,
    dm: `${get("day")}.${get("month")}`,
    mmdd: `${get("month")}${get("day")}`,
  };
}

const WEEKDAYS_V = ["в неделя", "в понеделник", "във вторник", "в сряда", "в четвъртък", "в петък", "в събота"];

/** „преди малко“ / „днес по-рано“ / „вчера“ / „на 27.10“ — за текста. */
export function spokenAgo(iso: string, now: Date): string {
  const diffH = (now.getTime() - ms(iso)) / 3_600_000;
  if (diffH < 2) return "преди малко";
  const a = sofia(iso);
  const n = sofia(now);
  if (a.day === n.day) return "днес по-рано";
  const days = Math.round((Date.parse(n.day) - Date.parse(a.day)) / 86_400_000);
  if (days === 1) return "вчера";
  return `на ${a.dm}`;
}

/** „в четвъртък, 29.10, от 12:00“ — за потвърждението на час. */
export function spokenMeeting(iso: string): string {
  const m = sofia(iso);
  const hh = String(m.hour).padStart(2, "0");
  const mm = String(m.minute).padStart(2, "0");
  return `${WEEKDAYS_V[m.weekday]}, ${m.dm}, от ${hh}:${mm}`;
}

/** Думи, които firstName взима за име, а са фирма/обект — без обръщение. */
const NOT_A_NAME = new Set(["студио", "фирма", "еоод", "оод", "ателие", "салон", "клиника", "магазин", "агенция", "център", "хотел", "ресторант", "кабинет", "школа", "сервиз", "team", "studio"]);

/**
 * Името в обръщението: само кирилица и само истинско име. Латиница („Adryan“,
 * „Vania“) и фирми („Студио Христови“) → без име; машината на Мака слага
 * галеното име на кирилица, като прочете чата (SKILL.md т. 3д).
 */
export function greetingName(full: string | null | undefined): string {
  const ime = firstName(full);
  if (!ime || !/^[А-Яа-яЁё]+$/.test(ime) || NOT_A_NAME.has(ime.toLowerCase())) return "";
  return ime;
}

function greeting(ime: string): string {
  return ime ? `Здравейте, ${ime}!` : "Здравейте!";
}

/** Текстовете — „Вие“ по подразбиране; машината ги сменя на „ти“, ако чатът е на „ти“. */
export function messageText(kind: SnKind, v: { ime: string; when: string; zayavka: string; meetingAt?: string; meetingUrl?: string | null }): string {
  const hi = greeting(v.ime);
  switch (kind) {
    case "eli_no_answer":
      return [
        `${hi} Ивайло Петев е, от Про Маркетинг 🙂 ${cap(v.when)} Ели, AI асистентката ми, Ви търси от ${ELI_NUMBER} по заявката Ви за ${v.zayavka}, но не успя да се свърже.`,
        `Запишете си 15 минути тук, когато Ви е удобно: ${BOOKING_URL}`,
        SIGNATURE,
      ].join("\n");
    case "eli_no_booking":
      return [
        `${hi} Ивайло Петев е, от Про Маркетинг 🙂 Благодаря за разговора с Ели ${v.when} — за 15 минути ще Ви покажа конкретно как AI да поеме задачата, която Ви взима най-много време.`,
        `Запишете си час тук, когато Ви е удобно: ${BOOKING_URL}`,
        SIGNATURE,
      ].join("\n");
    case "eli_booked": {
      const when = v.meetingAt ? spokenMeeting(v.meetingAt) : "в уговорения час";
      const link = v.meetingUrl ? `— ето линка: ${v.meetingUrl}` : "— ще Ви звънна на този номер.";
      return [
        `${hi} Ивайло Петев е, от Про Маркетинг 🙂 Потвърждавам срещата ни ${when} ${link}`,
        `Ако часът не Ви е удобен, изберете друг тук: ${BOOKING_URL}`,
        SIGNATURE,
      ].join("\n");
    }
    case "ivailo_no_answer":
      return [
        `${hi} Ивайло Петев е, от Про Маркетинг 🙂 Търсих Ви ${v.when} по телефона по заявката Ви за ${v.zayavka}.`,
        `Запишете си 15 минути тук, когато Ви е удобно: ${BOOKING_URL}`,
        SIGNATURE,
      ].join("\n");
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const KEY_PREFIX: Record<SnKind, string> = { eli_no_answer: "en", eli_no_booking: "eb", eli_booked: "p-eli", ivailo_no_answer: "ei" };

interface CallEvent {
  kind: SnKind | "ivailo_talked" | "inbound_no_booking";
  at: string;
  booked: boolean;
}

/** Последното обаждане като повод — от най-новото назад. */
export function lastCallEvent(past: SnAct[], opts: SnOptions): CallEvent | null {
  for (const a of past) {
    const m = meta(a);
    if (a.activity_type === "call") {
      return { kind: NO_ANSWER.test(a.title ?? "") ? "ivailo_no_answer" : "ivailo_talked", at: a.occurred_at, booked: false };
    }
    if (a.activity_type === "voice_call") {
      const secs = Number(m.duration_secs ?? 0);
      const booked = m.booked === true;
      if (m.inbound_0876 === true) return booked ? { kind: "eli_booked", at: a.occurred_at, booked } : { kind: "inbound_no_booking", at: a.occurred_at, booked };
      if (secs < opts.answeredSecs) return { kind: "eli_no_answer", at: a.occurred_at, booked };
      return { kind: booked ? "eli_booked" : "eli_no_booking", at: a.occurred_at, booked };
    }
    if (a.activity_type === "voice_outbound") {
      // Набиране без последвал разговор = никой не вдигна. Разговорът (voice_call)
      // идва от webhook-а и е по-нов, затова би бил намерен преди това.
      return { kind: "eli_no_answer", at: a.occurred_at, booked: false };
    }
  }
  return null;
}

export function decideMessage(c: SnContact, acts: SnAct[], futureBookings: SnBooking[], hasWhatsAppThread: boolean, now: Date, opts: SnOptions = SN_DEFAULTS): SnDecision {
  const nowMs = now.getTime();
  const toNumber = bgMobileE164(c.phone);
  if (!toNumber) return { skip: "няма български мобилен" };
  if (c.stage === "won" || c.stage === "lost") return { skip: `етап ${c.stage}` };
  if (c.followup_status === "not_interested") return { skip: "не се интересува" };

  const past = acts.filter((a) => ms(a.occurred_at) <= nowMs).sort((x, y) => ms(y.occurred_at) - ms(x.occurred_at));
  if (past.some((a) => CLIENT_TYPES.has(a.activity_type))) return { skip: "клиент" };
  // Само заглавието: в тялото на бележките пише и „Ели не звъни втори път“ (29.10 —
  // Георги Асенов излезе „отказал“ заради собствената ни бележка).
  if (past.some((a) => (a.activity_type === "call" || a.activity_type === "note") && REFUSAL.test(a.title ?? ""))) return { skip: "отказал" };

  const ev = lastCallEvent(past, opts);
  if (!ev) return { skip: "няма обаждане" };
  if (nowMs - ms(ev.at) > opts.maxAgeDays * 86_400_000) return { skip: "обаждането е старо" };
  if (ev.kind === "ivailo_talked") return { skip: "Ивайло е говорил с него" };
  if (ev.kind === "inbound_no_booking") return { skip: "входящо без час — поема Ивайло" };
  const triggerMs = ms(ev.at);

  const after = past.filter((a) => ms(a.occurred_at) > triggerMs);
  if (after.some((a) => REPLY_TYPES.has(a.activity_type))) return { skip: "писал ни е — тече разговор" };
  if (after.some((a) => SENT_TYPES.has(a.activity_type))) return { skip: "вече писано след обаждането" };
  if (after.some((a) => a.activity_type === "meeting" || a.activity_type === "meeting_outcome")) return { skip: "среща след повода" };
  if (c.last_heard_from_at && ms(c.last_heard_from_at) > triggerMs) return { skip: "чут след повода" };

  const future = futureBookings
    .filter((b) => !b.status || ["accepted", "pending"].includes(b.status))
    .filter((b) => ms(b.scheduled_at) > nowMs)
    .sort((x, y) => ms(x.scheduled_at) - ms(y.scheduled_at));
  let kind: SnKind = ev.kind;
  if (kind !== "eli_booked" && future.length > 0 && kind !== "ivailo_no_answer") kind = "eli_booked";
  // Ели каза „записа си час“, а в календара няма активен → отменен или още не е
  // влязъл; потвърждение без час и линк не се праща — остава в прескочените, за да се види.
  if (kind === "eli_booked" && future.length === 0) return { skip: ev.booked ? "записал час при Ели, но няма активен час — провери" : "няма записан час" };
  if (kind !== "eli_booked" && future.length > 0) return { skip: "има записан час" };

  const ime = greetingName(c.full_name);
  const lead = past.find((a) => a.activity_type === "meta_lead" || a.activity_type === "website_form");
  const zayavka = zayavkaFrom(lead);
  const when = spokenAgo(ev.at, now);
  const meetingAt = future[0]?.scheduled_at;
  const meetingUrl = future[0]?.meeting_url ?? null;
  const channel: SnChannel = kind === "eli_booked" ? "viber" : hasWhatsAppThread ? "whatsapp" : "viber";
  const stamp = kind === "eli_booked" && meetingAt ? sofia(meetingAt).mmdd : sofia(ev.at).mmdd;
  const key = `${KEY_PREFIX[kind]}-${slug(firstName(c.full_name) || c.full_name || "chovek")}-${stamp}`;
  const text = messageText(kind, { ime, when, zayavka, meetingAt, meetingUrl });

  return {
    item: {
      contactId: c.id,
      name: c.full_name,
      ime,
      phone9: phoneKey(toNumber),
      toNumber,
      kind,
      channel,
      key,
      triggerAt: ev.at,
      when,
      meetingAt,
      meetingUrl,
      zayavka,
      text,
      dedupeKey: `sinhron-${key}-${c.id.slice(0, 8)}`,
    },
  };
}

/** Редът на пращане: часовете първо, после най-пресните обаждания. */
export function orderItems(items: SnItem[]): SnItem[] {
  const rank: Record<SnKind, number> = { eli_booked: 0, eli_no_booking: 1, eli_no_answer: 2, ivailo_no_answer: 3 };
  return [...items].sort((a, b) => rank[a.kind] - rank[b.kind] || ms(b.triggerAt) - ms(a.triggerAt));
}
