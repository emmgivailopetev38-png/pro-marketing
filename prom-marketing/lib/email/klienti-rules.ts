/**
 * Клиентите и хората в програмата не получават автоматични писма.
 *
 * Ивайло (16.10.2026): „Моите клиенти, аз си комуникирам с тях, няма нужда да
 * им пращаме повече имейли.“ Поводът: за 10 дни топлият кръг прати писма на
 * шестима от Академията (Михаил Михов — по втория му картон, Катерина
 * Чолакова, Ели от екипа…) и на Иво Иванов, който плаща реклами от 05.10.
 * Кръгът спираше само при `won`, а повечето клиенти не стоят на `won`.
 *
 * Клиент е човекът, ако има поне едно от:
 *   • етап `won`;
 *   • фактура, плащане или абонамент в CRM-а;
 *   • 🎓 знак от Академията (виж isAkademiaSignal);
 *   • бележка с `metadata.no_auto_email` — Ивайло (или Клод по негова дума)
 *     го е маркирал ръчно, защото CRM-ът още не знае;
 *   • проформа или „готов за затваряне“ — парите вече се движат.
 * Важи за всички картони със същия имейл: клиентът често има втори картон
 * (заявка от Академията, нова форма), а писмото отива на адреса, не на картона.
 *
 * Чисти правила, без база — тестват се. Базата е в klienti.ts.
 */

export const CLIENT_STAGES = ["won"];

/** Статуси, при които парите вече се движат — автоматика тук само пречи. */
export const CLOSING_FOLLOWUPS = ["sent_proforma", "ready_to_close"];

/** Ключът в `metadata` на бележка, който спира автоматичните писма до човека. */
export const NO_AUTO_EMAIL_KEY = "no_auto_email";

export type ClientWhy = "won" | "paid" | "akademia" | "flag" | "closing";

export interface ClientCard {
  id: string;
  email: string | null;
  stage: string | null;
  followup_status: string | null;
}

export interface ClientSignals {
  akademia: Set<string>;
  paid: Set<string>;
  flagged: Set<string>;
}

export function hasNoAutoEmailFlag(meta: Record<string, unknown> | null | undefined): boolean {
  return meta?.[NO_AUTO_EMAIL_KEY] === true;
}

/** Защо този картон е клиент — или null. */
export function clientWhyFor(card: ClientCard, s: ClientSignals): ClientWhy | null {
  if (card.stage && CLIENT_STAGES.includes(card.stage)) return "won";
  if (s.paid.has(card.id)) return "paid";
  if (s.akademia.has(card.id)) return "akademia";
  if (s.flagged.has(card.id)) return "flag";
  if (card.followup_status && CLOSING_FOLLOWUPS.includes(card.followup_status)) return "closing";
  return null;
}

export function normEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

/**
 * Кои от `targets` са клиенти — по своя картон или по друг картон със същия
 * имейл (`twins`). Връща id → причина само за клиентите.
 */
export function clientMap(targets: ClientCard[], twins: ClientCard[], s: ClientSignals): Map<string, ClientWhy> {
  const byEmail = new Map<string, ClientWhy>();
  for (const card of [...targets, ...twins]) {
    const why = clientWhyFor(card, s);
    const e = normEmail(card.email);
    if (why && e && !byEmail.has(e)) byEmail.set(e, why);
  }
  const out = new Map<string, ClientWhy>();
  for (const t of targets) {
    const why = clientWhyFor(t, s) ?? byEmail.get(normEmail(t.email)) ?? null;
    if (why) out.set(t.id, why);
  }
  return out;
}
