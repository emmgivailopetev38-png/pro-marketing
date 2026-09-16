import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { decodeFormAnswers } from "@/lib/leads/form-labels";
import type { BookedRow, QueueLead } from "./types";
import { todayEndIso } from "./time";

/**
 * Опашката за звънене на човека за срещите.
 *
 * „Нови“ = картон в етап lead, с телефон, от последните 90 дни, без нито
 * един опит за контакт (call / meeting / viber_sent). Мери се по активности,
 * не по next_followup_at — иначе тъмната опашка е невидима (виж
 * crm-tumnata-opashka-liidove). Най-новите най-горе: топлият лийд е този
 * отпреди пет минути.
 *
 * „За повторно“ = хора, на които САМИЯТ екип е звънял и е насрочил ново
 * чуване, чийто ден е дошъл. Обещанията на Ивайло („ти обеща да звъннеш“)
 * остават в неговия сутрешен списък, не тук.
 */

const COLS =
  "id, full_name, phone, email, company, business, source, source_ref, stage, followup_status, next_followup_at, created_at, notes";
const ATTEMPT_TYPES = ["call", "meeting", "viber_sent"];
const WINDOW_DAYS = 90;
const MAX_FRESH = 200;

interface ContactLite {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  company: string | null;
  business: string | null;
  source: string;
  source_ref: string | null;
  stage: string;
  followup_status: string | null;
  next_followup_at: string | null;
  created_at: string;
  notes: string | null;
}

interface AttemptRow {
  contact_id: string;
  activity_type: string;
  title: string;
  occurred_at: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

export interface SetterQueue {
  fresh: QueueLead[];
  retry: QueueLead[];
  /** Насрочени от екипа за по-нататък — само брой, за да се знае, че не са изгубени. */
  later: number;
  booked: BookedRow[];
}

export async function loadSetterQueue(now: Date = new Date()): Promise<SetterQueue> {
  const sb = createServiceClient();
  const since = new Date(now.getTime() - WINDOW_DAYS * 86_400_000).toISOString();
  const todayEnd = todayEndIso(now);

  const [{ data: leadRows }, { data: dueRows }, { data: bookedRows }] = await Promise.all([
    sb
      .from("contacts")
      .select(COLS)
      .eq("stage", "lead")
      .not("phone", "is", null)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(MAX_FRESH),
    sb
      .from("contacts")
      .select(COLS)
      .eq("followup_status", "needs_call")
      .not("phone", "is", null)
      .not("next_followup_at", "is", null)
      .in("stage", ["lead", "contacted"])
      .order("next_followup_at", { ascending: true })
      .limit(150),
    sb
      .from("bookings")
      .select("id, attendee_name, attendee_phone, scheduled_at, business, status, raw_payload")
      .eq("raw_payload->>source", "ekip")
      .gte("scheduled_at", new Date(now.getTime() - 3_600_000).toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(30),
  ]);

  const leads = (leadRows ?? []) as ContactLite[];
  const due = (dueRows ?? []) as ContactLite[];
  const ids = [...new Set([...leads, ...due].map((c) => c.id))];

  const attempts = new Map<string, { count: number; last: AttemptRow; team: boolean }>();
  if (ids.length > 0) {
    const { data } = await sb
      .from("contact_activities")
      .select("contact_id, activity_type, title, occurred_at, created_by, metadata")
      .in("contact_id", ids)
      .in("activity_type", ATTEMPT_TYPES)
      .order("occurred_at", { ascending: false });
    for (const a of (data ?? []) as AttemptRow[]) {
      const cur = attempts.get(a.contact_id);
      const team = a.metadata?.team === true;
      if (!cur) attempts.set(a.contact_id, { count: 1, last: a, team });
      else {
        cur.count += 1;
        cur.team = cur.team || team;
      }
    }
  }

  const freshContacts = leads.filter((c) => !attempts.has(c.id));
  const dueTeam = due.filter((c) => attempts.get(c.id)?.team);
  const retryContacts = dueTeam.filter((c) => (c.next_followup_at ?? "") <= todayEnd);
  const later = dueTeam.length - retryContacts.length;

  // Отговорите от формата — по meta_lead_id (source_ref на картона).
  const refs = [...freshContacts, ...retryContacts]
    .filter((c) => c.source === "meta_lead" && c.source_ref)
    .map((c) => c.source_ref as string);
  const forms = new Map<string, { ad_name: string | null; field_data: unknown }>();
  if (refs.length > 0) {
    const { data } = await sb.from("meta_leads").select("meta_lead_id, ad_name, field_data").in("meta_lead_id", refs);
    for (const m of (data ?? []) as Array<{ meta_lead_id: string; ad_name: string | null; field_data: unknown }>) {
      forms.set(m.meta_lead_id, { ad_name: m.ad_name, field_data: m.field_data });
    }
  }

  const toLead = (c: ContactLite): QueueLead => {
    const form = c.source_ref ? forms.get(c.source_ref) : undefined;
    const att = attempts.get(c.id);
    return {
      id: c.id,
      full_name: c.full_name,
      phone: c.phone as string,
      email: c.email,
      company: c.company,
      business: c.business,
      source: c.source,
      stage: c.stage,
      followup_status: c.followup_status,
      next_followup_at: c.next_followup_at,
      created_at: c.created_at,
      notes: c.notes,
      ad_name: form?.ad_name ?? null,
      form_answers: form ? decodeFormAnswers(form.field_data) : [],
      attempts: att?.count ?? 0,
      last_attempt: att ? { title: att.last.title, at: att.last.occurred_at, by: att.last.created_by } : null,
    };
  };

  const booked: BookedRow[] = ((bookedRows ?? []) as Array<Record<string, unknown>>).map((b) => ({
    id: String(b.id),
    attendee_name: String(b.attendee_name ?? ""),
    attendee_phone: (b.attendee_phone as string | null) ?? null,
    scheduled_at: String(b.scheduled_at),
    business: (b.business as string | null) ?? null,
    status: String(b.status ?? ""),
    notes: ((b.raw_payload as Record<string, unknown> | null)?.notes as string | null) ?? null,
  }));

  return {
    fresh: freshContacts.map(toLead),
    retry: retryContacts.map(toLead),
    later,
    booked,
  };
}
