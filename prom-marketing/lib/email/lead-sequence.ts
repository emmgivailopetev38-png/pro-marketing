import "server-only";
import { sendEmail } from "./resend";
import { LEAD_SEQUENCE, LEAD_SOURCES, leadSequenceFor } from "./lead-steps";
import { firstName, type BuildCtx, type SequenceStep } from "./sequence-layout";
import { unsubscribeUrl } from "./unsubscribe-token";
import type { createServiceClient } from "@/lib/supabase/service";

type Sb = ReturnType<typeof createServiceClient>;

/** Текстовете живеят в `lead-steps.ts`; тук е само изпращането. */
export { LEAD_SEQUENCE };

function replyTo(): string {
  return process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
}

/** Изпраща една стъпка. Идемпотентно по (contact_id, step.key). */
export async function sendSequenceStep(args: {
  supabase: Sb;
  contactId: string;
  to: string;
  fullName: string | null;
  step: SequenceStep;
  source?: string;
}): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const { supabase, contactId, to, fullName, step, source } = args;

  const { data: already } = await supabase
    .from("contact_activities")
    .select("id")
    .eq("contact_id", contactId)
    .eq("activity_type", "email_sent")
    .contains("metadata", { seq_step: step.key })
    .maybeSingle();
  if (already) return { sent: false, skipped: "already_sent" };

  const ctx: BuildCtx = { contactId, source, unsubscribeUrl: unsubscribeUrl(contactId) };
  const { html, text } = step.build(firstName(fullName), ctx);
  const res = await sendEmail({ to, subject: step.subject, html, text, replyTo: replyTo() });

  if (res.error) {
    await supabase.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: "note",
      title: `Имейлът от поредицата не тръгна (${step.key})`,
      body: res.error,
      metadata: { seq_step_failed: step.key },
      created_by: "lead_sequence",
    });
    return { sent: false, error: res.error };
  }

  await supabase.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "email_sent",
    title: `Поредица · ${step.subject}`,
    body: `Автоматичен продажбен имейл до ${to}. Отговорите отиват на ${replyTo()}.`,
    metadata: { seq_step: step.key, resend_id: res.id, to, auto: true },
    created_by: "lead_sequence",
  });
  return { sent: true };
}

/**
 * ПРЕДПАЗИТЕЛ: поредицата важи само за лийдове, влезли СЛЕД този момент.
 * Без него един деплой би изсипал продажбени имейли върху 163-те исторически
 * лийда, внесени на 21.08 — хора отпреди месеци, които не чакат нищо от нас.
 * Не се пипа назад във времето.
 */
const SEQUENCE_EPOCH = "2026-08-21T12:00:00+03:00";

/** Втори предпазител: нищо по-старо от 30 дни не влиза в поредица. */
const MAX_AGE_DAYS = 30;

/** Трети предпазител: таван на изпратените за едно пускане. */
const MAX_PER_RUN = 40;

interface SeqContact {
  id: string;
  full_name: string | null;
  email: string | null;
  stage: string;
  source: string;
  created_at: string;
  last_heard_from_at: string | null;
}

/**
 * Минава лийдовете и изпраща следващата дължима стъпка.
 *
 * Спира поредицата, ако човекът е реагирал по какъвто и да е начин: етапът е
 * мръднал напред, чули сме се с него, или има разговор/среща в картона.
 * Продажбен имейл до човек, който вече е вдигнал телефона, е по-скъп от
 * пропуснат имейл.
 *
 * Лийдовете от гласовата реклама (`voice_web`) влизат тук от 05.09.2026 —
 * дотогава минаваха покрай поредицата и не получаваха нито едно писмо.
 * Разговорът им с агента НЕ се брои за „чули сме се": това беше машина, не
 * Ивайло; поредицата спира чак когато той им се обади или срещата е записана.
 */
export async function runLeadSequence(supabase: Sb): Promise<{
  checked: number;
  sent: number;
  skipped: number;
  details: Array<{ contact_id: string; step: string }>;
}> {
  const out = { checked: 0, sent: 0, skipped: 0, details: [] as Array<{ contact_id: string; step: string }> };
  if (process.env.LEAD_SEQUENCE_ENABLED === "false") return out;

  const epoch = new Date(SEQUENCE_EPOCH).toISOString();
  const oldest = new Date(Date.now() - MAX_AGE_DAYS * 86400_000).toISOString();
  const floor = epoch > oldest ? epoch : oldest;

  const { data: rows } = await supabase
    .from("contacts")
    .select("id, full_name, email, stage, source, created_at, last_heard_from_at")
    .in("source", [...LEAD_SOURCES])
    .in("stage", ["lead", "contacted"])
    .not("email", "is", null)
    .gte("created_at", floor)
    .order("created_at", { ascending: true })
    .limit(200);

  const contacts = (rows ?? []) as SeqContact[];
  if (contacts.length === 0) return out;

  // Кой вече е говорил с нас — при него поредицата спира.
  const ids = contacts.map((c) => c.id);
  const { data: touches } = await supabase
    .from("contact_activities")
    .select("contact_id")
    .in("contact_id", ids)
    .in("activity_type", ["call", "meeting"]);
  const talked = new Set((touches ?? []).map((t) => t.contact_id));

  const now = Date.now();
  for (const c of contacts) {
    if (out.sent >= MAX_PER_RUN) break;
    out.checked++;

    if (c.last_heard_from_at || talked.has(c.id) || !c.email) {
      out.skipped++;
      continue;
    }

    const ageDays = (now - new Date(c.created_at).getTime()) / 86400_000;
    // Последната стъпка, чийто срок е настъпил.
    const sequence = leadSequenceFor(c.source);
    const due = [...sequence].reverse().find((s) => ageDays >= s.afterDays);
    if (!due) {
      out.skipped++;
      continue;
    }

    const res = await sendSequenceStep({
      supabase,
      contactId: c.id,
      to: c.email,
      fullName: c.full_name,
      step: due,
      source: c.source,
    });
    if (res.sent) {
      out.sent++;
      out.details.push({ contact_id: c.id, step: due.key });
    } else {
      out.skipped++;
    }
  }

  return out;
}
