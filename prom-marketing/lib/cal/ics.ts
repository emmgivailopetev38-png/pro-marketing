/**
 * Покана за календар (iCalendar, RFC 5545 + iTIP/iMIP) — чист текст, без мрежа.
 *
 * Защо я има: Cal.com записва час само в свободен слот на графика си
 * (пон–пет 12–18 на кръгъл час и само когато календарът е свободен). Час,
 * уговорен по телефона за 11:00 или 17:30, Cal.com отказва — и срещата
 * оставаше само в CRM-а, без да стигне до календара на клоузъра
 * (4 от 5 срещи, записани от /ekip между 04.11 и 11.11.2026).
 *
 * Поканата тук не минава през Cal.com: праща се по имейл като `.ics` с
 * METHOD:REQUEST — Google, Apple и Outlook я слагат в календара на получателя
 * за всеки час. Същият UID с по-голям SEQUENCE мести срещата, METHOD:CANCEL я
 * маха.
 */

export type IcsMethod = "REQUEST" | "CANCEL";

export interface IcsPerson {
  name: string;
  email: string;
}

export interface IcsInviteInput {
  /** Постоянен за срещата — същият при местене и отмяна. */
  uid: string;
  /** Расте при всяка промяна; получателят взима най-голямото. */
  sequence: number;
  method: IcsMethod;
  /** Начало в UTC (ISO). */
  startISO: string;
  minutes: number;
  summary: string;
  description?: string | null;
  location?: string | null;
  url?: string | null;
  organizer: IcsPerson;
  attendee: IcsPerson;
  /** Напомняне N минути преди (само при REQUEST). */
  alarmMinutes?: number;
  /** За тестовете — „сега“ в DTSTAMP. */
  now?: Date;
}

/** 20261117T090000Z — дата и час в UTC, както ги иска стандартът. */
export function icsDate(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Текст в поле: обратна черта, запетая, точка и запетая и нов ред се екранират. */
export function icsEscape(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

/** Стойност на параметър (CN=…) — в кавички, без кавички и нови редове вътре. */
function icsParam(text: string): string {
  return `"${text.replace(/["\r\n]/g, " ").trim()}"`;
}

const encoder = new TextEncoder();

/**
 * Ред до 75 октета; продължението започва с интервал. Броят се байтове, не
 * знаци — кирилицата е по два, а емоджито по четири, и знак не се цепи наполовина.
 */
export function foldIcsLine(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const b = encoder.encode(ch).length;
    if (bytes + b > limit) {
      out.push(cur);
      cur = " ";
      bytes = 1;
      limit = 75;
    }
    cur += ch;
    bytes += b;
  }
  if (cur) out.push(cur);
  return out.join("\r\n");
}

export function buildInviteIcs(input: IcsInviteInput): string {
  const start = new Date(input.startISO);
  if (Number.isNaN(start.getTime())) throw new Error("invalid start");
  const end = new Date(start.getTime() + Math.max(1, input.minutes) * 60_000);
  const cancel = input.method === "CANCEL";

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "PRODID:-//ProMarketing//CRM//BG",
    "VERSION:2.0",
    "CALSCALE:GREGORIAN",
    `METHOD:${input.method}`,
    "BEGIN:VEVENT",
    `UID:${input.uid}`,
    `SEQUENCE:${Math.max(0, Math.floor(input.sequence))}`,
    `DTSTAMP:${icsDate(input.now ?? new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsEscape(input.summary)}`,
  ];
  if (input.description?.trim()) lines.push(`DESCRIPTION:${icsEscape(input.description.trim())}`);
  if (input.location?.trim()) lines.push(`LOCATION:${icsEscape(input.location.trim())}`);
  if (input.url?.trim()) lines.push(`URL:${input.url.trim()}`);
  lines.push(
    `ORGANIZER;CN=${icsParam(input.organizer.name)}:mailto:${input.organizer.email.trim().toLowerCase()}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=${cancel ? "FALSE" : "TRUE"};CN=${icsParam(
      input.attendee.name
    )}:mailto:${input.attendee.email.trim().toLowerCase()}`,
    `STATUS:${cancel ? "CANCELLED" : "CONFIRMED"}`,
    "TRANSP:OPAQUE"
  );
  if (!cancel && input.alarmMinutes && input.alarmMinutes > 0) {
    lines.push(
      "BEGIN:VALARM",
      `TRIGGER:-PT${Math.floor(input.alarmMinutes)}M`,
      "ACTION:DISPLAY",
      "DESCRIPTION:Reminder",
      "END:VALARM"
    );
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}

/**
 * Линк „Добави в Google Календар“ — резервата, ако пощата на човека не сложи
 * поканата сама: отваря готово събитие, остава едно „Запази“.
 */
export function googleCalendarTemplateUrl(args: {
  startISO: string;
  minutes: number;
  title: string;
  details?: string | null;
  location?: string | null;
}): string {
  const start = new Date(args.startISO);
  const end = new Date(start.getTime() + Math.max(1, args.minutes) * 60_000);
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: args.title,
    dates: `${icsDate(start)}/${icsDate(end)}`,
  });
  if (args.details?.trim()) p.set("details", args.details.trim().slice(0, 1500));
  if (args.location?.trim()) p.set("location", args.location.trim());
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
