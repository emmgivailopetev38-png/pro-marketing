import { createHmac, timingSafeEqual } from "node:crypto";

/* =====================================================================
   Подписан линк за споделяне на ЕДИН раздел с външен човек.

   Смисълът: ментор, партньор или клиент да отвори точно една страница —
   без акаунт, без парола за админа и без каквато и да е врата към CRM-а.
   Целият достъп седи в самия линк: подписан е с тайната на сървъра, тъй
   че не може да бъде изфабрикуван, и носи в себе си за кого е, докога е
   валиден и какво отваря. Нищо не се пази в базата — линк, който вече не
   искаш, се обезсилва като смениш SHARE_LINK_SECRET.

   По желание отгоре има и код за достъп: в линка влиза само отпечатъкът
   му, самият код никога не пътува по URL-а.
   ===================================================================== */

export type SharePayload = {
  /** за кого е линкът — показва се в шапката на страницата */
  n: string;
  /** кой раздел отваря */
  s: "skript";
  /** какво допълнително се вижда (напр. "napredak") */
  x?: string[];
  /** валиден до (ms). 0 = безсрочен */
  e: number;
  /** отпечатък на кода за достъп, ако е сложен такъв */
  p?: string;
};

export const SHARE_COOKIE = "pm_share";
export const SHARE_MAX_AGE = 30 * 24 * 60 * 60; // 30 дни

function getSecret(): string {
  const s = process.env.SHARE_LINK_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SHARE_LINK_SECRET / ADMIN_SESSION_SECRET missing or too short");
  }
  return s;
}

/** Отделен salt за всяка употреба, за да не си служат подписите взаимно. */
function mac(input: string, salt: "share" | "code" | "unlock"): string {
  return createHmac("sha256", getSecret()).update(`${salt}:${input}`).digest("hex").slice(0, 32);
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function createShareToken(payload: SharePayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body, "share")}`;
}

export function verifyShareToken(token: string | null | undefined): SharePayload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  let expected: string;
  try {
    expected = mac(body, "share");
  } catch {
    return null;
  }
  if (!safeEqual(sig, expected)) return null;

  let payload: SharePayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SharePayload;
  } catch {
    return null;
  }
  if (!payload || typeof payload !== "object") return null;
  if (typeof payload.n !== "string" || typeof payload.e !== "number") return null;
  if (payload.e > 0 && Date.now() > payload.e) return null;

  return payload;
}

/** Кодът за достъп не влиза в линка — влиза само този отпечатък. */
export function codeFingerprint(code: string): string {
  return mac(code.trim().toLowerCase(), "code");
}

/** Стойността на бисквитката, която помни, че този линк вече е отключен. */
export function unlockCookieValue(token: string): string {
  return mac(token, "unlock");
}
