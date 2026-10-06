import "server-only";
import { isBgMobile } from "./people";

/**
 * SMS напомнянията (Twilio). ИЗКЛЮЧЕНИ, докато Ивайло не реши:
 *
 *   KINO_SMS_ENABLED=1            — изричното „давай“
 *   TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN
 *   TWILIO_SMS_FROM               — буквен подател (до 11 знака, напр. „ProMarketng“)
 *     или TWILIO_MESSAGING_SERVICE_SID
 *
 * ⚠ Непроверено: дали акаунтът в Twilio има права за съобщения към България
 * и дали буквеният подател е позволен без регистрация. Докато не е проверено
 * — флагът стои изключен и писмата вървят сами. Вариант без Twilio: български
 * доставчик (напр. SMSAPI.bg / Mobica) — същата функция, друг адрес.
 *
 * Пращаме само до БГ мобилни. Кирилицата е UCS-2: 70 знака на SMS, 67 на част
 * при дълги — затова текстовете са кратки, а линкът е /k/<билет> (31 знака).
 */

export function smsStatus(): { enabled: boolean; reason: string | null } {
  if (process.env.KINO_SMS_ENABLED !== "1") return { enabled: false, reason: "KINO_SMS_ENABLED не е 1" };
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return { enabled: false, reason: "няма TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN" };
  }
  if (!process.env.TWILIO_SMS_FROM && !process.env.TWILIO_MESSAGING_SERVICE_SID) {
    return { enabled: false, reason: "няма TWILIO_SMS_FROM или TWILIO_MESSAGING_SERVICE_SID" };
  }
  return { enabled: true, reason: null };
}

/** Колко SMS части ще излязат (UCS-2 при кирилица) — за да не пращаме роман. */
export function smsSegments(text: string): number {
  const gsm = /^[\x20-\x7E\n\r]*$/.test(text);
  const len = [...text].length;
  if (gsm) return len <= 160 ? 1 : Math.ceil(len / 153);
  return len <= 70 ? 1 : Math.ceil(len / 67);
}

export async function sendSms(to: string, body: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const st = smsStatus();
  if (!st.enabled) return { ok: false, error: st.reason ?? "sms disabled" };
  if (!isBgMobile(to)) return { ok: false, error: "не е български мобилен номер" };
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const form = new URLSearchParams({ To: to, Body: body });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) form.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  else form.set("From", process.env.TWILIO_SMS_FROM!);
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!res.ok) return { ok: false, error: (data.message ?? `HTTP ${res.status}`).slice(0, 200) };
    return { ok: true, id: data.sid };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
