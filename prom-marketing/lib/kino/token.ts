import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Личният линк на билета: `/kino/bilet?t=…`, `/kino/zala?t=…`, `/k/…`.
 *
 * Токенът е id-то на картона в CRM-а + подпис. Без база: проверката е само
 * HMAC, затова залата отваря за части от секундата и при 500 души наведнъж.
 * Формат: base64url(uuid, 16 байта) „.“ 8 знака подпис → 31 знака. Къс е
 * нарочно — влиза в SMS, без да го прави на три съобщения.
 *
 * ⚠ Ключът: KINO_TOKEN_SECRET (ако го няма — INTERNAL_SEND_TOKEN, после
 * CRON_SECRET). Сложи го ПРЕДИ първия билет и не го сменяй: смяната чупи
 * линковете във вече пратените писма и SMS-и.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SIG_LEN = 8;

export function uuidToB64(uuid: string): string | null {
  if (!UUID_RE.test(uuid)) return null;
  return Buffer.from(uuid.replace(/-/g, ""), "hex").toString("base64url");
}

export function b64ToUuid(s: string): string | null {
  if (!/^[A-Za-z0-9_-]{22}$/.test(s)) return null;
  const hex = Buffer.from(s, "base64url").toString("hex");
  if (hex.length !== 32) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function sig(id: string, secret: string): string {
  return createHmac("sha256", secret).update(`kino:${id.toLowerCase()}`).digest("base64url").slice(0, SIG_LEN);
}

export function signTicket(contactId: string, secret: string): string | null {
  const b = uuidToB64(contactId);
  if (!b || !secret) return null;
  return `${b}.${sig(contactId, secret)}`;
}

/** Връща id-то на картона или null, ако токенът е подправен / счупен. */
export function verifyTicket(token: string | null | undefined, secret: string | null): string | null {
  if (!token || !secret) return null;
  const [b, provided] = token.trim().split(".");
  if (!b || !provided || provided.length !== SIG_LEN) return null;
  const id = b64ToUuid(b);
  if (!id) return null;
  const expected = sig(id, secret);
  const x = Buffer.from(expected);
  const y = Buffer.from(provided);
  if (x.length !== y.length || !timingSafeEqual(x, y)) return null;
  return id;
}

export function kinoSecret(): string | null {
  const s =
    process.env.KINO_TOKEN_SECRET || process.env.INTERNAL_SEND_TOKEN || process.env.CRON_SECRET || null;
  if (s) return s;
  // Локално (без env) залата трябва да се отваря за преглед. В продукцията — никога.
  return process.env.NODE_ENV === "production" ? null : "kino-dev-secret-not-for-production";
}

export function ticketToken(contactId: string): string | null {
  const secret = kinoSecret();
  return secret ? signTicket(contactId, secret) : null;
}

export function contactFromTicket(token: string | null | undefined): string | null {
  return verifyTicket(token, kinoSecret());
}
