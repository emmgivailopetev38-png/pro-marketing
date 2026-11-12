/**
 * „🆕 Моите нови“ — новите лийдове на Ивайло от 50/50 (split-rules.ts), подредени
 * по това какво трябва да направи ТОЙ. Чисти правила, без база — тестват се.
 *
 * Ивайло, 12.11.2026: „къде точно да ги видя моите нови лидове? Искам да се
 * виждат ясно, защото така се обърквам… които са нови, чути от Ели, но Ели не
 * успява да запише среща — ясно искам да се виждат“.
 */
import { last9 } from "./sreshti-zastapvane";

export type MoiNoviGroup = "eli_talked" | "eli_no_answer" | "not_called" | "meeting" | "done";

export const GROUPS: Array<{ key: MoiNoviGroup; title: string; hint: string }> = [
  { key: "eli_talked", title: "🔥 Ели говори с тях — НЕ записа среща", hint: "Звънни ти. Резюмето отдолу казва с какво влизаш." },
  { key: "eli_no_answer", title: "📵 Ели звъня — не вдигат / затвориха", hint: "Звънни ти или прати съобщение." },
  { key: "not_called", title: "🆕 Още никой не им е звънял", hint: "Ели звъни пон–пт 09:00–17:50 до ~2 мин след заявката." },
  { key: "meeting", title: "📅 Имат среща с теб", hint: "В твоя календар (пон–чт 12–18)." },
  { key: "done", title: "🗂 Приключени", hint: "Минала среща, клиент или отказ." },
];

export interface ActRow {
  contact_id: string;
  activity_type: string;
  title?: string | null;
  occurred_at: string;
  created_by?: string | null;
  metadata: Record<string, unknown> | null;
}

export interface BookingLite {
  id: string;
  status: string | null;
  scheduled_at: string;
  attendee_email: string | null;
  attendee_phone: string | null;
}

export interface LeadLite {
  id: string;
  email: string | null;
  phone: string | null;
  stage: string | null;
}

const LIVE = new Set(["accepted", "pending", "confirmed"]);
const DONE_STAGES = new Set(["won", "lost", "client"]);

/** Под ~20 сек не е разговор — човекът е затворил, щом е чул агента (като eli-rules.ts). */
function eliTalked(rows: ActRow[]): boolean {
  return rows.some((r) => {
    if (r.activity_type !== "voice_call") return false;
    const secs = r.metadata?.duration_secs;
    return typeof secs !== "number" || secs >= 20;
  });
}

function eliTouched(rows: ActRow[]): boolean {
  return rows.some((r) => r.activity_type === "voice_outbound" || r.activity_type === "voice_call");
}

/** Срещите на човека — по истински имейл или последните 9 цифри от телефона. */
export function bookingsFor(lead: LeadLite, bookings: BookingLite[]): BookingLite[] {
  const p = last9(lead.phone);
  const e = (lead.email ?? "").trim().toLowerCase();
  const realE = e && !e.endsWith("@promarketing.pw") ? e : null;
  return bookings.filter((b) => {
    const bp = last9(b.attendee_phone);
    const be = (b.attendee_email ?? "").trim().toLowerCase();
    return (p && bp === p) || (realE && be === realE);
  });
}

export function classifyLead(
  lead: LeadLite,
  eliRows: ActRow[],
  bookings: BookingLite[],
  now: Date
): { group: MoiNoviGroup; meetingAt: string | null } {
  const mine = bookingsFor(lead, bookings).filter((b) => LIVE.has(String(b.status ?? "")) || b.status === "completed");
  const upcoming = mine
    .filter((b) => LIVE.has(String(b.status ?? "")) && new Date(b.scheduled_at).getTime() > now.getTime() - 3_600_000)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  if (upcoming.length) return { group: "meeting", meetingAt: upcoming[0].scheduled_at };
  const past = mine.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  if (past.length || DONE_STAGES.has(String(lead.stage ?? ""))) return { group: "done", meetingAt: past[0]?.scheduled_at ?? null };
  if (eliTalked(eliRows)) return { group: "eli_talked", meetingAt: null };
  if (eliTouched(eliRows)) return { group: "eli_no_answer", meetingAt: null };
  return { group: "not_called", meetingAt: null };
}
