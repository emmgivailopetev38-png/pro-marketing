import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "pm_admin";
const MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days

function getSecret(): string {
  const s = process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET missing or too short");
  }
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

function sigMatches(payload: string, providedSig: string): boolean {
  let expected: string;
  try {
    expected = sign(payload);
  } catch {
    return false;
  }
  const a = Buffer.from(providedSig, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Кой държи бисквитката.
 *
 * Собственикът (общата парола на /admin) има токен `<issuedAtMs>.<hmac>` —
 * същият формат както досега, значи вече издадените сесии продължават да
 * важат. Човек от екипа има `<issuedAtMs>.m.<member uuid>.<hmac>`; подписът
 * покрива и id-то, така че не може да се смени за чужд.
 */
export type SessionInfo =
  | { kind: "owner"; issuedAt: number }
  | { kind: "member"; memberId: string; issuedAt: number };

/**
 * Build a signed session token: `<issuedAtMs>.<hmac>`.
 * Caller decides where to store it (cookie, header) — we just sign and verify.
 */
export function issueSession(): string {
  const issuedAt = Date.now().toString();
  const sig = sign(issuedAt);
  return `${issuedAt}.${sig}`;
}

/** Токен за човек от екипа (виж SessionInfo). */
export function issueMemberSession(memberId: string): string {
  if (!UUID_RE.test(memberId)) throw new Error("invalid member id");
  const payload = `${Date.now()}.m.${memberId}`;
  return `${payload}.${sign(payload)}`;
}

export function readSession(token: string | null | undefined): SessionInfo | null {
  if (!token) return null;
  const parts = token.split(".");
  let payload: string;
  let providedSig: string;
  let memberId: string | null = null;
  if (parts.length === 2) {
    [payload, providedSig] = parts;
  } else if (parts.length === 4 && parts[1] === "m" && UUID_RE.test(parts[2])) {
    payload = parts.slice(0, 3).join(".");
    providedSig = parts[3];
    memberId = parts[2].toLowerCase();
  } else {
    return null;
  }
  if (!payload || !providedSig) return null;
  const issuedAt = Number(parts[0]);
  if (!Number.isFinite(issuedAt)) return null;
  const ageSec = (Date.now() - issuedAt) / 1000;
  if (ageSec < 0 || ageSec > MAX_AGE_SEC) return null;
  if (!sigMatches(payload, providedSig)) return null;
  return memberId ? { kind: "member", memberId, issuedAt } : { kind: "owner", issuedAt };
}

/** Само собственикът. Сесия на човек от екипа тук е `false` — /admin не е за него. */
export function verifySession(token: string | null | undefined): boolean {
  return readSession(token)?.kind === "owner";
}

export const ADMIN_COOKIE = COOKIE_NAME;
export const ADMIN_MAX_AGE = MAX_AGE_SEC;
