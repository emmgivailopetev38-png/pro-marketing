import "server-only";
import { allRows } from "@/lib/supabase/all-rows";
import { createServiceClient } from "@/lib/supabase/service";
import { listMembers } from "./repository";
import { meetUrlFor } from "./closer";
import { sortClosers } from "./closer-rules";
import { CLOSER_MEETING_MINUTES } from "./closer-calendar-rules";
import { phoneKey9 } from "./manager-rules";
import { feedToken, isLive, type CalMeeting } from "./kalendar-rules";
import { freeSlots, readGrafik, type Grafik } from "./grafik-rules";
import type { TeamMember } from "./types";

/** Четенето за „📅 Календар“: срещите от −7 до +45 дни, всяка с водещия си и линка за Meet. */

export interface CalendarData {
  meetings: CalMeeting[];
  closers: Array<{ id: string; name: string; meetUrl: string | null; org: string; grafik: Grafik | null }>;
  /** сетърите с графика си — кога са на линия (звънят) */
  setters: Array<{ id: string; name: string; org: string; grafik: Grafik | null }>;
  members: TeamMember[];
}

const DAY = 86_400_000;

function bookedByOf(raw: unknown): string | null {
  const r = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const m = typeof r.notes === "string" ? /Записа:\s*([^·\n]+)/.exec(r.notes) : null;
  if (m) return m[1].trim();
  return r.source === "voice" || r.source === "voice_public" ? "Ели" : null;
}

export async function loadCalendar(now: Date = new Date(), daysBack = 7, daysAhead = 45): Promise<CalendarData> {
  const sb = createServiceClient();
  const [members, bookings, owned] = await Promise.all([
    listMembers(),
    allRows<{
      id: string;
      attendee_name: string | null;
      attendee_phone: string | null;
      attendee_email: string | null;
      scheduled_at: string;
      status: string | null;
      business: string | null;
      meeting_url: string | null;
      recording_url: string | null;
      duration_minutes: number | null;
      raw_payload: unknown;
    }>((from, to) =>
      sb
        .from("bookings")
        .select("id, attendee_name, attendee_phone, attendee_email, scheduled_at, status, business, meeting_url, recording_url, duration_minutes, raw_payload")
        .gte("scheduled_at", new Date(now.getTime() - daysBack * DAY).toISOString())
        .lte("scheduled_at", new Date(now.getTime() + daysAhead * DAY).toISOString())
        .not("status", "in", "(cancelled,rejected)")
        .order("scheduled_at", { ascending: true })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    allRows<{ phone: string | null; email: string | null; owner_id: string | null }>((from, to) =>
      sb.from("contacts").select("phone, email, owner_id").not("owner_id", "is", null).order("id", { ascending: true }).range(from, to)
    ),
  ]);

  const closerList = sortClosers(members.filter((m) => m.active && m.role === "sales"));
  const defaultId = closerList[0]?.id ?? null;
  const byId = new Map(members.map((m) => [m.id, m]));
  const ownerByPhone = new Map<string, string>();
  const ownerByEmail = new Map<string, string>();
  for (const c of owned.rows) {
    if (!c.owner_id) continue;
    const k = phoneKey9(c.phone);
    if (k) ownerByPhone.set(k, c.owner_id);
    if (c.email) ownerByEmail.set(c.email.trim().toLowerCase(), c.owner_id);
  }

  const meetings: CalMeeting[] = bookings.rows
    .filter((b) => !(b.raw_payload && typeof b.raw_payload === "object" && (b.raw_payload as Record<string, unknown>).moved_to))
    .map((b) => {
      const k = phoneKey9(b.attendee_phone);
      const e = (b.attendee_email ?? "").trim().toLowerCase();
      const ownerId = (k ? ownerByPhone.get(k) : undefined) ?? (e ? ownerByEmail.get(e) : undefined) ?? null;
      const closer = ownerId ? byId.get(ownerId) ?? null : null;
      const isCloser = !!closer && closer.role === "sales";
      return {
        id: b.id,
        at: b.scheduled_at,
        minutes: b.duration_minutes && b.duration_minutes > 0 ? b.duration_minutes : CLOSER_MEETING_MINUTES,
        name: (b.attendee_name ?? "").trim() || "Без име",
        phone: b.attendee_phone,
        email: e && !/^(bez-imeil@promarketing\.pw|unknown@unknown)$/.test(e) ? e : null,
        business: b.business,
        status: String(b.status ?? ""),
        closerId: isCloser ? closer!.id : null,
        closer: isCloser ? closer!.full_name : null,
        bookedBy: bookedByOf(b.raw_payload),
        meetUrl: (b.meeting_url ?? "").trim() || (isCloser ? meetUrlFor(closer, defaultId) : null),
        recording: b.recording_url,
      };
    });

  const today = now.toLocaleDateString("sv-SE", { timeZone: "Europe/Sofia" });
  return {
    meetings,
    setters: members
      .filter((m) => m.active && m.role === "setter")
      .map((m) => ({ id: m.id, name: m.full_name, org: (m.org ?? "").trim() || "promarketing", grafik: readGrafik(m.availability ?? null, today) })),
    closers: closerList.map((m) => ({
      id: m.id,
      name: m.full_name,
      meetUrl: meetUrlFor(m, defaultId),
      org: (m.org ?? "").trim() || "promarketing",
      grafik: readGrafik(m.availability ?? null, today),
    })),
    members,
  };
}

export interface CloserSlots {
  id: string;
  name: string;
  /** има ли график; без график — всеки свободен час от 10:00 */
  scheduled: boolean;
  /** следващите свободни часове („2026-11-27T18:00“, София) */
  slots: string[];
}

/** Свободните часове на клоузърите по графиците им — за „Записах среща“ и за отказа при зает час. */
export async function freeSlotsByCloser(now: Date = new Date(), onlyId?: string | null, limit = 10): Promise<CloserSlots[]> {
  const data = await loadCalendar(now, 0.1, 9);
  return data.closers
    .filter((c) => !onlyId || c.id === onlyId)
    .map((c) => ({
      id: c.id,
      name: c.name,
      scheduled: !!c.grafik,
      slots: freeSlots(
        c.grafik,
        data.meetings.filter((m) => m.closerId === c.id && isLive(m.status)).map((m) => ({ at: m.at, minutes: m.minutes })),
        now,
        { days: 7, limit }
      ),
    }));
}

/** Личният линк за абонамент на този човек (или на собственика — key „owner“). */
export function feedUrlFor(key: string): string | null {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  if (secret.length < 32) return null;
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw").replace(/\/$/, "");
  return `${site}/api/ekip/kalendar/${feedToken(key, secret)}.ics`;
}
