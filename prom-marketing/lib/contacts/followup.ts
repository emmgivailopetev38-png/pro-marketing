/**
 * Правилата, по които CRM-ът разбира къде е човекът и дали му дължим обаждане.
 *
 * Без "server-only" нарочно: едни и същи правила ползват кроновете (сутрешния
 * отчет и списъка за обаждане), PATCH маршрутът на Хермес, бутоните в опашката
 * и тестовете. Досега всяко от тези места смяташе по своя логика и затова
 * „просрочените" в имейла не съвпадаха с това, което Ивайло знае, че е направил.
 */

import type { ContactStage, FollowupStatus } from "./types";

export const TZ = "Europe/Sofia";

/** Тръбата в реда, в който човек минава през нея. won/lost са извън реда — крайни. */
const PIPELINE: ContactStage[] = ["lead", "contacted", "discovery", "presentation_sent", "offer_sent", "negotiating"];
const TERMINAL = new Set<ContactStage>(["won", "lost"]);

/**
 * Най-ниският етап, който има смисъл при този статус на проследяване.
 *
 * „Изпратена оферта" при етап „lead" е противоречие — човекът очевидно е минал
 * през разговор и през оферта. `null` значи, че статусът не казва нищо за етапа:
 * „да се обади" и „изпратен имейл" вървят с всеки етап.
 */
export function minStageFor(status: FollowupStatus | string | null | undefined): ContactStage | null {
  switch (status) {
    case "sent_presentation":
      return "presentation_sent";
    case "sent_offer":
      return "offer_sent";
    case "sent_proforma":
    case "ready_to_close":
      return "negotiating";
    case "called_waiting_feedback":
    case "interested":
      return "contacted";
    case "not_interested":
      return "lost";
    default:
      return null;
  }
}

/**
 * Етапът, който трябва да стои след смяна на статуса.
 *
 * Само напред, никога назад: статус „заинтересован" при човек с оферта на масата
 * не го връща на „contacted". Крайните етапи не се пипат — освен „незаинтересован",
 * който води до „lost", защото това е точно неговото значение (спечелен клиент
 * обаче не става загубен от един статус).
 */
export function alignStage(stage: ContactStage, status: FollowupStatus | string | null | undefined): ContactStage {
  const min = minStageFor(status);
  if (!min) return stage;
  if (min === "lost") return stage === "won" ? stage : "lost";
  if (TERMINAL.has(stage)) return stage;
  const cur = PIPELINE.indexOf(stage);
  const want = PIPELINE.indexOf(min);
  return want > cur ? min : stage;
}

/**
 * Статусът, който има смисъл при този етап.
 * Спечеленият няма „да се обади" — той има договор. Статусът му се чисти.
 */
export function alignStatus(stage: ContactStage, status: FollowupStatus | null): FollowupStatus | null {
  return stage === "won" ? null : status;
}

/** Календарният ден в София като „ГГГГ-ММ-ДД" — сравнява се като низ. */
export function dayKey(d: Date | string, tz: string = TZ): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("sv-SE", { timeZone: tz });
}

/** Отместването на зоната спрямо UTC в минути за дадения момент (лято +180, зима +120). */
function tzOffsetMinutes(at: Date, tz: string): number {
  const asTz = new Date(at.toLocaleString("en-US", { timeZone: tz }));
  const asUtc = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
  return Math.round((asTz.getTime() - asUtc.getTime()) / 60_000);
}

/**
 * Следващият работен ден в 10:00 софийско време.
 *
 * Обаждане, което не е стигнало до човека („не вдига", „в среща е"), не бива
 * да изтрива напомнянето — това е най-честият начин лийд да изчезне тихо. Но
 * не бива и да го оставя „просрочено" — това е шумът, от който имейлът умира.
 * Затова напомнянето се мести на следващата сутрин.
 */
export function nextWorkingDayAt(from: Date, hour = 10, tz: string = TZ): Date {
  // Денят в зоната, като части.
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
    .formatToParts(from)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});
  let y = Number(parts.year);
  let m = Number(parts.month);
  let d = Number(parts.day);

  // Утре, и после през уикенда.
  let candidate = new Date(Date.UTC(y, m - 1, d + 1, 12));
  while ([0, 6].includes(candidate.getUTCDay())) {
    candidate = new Date(candidate.getTime() + 86_400_000);
  }
  y = candidate.getUTCFullYear();
  m = candidate.getUTCMonth() + 1;
  d = candidate.getUTCDate();

  // 10:00 местно = 10:00 UTC минус отместването на зоната в този ден.
  const naive = new Date(Date.UTC(y, m - 1, d, hour, 0, 0));
  const offset = tzOffsetMinutes(naive, tz);
  return new Date(naive.getTime() - offset * 60_000);
}

export type FollowupState = "none" | "future" | "due_today" | "overdue" | "fulfilled";

/**
 * Къде стои едно обещано обаждане.
 *
 * Обещанието е „ще се чуем на ден X". Изпълнено е, ако на ден X или след него
 * има разговор или среща (`lastAttemptAt` — последният `call`/`meeting` в
 * картона) или ако човекът е „чут" (`last_heard_from_at`). Сравнението е по
 * КАЛЕНДАРЕН ДЕН в София, не по секунда: напомняне за 03.09 в 15:00 и обаждане
 * на 03.09 в 10:30 са едно и също обещание, изпълнено.
 *
 * Досега кронът сравняваше по секунда и само с `last_heard_from_at`, което
 * бутонът „Обадихме се" пише, а обаждането, записано от Хермес — не. Резултат:
 * 49 „просрочени", от които 7 с проведена среща и повечето останали със
 * записано обаждане в самия ден.
 */
export function followupState(
  c: { next_followup_at: string | null; last_heard_from_at: string | null },
  lastAttemptAt: string | Date | null,
  now: Date = new Date()
): FollowupState {
  if (!c.next_followup_at) return "none";
  const dueDay = dayKey(c.next_followup_at);
  const today = dayKey(now);

  // Обещание за бъдещето не може да е изпълнено — дори срещата за този ден вече
  // да е записана в картона с бъдеща дата. Проверява се, когато денят дойде.
  if (dueDay > today) return "future";

  // Броят се само опити, които вече са се случили.
  const heardDay = c.last_heard_from_at ? dayKey(c.last_heard_from_at) : null;
  const attemptDay = lastAttemptAt ? dayKey(lastAttemptAt) : null;
  const heard = heardDay !== null && heardDay >= dueDay && heardDay <= today;
  const attempted = attemptDay !== null && attemptDay >= dueDay && attemptDay <= today;
  if (heard || attempted) return "fulfilled";

  if (dueDay === today) return "due_today";
  return "overdue";
}

/** Активностите, които броим за „опитах да се чуем" — без имейли и бележки. */
export const ATTEMPT_TYPES = ["call", "meeting"] as const;
