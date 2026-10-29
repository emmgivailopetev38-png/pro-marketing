import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { phoneKey } from "@/lib/voice/auto-call-rules";
import { SN_DEFAULTS, decideMessage, orderItems, type SnAct, type SnBooking, type SnContact, type SnItem, type SnOptions } from "./sinhron-rules";

/** Поводите: обаждане на Ели (набиране или разговор) и обаждане на Ивайло. */
const TRIGGER_TYPES = ["voice_outbound", "voice_call", "call"];

/** Всичко, което правилата гледат — за да не теглим целия картон. */
const DECISION_TYPES = [
  "meta_lead",
  "website_form",
  "note",
  "call",
  "meeting",
  "meeting_outcome",
  "payment_received",
  "invoice",
  "project_created",
  "viber_received",
  "whatsapp_received",
  "email_received",
  "email_reply",
  "viber_sent",
  "whatsapp_sent",
  "voice_call",
  "voice_outbound",
];

export interface SinhronResult {
  items: SnItem[];
  skipped: { id: string; name: string | null; why: string }[];
}

/**
 * Кой какво съобщение трябва да получи след обаждане — по целия картон на
 * човека (как Ели звъни: `lib/voice/auto-call.ts`). Машината на Мака го
 * взима от `GET /api/messaging/sinhron` при всяко пускане.
 */
export async function findMessages(now = new Date(), opts: SnOptions = SN_DEFAULTS): Promise<SinhronResult> {
  const sb = createServiceClient();
  const since = new Date(now.getTime() - opts.maxAgeDays * 86_400_000).toISOString();
  const { data: trig, error: trigErr } = await sb
    .from("contact_activities")
    .select("contact_id")
    .in("activity_type", TRIGGER_TYPES)
    .gte("occurred_at", since)
    .limit(1000);
  if (trigErr) throw new Error(`поводите: ${trigErr.message}`);
  const ids = Array.from(new Set((trig ?? []).map((r) => String(r.contact_id)).filter(Boolean)));
  if (ids.length === 0) return { items: [], skipped: [] };

  const [{ data: contacts, error: cErr }, { rows: acts, error: aErr }, { data: bookings, error: bErr }] = await Promise.all([
    sb.from("contacts").select("id, full_name, phone, email, source, stage, followup_status, last_heard_from_at").in("id", ids),
    allRows<Record<string, unknown>>((from, to) =>
      sb
        .from("contact_activities")
        .select("id, contact_id, activity_type, title, body, occurred_at, created_by, metadata")
        .in("contact_id", ids)
        .in("activity_type", DECISION_TYPES)
        .order("occurred_at", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    sb.from("bookings").select("attendee_phone, scheduled_at, status, meeting_url").gt("scheduled_at", now.toISOString()),
  ]);
  if (cErr) throw new Error(`картоните: ${cErr.message}`);
  if (aErr) throw new Error(`активностите: ${aErr}`);
  if (bErr) throw new Error(`часовете: ${bErr.message}`);

  const byContact = new Map<string, SnAct[]>();
  for (const a of acts) {
    const k = String(a.contact_id);
    if (!byContact.has(k)) byContact.set(k, []);
    byContact.get(k)!.push(a as unknown as SnAct);
  }
  const byPhone = new Map<string, SnBooking[]>();
  for (const b of bookings ?? []) {
    const k = phoneKey(b.attendee_phone as string | null);
    if (!k) continue;
    if (!byPhone.has(k)) byPhone.set(k, []);
    byPhone.get(k)!.push({ scheduled_at: String(b.scheduled_at), meeting_url: (b.meeting_url as string | null) ?? null, status: (b.status as string | null) ?? null });
  }

  const items: SnItem[] = [];
  const skipped: SinhronResult["skipped"] = [];
  for (const c of (contacts ?? []) as SnContact[]) {
    const mine = byContact.get(c.id) ?? [];
    const hasWa = mine.some((a) => a.activity_type === "whatsapp_sent" || a.activity_type === "whatsapp_received");
    const d = decideMessage(c, mine, byPhone.get(phoneKey(c.phone)) ?? [], hasWa, now, opts);
    if ("item" in d) items.push(d.item);
    else skipped.push({ id: c.id, name: c.full_name, why: d.skip });
  }
  return { items: orderItems(items), skipped };
}
