import { createHmac, timingSafeEqual } from "node:crypto";
import { SITE } from "./sequence-layout";

/**
 * Линкът „спри писмата" в подписа на автоматичните имейли.
 *
 * Подписва се, за да не може всеки с чужд uuid да отписва хора наред. Ключът е
 * `INTERNAL_SEND_TOKEN` — същият, с който се пази `/api/email/send`.
 *
 * Защо изобщо го има: автоматичните писма вече не спират при разговор, тоест
 * един човек може да получи десет. Без изход насреща частта от тях, която се
 * подразни, натиска „спам" — а това гори домейна, от който тръгва ЦЯЛАТА поща
 * на CRM-а, включително офертите. Един клик е по-евтин от една жалба.
 */

function secret(): string | null {
  return process.env.INTERNAL_SEND_TOKEN || process.env.CRON_SECRET || null;
}

export function unsubscribeToken(contactId: string): string | null {
  const key = secret();
  if (!key) return null;
  return createHmac("sha256", key).update(contactId).digest("base64url").slice(0, 22);
}

export function verifyUnsubscribeToken(contactId: string, token: string): boolean {
  const expected = unsubscribeToken(contactId);
  if (!expected || !token || expected.length !== token.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

/** Пълният адрес за подписа. `undefined`, ако ключът липсва — по-добре без линк, отколкото със счупен. */
export function unsubscribeUrl(contactId: string): string | undefined {
  const t = unsubscribeToken(contactId);
  return t ? `${SITE}/api/email/unsubscribe?c=${contactId}&t=${t}` : undefined;
}
