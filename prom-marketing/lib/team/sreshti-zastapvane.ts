/**
 * Срещите с Ивайло са по MEETING_MINUTES (45) минути и една друга не застъпват.
 *
 * До 29.09.2026 „Записах среща“ приемаше всеки час, а наръчникът на сетъра
 * учеше „цели часове или половинки“ — остатък от 30-минутните срещи. Среща без
 * имейл при това не влиза в календара, тоест и Cal.com не я вижда: на 30.09
 * среща по телефона в 13:45 застана върху среща в 14:00 и никой не разбра.
 *
 * Чисти правила, без база — тестват се.
 */
import { MEETING_MINUTES } from "@/lib/cal/types";
import { TZ } from "@/lib/contacts/followup";
import { fmtSofia, isoToSofiaLocal } from "./time";

/** Статуси, които НЕ държат час: отменени, проведени, неявили се, неуточнени. */
export const FREE_STATUSES = ["cancelled", "rejected", "no_show", "completed", "pending"] as const;

/** Колко назад да гледа заявката: най-дългата среща в базата е 90 мин. */
export const LOOKBACK_MINUTES = 4 * 60;
/** И колко напред — предложеният „свободен час след нея“ трябва да вижда и
 * следващите срещи в деня, иначе ще предложи зает час. */
export const LOOKAHEAD_MINUTES = 8 * 60;

export type BusyMeeting = {
  name: string;
  startIso: string;
  minutes: number | null;
  email?: string | null;
  phone?: string | null;
};

export type Person = { email?: string | null; phone?: string | null };

const MIN = 60_000;

/** Имейли-запълвачи: зад тях стоят различни хора, не един. */
const PLACEHOLDER_EMAIL = /^(bez-imeil@promarketing\.pw|unknown@unknown)$/;

function startMs(m: { startIso: string }): number {
  return new Date(m.startIso).getTime();
}

function endMs(m: { startIso: string; minutes: number | null }): number {
  const minutes = m.minutes && m.minutes > 0 ? m.minutes : MEETING_MINUTES;
  return startMs(m) + minutes * MIN;
}

function realEmail(e?: string | null): string | null {
  const v = (e ?? "").trim().toLowerCase();
  return v && !PLACEHOLDER_EMAIL.test(v) ? v : null;
}

function last9(phone?: string | null): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  return d.length >= 9 ? d.slice(-9) : null;
}

/**
 * Същият човек — по истински имейл или по телефон. Неговата среща не пречи:
 * Димитър първо записва през Cal.com, после натиска „Записах среща“ за същия
 * час, а понякога и мести срещата с час напред.
 */
export function samePerson(a: Person, b: Person): boolean {
  const ea = realEmail(a.email);
  if (ea && ea === realEmail(b.email)) return true;
  const pa = last9(a.phone);
  return !!pa && pa === last9(b.phone);
}

/** Първата (най-ранна) среща на друг човек, която се застъпва с новата. */
export function findOverlap(
  startIso: string,
  busy: BusyMeeting[],
  who: Person = {},
  minutes: number = MEETING_MINUTES
): BusyMeeting | null {
  const s = new Date(startIso).getTime();
  const e = s + minutes * MIN;
  const hits = busy
    .filter((b) => !samePerson(who, b))
    .filter((b) => startMs(b) < e && s < endMs(b))
    .sort((a, b) => startMs(a) - startMs(b));
  return hits[0] ?? null;
}

/**
 * Два близки свободни часа около конфликта: веднага след срещите, които пречат,
 * и точно преди конфликтната — ако и той е свободен и не е минал.
 */
export function freeAround(
  startIso: string,
  busy: BusyMeeting[],
  who: Person = {},
  minutes: number = MEETING_MINUTES,
  now: Date = new Date()
): { before: Date | null; after: Date } {
  const first = findOverlap(startIso, busy, who, minutes);
  if (!first) return { before: null, after: new Date(startIso) };

  let after = new Date(endMs(first));
  // Всяка следваща среща, в която се блъска, я бута по-нататък. Краен брой
  // стъпки, защото всяка стъпка минава края на поне една от срещите.
  for (let i = 0; i < busy.length; i++) {
    const hit = findOverlap(after.toISOString(), busy, who, minutes);
    if (!hit) break;
    after = new Date(endMs(hit));
  }

  const beforeMs = startMs(first) - minutes * MIN;
  const before =
    beforeMs > now.getTime() &&
    sofiaMinuteOfDay(new Date(beforeMs)) >= EARLIEST_MINUTE &&
    !findOverlap(new Date(beforeMs).toISOString(), busy, who, minutes)
      ? new Date(beforeMs)
      : null;

  return { before, after };
}

/** По-рано от 9:00 не се предлага — срещите се правят в работно време. */
const EARLIEST_MINUTE = 9 * 60;

function sofiaMinuteOfDay(d: Date): number {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .formatToParts(d)
    .reduce<Record<string, string>>((acc, x) => ((acc[x.type] = x.value), acc), {});
  return Number(p.hour) * 60 + Number(p.minute);
}

const hhmm = (d: Date | string) => isoToSofiaLocal(d).slice(11);

/** Текстът за човека от екипа: с кого е застъпването и кои часове остават. */
export function clashMessage(clash: BusyMeeting, before: Date | null, after: Date): string {
  const end = new Date(endMs(clash));
  const options = [before ? `в ${hhmm(before)} (свършва точно преди нея)` : null, `от ${fmtSofia(after)} нататък`]
    .filter(Boolean)
    .join(" или ");
  return (
    `В този час Ивайло вече има среща — ${clash.name}, ${fmtSofia(clash.startIso)}–${hhmm(end)}. ` +
    `Срещите са по ${MEETING_MINUTES} минути и не се застъпват. ` +
    `Предложи ${options} и провери часа в календара (🗓) — там са и другите му ангажименти.`
  );
}
