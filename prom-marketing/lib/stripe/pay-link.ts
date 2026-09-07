import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { isVoicePayProductId, type VoicePayProductId } from "@/lib/stripe/products";

/* =====================================================================
   Подписан линк за плащане — това, което гласовият агент праща на имейла.

   Защо не директен Stripe Checkout адрес: сесията на Stripe живее най-много
   24 часа, а човек, който е казал „пращай линка" в осем вечерта, плаща
   понякога в четвъртък. Линкът тук е наш и живее две седмици; Stripe
   сесията се създава чак при отварянето му (app/plati/[token]/route.ts) —
   всеки клик получава прясна.

   Целият достъп седи в самия линк, както при споделените раздели
   (lib/share/link.ts): подписан е с тайната на сървъра, носи кой е човекът,
   какво купува и докога важи. В базата стои само офертата, по `id`-то оттук.

   Агентът НЕ определя сума. Сумата идва от lib/stripe/products.ts по
   идентификатора на продукта — така промптът може да бъде убеден в каквото
   и да е, но картата се таксува само с цена от ценоразписa.
   ===================================================================== */

export const PAY_LINK_DAYS = 14;

export type PayLinkPayload = {
  /** версия на формата */
  v: 1;
  /** идентификаторът на линка — същият е и `dedupe_key` на офертата (`paylink:<id>`) */
  id: string;
  /** какво се купува */
  p: VoicePayProductId;
  /** имейлът, на който е пратен — отива и в Stripe като customer_email */
  e: string;
  /** името на човека, за поздрава на страницата */
  n?: string;
  /** картонът в CRM-а, ако е известен */
  c?: string | null;
  /** кога е издаден (ms) */
  t: number;
  /** валиден до (ms) */
  x: number;
};

function getSecret(): string {
  const s = process.env.PAY_LINK_SECRET || process.env.SHARE_LINK_SECRET || process.env.ADMIN_SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("PAY_LINK_SECRET / SHARE_LINK_SECRET / ADMIN_SESSION_SECRET missing or too short");
  }
  return s;
}

/** Отделен salt от този на споделените раздели — подписите не си служат взаимно. */
function mac(body: string): string {
  return createHmac("sha256", getSecret()).update(`pay:${body}`).digest("hex").slice(0, 32);
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  try {
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

export function newPayLinkId(): string {
  return randomBytes(9).toString("base64url");
}

export function createPayToken(args: {
  id: string;
  product: VoicePayProductId;
  email: string;
  name?: string | null;
  contactId?: string | null;
  nowMs?: number;
}): string {
  const now = args.nowMs ?? Date.now();
  const payload: PayLinkPayload = {
    v: 1,
    id: args.id,
    p: args.product,
    e: args.email.trim().toLowerCase(),
    ...(args.name ? { n: args.name.trim().slice(0, 80) } : {}),
    ...(args.contactId ? { c: args.contactId } : {}),
    t: now,
    x: now + PAY_LINK_DAYS * 24 * 3600_000,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${mac(body)}`;
}

export type VerifyResult =
  | { ok: true; payload: PayLinkPayload }
  | { ok: false; reason: "missing" | "format" | "signature" | "payload" | "expired" | "product" };

export function verifyPayToken(token: string | null | undefined, nowMs: number = Date.now()): VerifyResult {
  if (!token) return { ok: false, reason: "missing" };
  const [body, sig] = token.split(".");
  if (!body || !sig) return { ok: false, reason: "format" };

  let expected: string;
  try {
    expected = mac(body);
  } catch {
    return { ok: false, reason: "signature" };
  }
  if (!safeEqual(sig, expected)) return { ok: false, reason: "signature" };

  let payload: PayLinkPayload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as PayLinkPayload;
  } catch {
    return { ok: false, reason: "payload" };
  }
  if (!payload || typeof payload !== "object" || payload.v !== 1) return { ok: false, reason: "payload" };
  if (typeof payload.id !== "string" || typeof payload.e !== "string" || typeof payload.x !== "number") {
    return { ok: false, reason: "payload" };
  }
  if (typeof payload.p !== "string" || !isVoicePayProductId(payload.p)) return { ok: false, reason: "product" };
  if (nowMs > payload.x) return { ok: false, reason: "expired" };
  return { ok: true, payload };
}

export function siteOrigin(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://promarketing.pw").replace(/\/$/, "");
}

export function payLinkUrl(token: string): string {
  return `${siteOrigin()}/plati/${token}`;
}

/** `dedupe_key` на офертата, която стои зад линка. */
export function payLinkDedupeKey(id: string): string {
  return `paylink:${id}`;
}

/** Сумата, изговорена с думи — агентът чете това, не цифри. */
export function speakEur(amount: number): string {
  const ones = ["", "едно", "две", "три", "четири", "пет", "шест", "седем", "осем", "девет"];
  const teens = [
    "десет",
    "единайсет",
    "дванайсет",
    "тринайсет",
    "четиринайсет",
    "петнайсет",
    "шестнайсет",
    "седемнайсет",
    "осемнайсет",
    "деветнайсет",
  ];
  const tens = ["", "", "двайсет", "трийсет", "четиридесет", "петдесет", "шейсет", "седемдесет", "осемдесет", "деветдесет"];
  const hundreds = [
    "",
    "сто",
    "двеста",
    "триста",
    "четиристотин",
    "петстотин",
    "шестстотин",
    "седемстотин",
    "осемстотин",
    "деветстотин",
  ];

  function below1000(n: number): string {
    const parts: string[] = [];
    const h = Math.floor(n / 100);
    const rest = n % 100;
    if (h) parts.push(hundreds[h]);
    if (rest >= 10 && rest < 20) parts.push(teens[rest - 10]);
    else {
      const t = Math.floor(rest / 10);
      const o = rest % 10;
      if (t) parts.push(tens[t]);
      if (o) parts.push(ones[o]);
    }
    // „и" пред последната дума: „две хиляди четиристотин", „хиляда и двеста", „сто и пет"
    if (parts.length >= 2) return `${parts.slice(0, -1).join(" ")} и ${parts[parts.length - 1]}`;
    return parts.join(" ");
  }

  const n = Math.round(amount);
  if (n <= 0) return "нула евро";
  const th = Math.floor(n / 1000);
  const rest = n % 1000;
  const words: string[] = [];
  if (th === 1) words.push("хиляда");
  else if (th > 1) words.push(`${th === 2 ? "две" : below1000(th)} хиляди`);
  if (rest) {
    const r = below1000(rest);
    // „хиляда и двеста", но „две хиляди четиристотин" — „и" само когато остатъкът е една дума
    words.push(th && !r.includes(" ") ? `и ${r}` : r);
  }
  return `${words.join(" ")} евро`;
}
