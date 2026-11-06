import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { openPromisesByContact, type PromiseRow } from "@/lib/contacts/dnevnik-repository";
import { isLiveBooking } from "@/lib/crm/booking-status";
import type { TeamActor } from "./session";
import { bookingNote, byFollowup, pipelineOf, salesBucket, salesScore, type PipelineStep, type SalesContact } from "./sales-rules";
import { BRIEF_PREFIX, pickBriefs, type Brief } from "./brief-rules";

/**
 * Таблото на продавача. Единицата работа е картонът, който той води
 * (contacts.owner_id). Собственикът вижда своите (owner_id = null) + всички.
 */

const COLS =
  "id, full_name, company, business, phone, email, stage, followup_status, next_followup_at, last_heard_from_at, deal_value_eur, mood, owner_id, updated_at, created_at";

export interface SalesRow extends SalesContact {
  promises: PromiseRow[];
  last_activity: { title: string; at: string; by: string | null } | null;
  next_meeting: string | null;
  /** какво е казал човекът при записването (бележката на Ели / формата) */
  next_meeting_note: string | null;
  next_meeting_url: string | null;
  /** брифът, който Ивайло остави при предаването („🎯 Бриф за Георги …“) — кой е, оферта, възражения, ъгъл */
  brief: Brief | null;
}

export interface SalesBoard {
  today: SalesRow[];
  overdue: SalesRow[];
  /** предадени от екипа/Ивайло и още недокоснати от продавача */
  handed: SalesRow[];
  pipeline: SalesRow[];
  won: SalesRow[];
  lost: SalesRow[];
  steps: PipelineStep[];
  score: ReturnType<typeof salesScore>;
  /** срещите за 7 дни назад (резултатът им се отбелязва тук) и 14 напред */
  meetings: Array<{
    id: string;
    name: string;
    at: string;
    contact_id: string | null;
    phone: string | null;
    note: string | null;
    meeting_url: string | null;
    /** accepted/pending/confirmed = жива; completed / no_show = с резултат */
    status: string;
  }>;
}

export async function loadSalesBoard(actor: TeamActor, now: Date = new Date()): Promise<SalesBoard> {
  const sb = createServiceClient();
  const since = new Date(now.getTime() - 30 * 86_400_000).toISOString();
  const memberId = actor.member?.id ?? null;

  let q = sb.from("contacts").select(COLS).order("updated_at", { ascending: false }).limit(600);
  q = memberId ? q.eq("owner_id", memberId) : q.is("owner_id", null).neq("stage", "lead");
  const { data } = await q;
  const contacts = (data ?? []) as SalesContact[];
  const ids = contacts.map((c) => c.id);

  const [promises, { data: acts }, { data: briefActs }, { data: bookings }] = await Promise.all([
    openPromisesByContact(ids),
    ids.length
      ? sb
          .from("contact_activities")
          .select("contact_id, activity_type, title, occurred_at, created_by, metadata")
          .in("contact_id", ids)
          .gte("occurred_at", since)
          .order("occurred_at", { ascending: false })
          .limit(3000)
      : Promise.resolve({ data: [] }),
    // брифовете са дълги — теглят се отделно, само тях (без срок: брифът не изтича)
    ids.length
      ? sb.from("contact_activities").select("contact_id, title, body, occurred_at").in("contact_id", ids).like("title", `${BRIEF_PREFIX}%`).order("occurred_at", { ascending: false }).limit(1200)
      : Promise.resolve({ data: [] }),
    sb
      .from("bookings")
      .select("id, attendee_name, attendee_email, attendee_phone, scheduled_at, status, business, automation_goal, timeline, meeting_url, raw_payload")
      // 7 дни назад: миналите срещи чакат „проведена“ / „не се яви“ от водещия (06.11.2026).
      .gte("scheduled_at", new Date(now.getTime() - 7 * 86_400_000).toISOString())
      .lte("scheduled_at", new Date(now.getTime() + 14 * 86_400_000).toISOString())
      .not("status", "in", "(cancelled,rejected)")
      .order("scheduled_at", { ascending: true })
      .limit(80),
  ]);

  const byEmail = new Map<string, SalesContact>();
  const byPhone = new Map<string, SalesContact>();
  for (const c of contacts) {
    if (c.email) byEmail.set(c.email.toLowerCase(), c);
    if (c.phone) byPhone.set(c.phone.replace(/\D/g, "").slice(-9), c);
  }
  const nextMeeting = new Map<string, { at: string; note: string | null; url: string | null }>();
  const meetings: SalesBoard["meetings"] = [];
  type BookingRow = {
    id: string;
    attendee_name: string;
    attendee_email: string | null;
    attendee_phone: string | null;
    scheduled_at: string;
    status: string;
    business: string | null;
    automation_goal: string | null;
    timeline: string | null;
    meeting_url: string | null;
    raw_payload: unknown;
  };
  for (const b of (bookings ?? []) as BookingRow[]) {
    const c = (b.attendee_email && byEmail.get(b.attendee_email.toLowerCase())) || (b.attendee_phone && byPhone.get(b.attendee_phone.replace(/\D/g, "").slice(-9))) || null;
    const note = bookingNote(b);
    const url = b.meeting_url && /^https?:\/\//.test(b.meeting_url) ? b.meeting_url : null;
    const upcoming = new Date(b.scheduled_at).getTime() >= now.getTime() - 3_600_000 && isLiveBooking(b.status);
    if (c && upcoming && !nextMeeting.has(c.id)) nextMeeting.set(c.id, { at: b.scheduled_at, note, url });
    if (c || !memberId) {
      meetings.push({ id: b.id, name: b.attendee_name, at: b.scheduled_at, contact_id: c?.id ?? null, phone: b.attendee_phone ?? c?.phone ?? null, note, meeting_url: url, status: b.status });
    }
  }

  const lastAct = new Map<string, { title: string; at: string; by: string | null }>();
  const handedIds = new Set<string>();
  let calls = 0;
  let meetingsN = 0;
  let offers = 0;
  for (const a of (acts ?? []) as Array<{ contact_id: string; activity_type: string; title: string; occurred_at: string; created_by: string | null; metadata: Record<string, unknown> | null }>) {
    if (!lastAct.has(a.contact_id)) lastAct.set(a.contact_id, { title: a.title, at: a.occurred_at, by: a.created_by });
    const mine = actor.kind === "owner" ? ["ивайло", "ivailo"].includes((a.created_by ?? "").toLowerCase()) : a.created_by === actor.name;
    if (mine && a.activity_type === "call") calls += 1;
    if (mine && a.activity_type === "meeting") meetingsN += 1;
    if (mine && (a.activity_type === "offer_sent" || a.activity_type === "offer_created")) offers += 1;
    if (a.activity_type === "team_assigned" && memberId && a.metadata?.to_member_id === memberId) {
      // предаден на мен и след това не съм го докосвал
      const touchedAfter = ((acts ?? []) as Array<{ contact_id: string; created_by: string | null; occurred_at: string; activity_type: string }>).some(
        (x) => x.contact_id === a.contact_id && x.created_by === actor.name && x.occurred_at > a.occurred_at && (x.activity_type === "call" || x.activity_type === "meeting")
      );
      if (!touchedAfter) handedIds.add(a.contact_id);
    }
  }

  const briefs = pickBriefs((briefActs ?? []) as Array<{ contact_id: string; title: string | null; body: string | null; occurred_at: string }>);

  const rows: SalesRow[] = contacts.map((c) => ({
    ...c,
    promises: promises.get(c.id) ?? [],
    last_activity: lastAct.get(c.id) ?? null,
    next_meeting: nextMeeting.get(c.id)?.at ?? null,
    next_meeting_note: nextMeeting.get(c.id)?.note ?? null,
    next_meeting_url: nextMeeting.get(c.id)?.url ?? null,
    brief: briefs.get(c.id) ?? null,
  }));

  const board: SalesBoard = {
    today: [],
    overdue: [],
    handed: [],
    pipeline: [],
    won: [],
    lost: [],
    steps: pipelineOf(rows.filter((r) => r.stage !== "won" && r.stage !== "lost")),
    score: salesScore({ won: [], calls, meetings: meetingsN, offers }),
    meetings,
  };
  for (const r of rows) {
    if (handedIds.has(r.id) && r.stage !== "won" && r.stage !== "lost") {
      board.handed.push(r);
      continue;
    }
    const b = salesBucket(r, now, since);
    if (b) board[b].push(r);
  }
  board.today.sort(byFollowup);
  board.overdue.sort(byFollowup);
  board.pipeline.sort((a, b) => (b.last_activity?.at ?? b.updated_at).localeCompare(a.last_activity?.at ?? a.updated_at));
  board.score = salesScore({ won: board.won, calls, meetings: meetingsN, offers });
  return board;
}

/** Картонът принадлежи ли на този човек (или е Ивайло). */
export async function canTouchContact(actor: TeamActor, contactId: string): Promise<{ ok: boolean; contact: SalesContact | null }> {
  const sb = createServiceClient();
  const { data } = await sb.from("contacts").select(COLS).eq("id", contactId).maybeSingle();
  const contact = (data as SalesContact | null) ?? null;
  if (!contact) return { ok: false, contact: null };
  if (actor.kind === "owner") return { ok: true, contact };
  return { ok: contact.owner_id === actor.member?.id, contact };
}
