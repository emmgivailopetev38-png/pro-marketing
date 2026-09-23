/**
 * Готовите съобщения към човека за срещата му — потвърждение с линка,
 * напомняне ден преди, напомняне два часа преди и „не успяхме да се свържем“.
 *
 * Димитър ги копира с едно докосване и ги праща по Viber (схемата
 * `viber://chat?number=` отваря точния човек, но не носи текст — затова
 * копиране + отваряне). Тонът: топло, кратко, с ясна следваща стъпка; без
 * „извинявам се, че Ви безпокоя“ и без каквото и да е, което ни прави натрапници.
 * Чисти функции — без база, тестват се.
 */
import { TZ, dayKey } from "@/lib/contacts/followup";
import { MEETING_MINUTES } from "@/lib/cal/types";
import { toE164 } from "@/lib/cal/create-booking";

export const MEETING_MSG_KINDS = ["confirm", "remind_day", "remind_soon", "noshow"] as const;
export type MeetingMsgKind = (typeof MEETING_MSG_KINDS)[number];

export const MEETING_MSG_LABEL: Record<MeetingMsgKind, string> = {
  confirm: "Потвърждение с линка",
  remind_day: "Напомняне ден преди",
  remind_soon: "Напомняне малко преди",
  noshow: "След пропусната среща",
};

export const MEETING_MSG_ICON: Record<MeetingMsgKind, string> = {
  confirm: "📨",
  remind_day: "📅",
  remind_soon: "⏰",
  noshow: "🙈",
};

/** Прозорецът за „малко преди“: до 3 часа преди срещата. */
export const SOON_HOURS = 3;
/** Прозорецът за „ден преди“: от 3 до 36 часа преди срещата. */
export const DAY_BEFORE_HOURS = 36;

export function firstName(full: string | null | undefined): string {
  const t = (full ?? "").trim().split(/\s+/)[0] ?? "";
  return t.length > 1 ? t : "";
}

const DAYS_BG = ["неделя", "понеделник", "вторник", "сряда", "четвъртък", "петък", "събота"];

function sofiaParts(iso: string | Date, tz: string = TZ) {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, x) => ((acc[x.type] = x.value), acc), {});
  const wd = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(p.weekday);
  return { weekday: DAYS_BG[wd] ?? "", date: `${p.day}.${p.month}`, time: `${p.hour}:${p.minute}` };
}

/** „в сряда (24.09)“ / „днес“ / „утре“ / „вчера“ — спрямо сега. */
export function relativeDay(iso: string, now: Date = new Date(), tz: string = TZ): string {
  const target = dayKey(iso, tz);
  const today = dayKey(now, tz);
  const tomorrow = dayKey(new Date(now.getTime() + 86_400_000), tz);
  const yesterday = dayKey(new Date(now.getTime() - 86_400_000), tz);
  if (target === today) return "днес";
  if (target === tomorrow) return "утре";
  if (target === yesterday) return "вчера";
  const p = sofiaParts(iso, tz);
  const prep = p.weekday === "вторник" ? "във" : "в";
  return `${prep} ${p.weekday} (${p.date})`;
}

export interface MeetingMsgInput {
  name: string | null;
  whenIso: string;
  meetingUrl: string | null;
  /** кой пише — „Димитър“ */
  setterName: string;
  /** „Вие“ (true) или „ти“ (false) */
  formal: boolean;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function meetingMessage(kind: MeetingMsgKind, i: MeetingMsgInput, now: Date = new Date(), tz: string = TZ): string {
  const name = firstName(i.name);
  const hi = i.formal ? (name ? `Здравейте, ${name}!` : "Здравейте!") : name ? `Здравей, ${name}!` : "Здравей!";
  const p = sofiaParts(i.whenIso, tz);
  const rel = relativeDay(i.whenIso, now, tz);
  const when = rel === "днес" || rel === "утре" ? `${rel} в ${p.time} ч.` : `${rel} в ${p.time} ч.`;
  const setter = firstName(i.setterName) || i.setterName;
  const url = i.meetingUrl?.trim() || null;
  const f = i.formal;

  switch (kind) {
    case "confirm": {
      const how = url
        ? `Ще е онлайн, около ${MEETING_MINUTES} минути — ето линка: ${url}`
        : f
          ? "Ивайло ще Ви се обади на този номер."
          : "Ивайло ще ти се обади на този номер.";
      return f
        ? `${hi} ${setter} съм от Pro Marketing. Записах Ви за разговор с Ивайло Петев ${when} ${how} Ако нещо се промени, пишете ми тук и ще преместим часа. Хубав ден!`
        : `${hi} ${setter} съм от Pro Marketing. Записах те за разговор с Ивайло Петев ${when} ${how} Ако нещо се промени, пиши ми тук и ще преместим часа. Хубав ден!`;
    }
    case "remind_day": {
      const link = url ? `Линкът: ${url}` : f ? "Той ще Ви звънне на този номер." : "Той ще ти звънне на този номер.";
      return f
        ? `${hi} Напомням за разговора Ви с Ивайло ${when} ${link} Ако часът вече не Ви е удобен, пишете ми и ще го преместим. До скоро!`
        : `${hi} Напомням за разговора ти с Ивайло ${when} ${link} Ако часът вече не ти е удобен, пиши ми и ще го преместим. До скоро!`;
    }
    case "remind_soon": {
      const link = url ? `ето линка още веднъж: ${url}` : f ? "той ще Ви звънне на този номер" : "той ще ти звънне на този номер";
      return f
        ? `${hi} В ${p.time} ч. е разговорът Ви с Ивайло — ${link}. Ако нещо Ви се измести, само ми пишете. До скоро!`
        : `${hi} В ${p.time} ч. е разговорът ти с Ивайло — ${link}. Ако нещо ти се измести, само ми пиши. До скоро!`;
    }
    case "noshow": {
      return f
        ? `${hi} ${cap(rel)} в ${p.time} ч. имахме уговорен разговор с Ивайло, но не успяхме да се свържем с Вас. Случва се. Кога ще Ви е удобно да го преместим — утре или в друг ден? Пишете ми час, който Ви е удобен, и го записвам веднага.`
        : `${hi} ${cap(rel)} в ${p.time} ч. имахме уговорен разговор с Ивайло, но не успяхме да се свържем с теб. Случва се. Кога ти е удобно да го преместим — утре или в друг ден? Пиши ми час, който ти е удобен, и го записвам веднага.`;
    }
  }
}

/**
 * Кое съобщение е на ред сега за тази среща — най-много едно: малко преди >
 * ден преди > потвърждение. Изпратените (`sent`) не се предлагат пак.
 */
export function dueKind(scheduledIso: string, now: Date, sent: ReadonlySet<MeetingMsgKind>): MeetingMsgKind | null {
  const ms = new Date(scheduledIso).getTime() - now.getTime();
  if (ms <= 0) return null;
  const hours = ms / 3_600_000;
  if (hours <= SOON_HOURS) return sent.has("remind_soon") ? null : "remind_soon";
  if (hours <= DAY_BEFORE_HOURS) {
    if (!sent.has("remind_day")) return "remind_day";
    return null;
  }
  return sent.has("confirm") ? null : "confirm";
}

/** Отваря точния чат във Viber по номер (без текст — схемата не носи текст). */
export function viberChatLink(phone: string | null | undefined): string | null {
  const e164 = toE164(phone);
  return e164 ? `viber://chat?number=${encodeURIComponent(e164)}` : null;
}
