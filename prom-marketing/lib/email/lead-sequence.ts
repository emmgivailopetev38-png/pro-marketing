import "server-only";
import { sendEmail } from "./resend";
import { LEAD_SEQUENCE, LEAD_SOURCES } from "./lead-steps";
import { dueSequenceStep, optedOutIds } from "./lead-sequence-rules";
import { firstName, type BuildCtx, type SequenceStep } from "./sequence-layout";
import { unsubscribeUrl } from "./unsubscribe-token";
import { loadAkademiaIds } from "@/lib/team/ivailo";
import { magnetStepFor } from "@/lib/leads/meta-lead-rules";
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
    metadata: { seq_step: step.key, ...(step.variant ? { seq_variant: step.variant } : {}), resend_id: res.id, to, auto: true },
    created_by: "lead_sequence",
  });
  return { sent: true };
}

/**
 * Материалът на лийд магнит (наръчникът, курсът…) до човек, който ВЕЧЕ има
 * картон. Новият картон получава първото писмо на поредицата направо в
 * webhook-а; досега старият не получаваше нищо — нито материала, който току-що
 * е поискал. Веднъж на вариант: ако вече е получил същия материал (като първо
 * писмо или оттук), не тръгва втори път. Форма, която не е магнит — нищо.
 */
export async function sendMagnetToExisting(args: {
  supabase: Sb;
  contactId: string;
  to: string;
  fullName: string | null;
  formId: string | null | undefined;
}): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const step = magnetStepFor(args.formId, false);
  if (!step?.variant) return { sent: false, skipped: "not_magnet" };
  const { data: got } = await args.supabase
    .from("contact_activities")
    .select("id")
    .eq("contact_id", args.contactId)
    .eq("activity_type", "email_sent")
    .contains("metadata", { seq_variant: step.variant })
    .limit(1);
  if ((got ?? []).length > 0) return { sent: false, skipped: "already_has_it" };
  return sendSequenceStep({ supabase: args.supabase, contactId: args.contactId, to: args.to, fullName: args.fullName, step });
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
  source_ref: string | null;
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
    .select("id, full_name, email, stage, source, source_ref, created_at, last_heard_from_at")
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
  // Натиснал „Спри писмата“ — повече автоматични писма няма (така обещава страницата).
  const { data: optRows } = await supabase
    .from("contact_activities")
    .select("contact_id, metadata")
    .in("contact_id", ids)
    .eq("activity_type", "note")
    .eq("metadata->>email_opt_out", "true");
  const optedOut = optedOutIds((optRows ?? []) as Array<{ contact_id: string; metadata: Record<string, unknown> | null }>);
  // Формата на всеки Meta лийд — първото писмо на лийд магнита носи материала му.
  const refs = contacts.filter((c) => c.source === "meta_lead" && c.source_ref).map((c) => c.source_ref as string);
  const formByRef = new Map<string, string>();
  if (refs.length > 0) {
    const { data: forms } = await supabase.from("meta_leads").select("meta_lead_id, form_id").in("meta_lead_id", refs);
    for (const f of (forms ?? []) as Array<{ meta_lead_id: string; form_id: string | null }>) {
      if (f.form_id) formByRef.set(f.meta_lead_id, f.form_id);
    }
  }
  // Хората от Академията са в менторската на Ивайло — продажбен имейл „ето ти
  // демотата“ не е за тях (06.10.2026: трима от Академията получиха по два).
  // Не се знае ли кои са — днес не тръгва нищо, утре пак.
  let akademia: Set<string>;
  try {
    akademia = await loadAkademiaIds(ids, supabase);
  } catch {
    return out;
  }

  const now = Date.now();
  for (const c of contacts) {
    if (out.sent >= MAX_PER_RUN) break;
    out.checked++;

    if (c.last_heard_from_at || talked.has(c.id) || akademia.has(c.id) || optedOut.has(c.id) || !c.email) {
      out.skipped++;
      continue;
    }

    const ageDays = (now - new Date(c.created_at).getTime()) / 86400_000;
    // Последната стъпка, чийто срок е настъпил (първото писмо — по формата на лийда).
    const due = dueSequenceStep({
      source: c.source,
      ageDays,
      formId: c.source_ref ? formByRef.get(c.source_ref) : null,
    });
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
