import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { decodeFormAnswers } from "@/lib/leads/form-labels";
import { ESCALATED_TYPE, type AttemptRow } from "./queue-rules";
import { escalationSummary, escalationVerdict } from "./escalation-rules";
import { sameOrNextWorkingDayAt } from "./retry-rules";
import { notifyOwnerEscalation } from "./notify";

const ATTEMPT_TYPES = ["call", "meeting", "viber_sent", "team_assigned", ESCALATED_TYPE];

export interface EscalationRun {
  checked: number;
  escalated: Array<{ id: string; name: string; summary: string }>;
}

/**
 * Сутрешната проверка: кой стои при екипа от 7 дни без резултат. Всеки такъв
 * картон получава активност `escalated` (маха го от опашката на екипа),
 * чуване за днес в 10:00 при Ивайло и писмо/Telegram с цялата история.
 * Безопасно за повторно пускане — вече върнат картон не се връща пак.
 */
export async function runEscalations(now: Date = new Date()): Promise<EscalationRun> {
  const sb = createServiceClient();
  const { data: contacts } = await sb
    .from("contacts")
    .select("id, full_name, phone, email, business, notes, source, source_ref")
    .eq("followup_status", "needs_call")
    .in("stage", ["lead", "contacted"])
    .not("phone", "is", null)
    .limit(400);
  const rows = (contacts ?? []) as Array<{
    id: string;
    full_name: string | null;
    phone: string | null;
    email: string | null;
    business: string | null;
    notes: string | null;
    source: string;
    source_ref: string | null;
  }>;
  const out: EscalationRun = { checked: rows.length, escalated: [] };
  if (rows.length === 0) return out;

  const { data: acts } = await sb
    .from("contact_activities")
    .select("contact_id, activity_type, title, occurred_at, created_by, metadata")
    .in("contact_id", rows.map((c) => c.id))
    .in("activity_type", ATTEMPT_TYPES)
    .order("occurred_at", { ascending: false })
    .limit(8000);
  const byContact = new Map<string, AttemptRow[]>();
  for (const a of (acts ?? []) as AttemptRow[]) {
    const list = byContact.get(a.contact_id) ?? [];
    list.push(a);
    byContact.set(a.contact_id, list);
  }

  const whenIso = sameOrNextWorkingDayAt(now, 10).toISOString();
  for (const c of rows) {
    const list = byContact.get(c.id) ?? [];
    const v = escalationVerdict(list, now);
    if (!v.escalate) continue;
    const summary = escalationSummary(v);
    const name = c.full_name?.trim() || c.phone || "Без име";

    const { error } = await sb.from("contact_activities").insert({
      contact_id: c.id,
      activity_type: ESCALATED_TYPE,
      title: `⏫ ${v.daysSinceFirst} дни без резултат · връща се на Ивайло`,
      body: `${summary}. Последно: ${list[0]?.title ?? "—"}${v.lastBy ? ` (${v.lastBy})` : ""}.`,
      occurred_at: now.toISOString(),
      created_by: "система",
      metadata: {
        escalated: true,
        rule: "7d",
        days: v.daysSinceFirst,
        team_attempts: v.teamAttempts,
        no_answer: v.noAnswer,
        talked: v.talked,
        last_outcome: v.lastOutcome,
        retry_at: whenIso,
      },
    });
    if (error) continue;
    await sb.from("contacts").update({ next_followup_at: whenIso, followup_status: "needs_call" }).eq("id", c.id);

    let formAnswers: Array<{ question: string; answer: string }> = [];
    if (c.source === "meta_lead" && c.source_ref) {
      const { data: m } = await sb.from("meta_leads").select("field_data").eq("meta_lead_id", c.source_ref).maybeSingle();
      formAnswers = m ? decodeFormAnswers((m as { field_data: unknown }).field_data) : [];
    }
    await notifyOwnerEscalation({
      contactId: c.id,
      name,
      phone: c.phone,
      email: c.email,
      business: c.business,
      source: c.source,
      formAnswers,
      notes: c.notes,
      summary,
      attempts: list
        .filter((a) => a.activity_type !== "team_assigned")
        .map((a) => ({ at: a.occurred_at, title: a.title, by: a.created_by })),
      whenIso,
    }).catch(() => {});
    out.escalated.push({ id: c.id, name, summary });
  }
  return out;
}
