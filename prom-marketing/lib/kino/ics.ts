/**
 * „Добави в календара“ — .ics файл (Apple, Outlook, всякакви) и линк за
 * Google Calendar. Чисти функции: без база, без браузър.
 *
 * Часовете се пишат в UTC (…Z) — така няма нужда от VTIMEZONE блок и всеки
 * календар ги показва в своята зона. Редовете над 75 байта се пренасят по
 * RFC 5545, като се броят БАЙТОВЕ (кирилицата е по 2 байта на буква), а не
 * знаци — иначе Outlook реже по средата на буквата.
 */

export interface KinoCalendarEvent {
  uid: string;
  startMs: number;
  endMs: number;
  title: string;
  description: string;
  url?: string;
  location?: string;
  /** Напомняния преди началото, в минути. */
  alarmsMinutes?: number[];
  /** За DTSTAMP — подава се отвън, за да са тестовете детерминирани. */
  nowMs?: number;
}

/** 2026-11-10T17:30:00Z → „20261110T173000Z“ */
export function icsDate(ms: number): string {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Текстовите полета в ICS: \ ; , и новите редове се ескейпват. */
export function icsEscape(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** Пренася ред на части от най-много 75 байта; продълженията започват с интервал. */
export function icsFold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > limit) {
      out.push(current);
      current = ch;
      bytes = b;
      limit = 74; // продължението има водещ интервал
    } else {
      current += ch;
      bytes += b;
    }
  }
  if (current) out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(ev: KinoCalendarEvent): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pro Marketing//Kino VALNATA//BG",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.uid}`,
    `DTSTAMP:${icsDate(ev.nowMs ?? Date.now())}`,
    `DTSTART:${icsDate(ev.startMs)}`,
    `DTEND:${icsDate(ev.endMs)}`,
    `SUMMARY:${icsEscape(ev.title)}`,
    `DESCRIPTION:${icsEscape(ev.description)}`,
  ];
  if (ev.url) lines.push(`URL:${ev.url}`);
  if (ev.location) lines.push(`LOCATION:${icsEscape(ev.location)}`);
  for (const m of ev.alarmsMinutes ?? []) {
    lines.push(
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${icsEscape(ev.title)}`,
      `TRIGGER:-PT${Math.max(0, Math.round(m))}M`,
      "END:VALARM",
    );
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(icsFold).join("\r\n") + "\r\n";
}

export function googleCalendarUrl(ev: Pick<KinoCalendarEvent, "startMs" | "endMs" | "title" | "description" | "location">): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${icsDate(ev.startMs)}/${icsDate(ev.endMs)}`,
    details: ev.description,
    ctz: "Europe/Sofia",
  });
  if (ev.location) params.set("location", ev.location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
