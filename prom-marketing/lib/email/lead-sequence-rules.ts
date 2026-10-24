/**
 * Студената поредица — чистите правила на крона (без база), за да се тестват.
 * Двигателят е в lead-sequence.ts, текстовете — в lead-steps.ts.
 */
import { firstStepForForm, leadSequenceFor } from "./lead-steps";
import type { SequenceStep } from "./sequence-layout";

/**
 * Стъпката, чийто срок е дошъл: последната с `afterDays` ≤ възрастта на лийда.
 *
 * Първото писмо на лийд от Meta форма идва по формата (`firstStepForForm`):
 * лийд магнитът получава материала си, другите — демотата. Нормално то тръгва
 * още в webhook-а; кронът го праща само ако там не е тръгнало (Resend е
 * върнал грешка) — и тогава трябва да е същото писмо, не демотата вместо
 * наръчника. Ключът е общ (`s1_lichno`), затова не тръгва два пъти.
 */
export function dueSequenceStep(args: {
  source: string | null | undefined;
  ageDays: number;
  formId?: string | null;
}): SequenceStep | null {
  const sequence = leadSequenceFor(args.source);
  const due = [...sequence].reverse().find((s) => args.ageDays >= s.afterDays) ?? null;
  if (!due) return null;
  if (due.afterDays === 0 && args.source === "meta_lead") return firstStepForForm(args.formId);
  return due;
}

/**
 * Кой е натиснал „Спри писмата“ (бележка с `metadata.email_opt_out`, виж
 * app/api/email/unsubscribe). Страницата обещава „повече автоматични писма няма
 * да идват“ — до 07.10.2026 топлият кръг го спазваше, а студената поредица не.
 */
export function optedOutIds(rows: Array<{ contact_id: string; metadata: Record<string, unknown> | null }>): Set<string> {
  const out = new Set<string>();
  for (const r of rows) if (r.metadata?.email_opt_out === true) out.add(r.contact_id);
  return out;
}
