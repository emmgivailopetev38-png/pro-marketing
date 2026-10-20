import { createServiceClient } from "@/lib/supabase/service";
import { checkHermesAuth } from "./auth";
import { recordAutomationEvent } from "./repository";
import { isoToSofiaLocal } from "@/lib/team/time";

/**
 * Кой може да вика `/api/crm/email-reply`.
 *
 *   1. Хермес / вътрешният токен (`checkHermesAuth`) — за ръчни проби и за Claude.
 *   2. Google Apps Script-ът в Gmail-а на Ивайло — с OpenID токена на самия
 *      скрипт (`ScriptApp.getIdentityToken()`). Така в скрипта няма таен ключ
 *      за копиране и пазене: Google подписва кой е собственикът.
 *
 * Токенът се проверява от Google (tokeninfo): издател Google, имейлът е на
 * собственика и е потвърден, не е изтекъл. Отгоре `aud` (OAuth клиентът на
 * скрипта) се закача при първото пускане — токен, издаден за друго приложение
 * със същия Google акаунт, после не минава. Нов скрипт = изтрий реда с
 * `idempotency_key = 'gmail-script-aud'` в `automation_events` или сложи
 * `GMAIL_SCRIPT_AUD` във Vercel.
 */

const OWNER = (process.env.GMAIL_SCRIPT_OWNER || "emmgivailopetev38@gmail.com").toLowerCase();
const AUD_KEY = "gmail-script-aud";

export interface TokenInfo {
  iss?: string;
  aud?: string;
  email?: string;
  email_verified?: string | boolean;
  exp?: string | number;
}

/** Чистата проверка на отговора от tokeninfo — без мрежа, за теста. */
export function tokenInfoOk(info: TokenInfo, owner = OWNER, now = Date.now()): boolean {
  const issOk = info.iss === "accounts.google.com" || info.iss === "https://accounts.google.com";
  const emailOk = (info.email ?? "").toLowerCase() === owner;
  const verified = info.email_verified === true || info.email_verified === "true";
  const exp = Number(info.exp ?? 0) * 1000;
  return issOk && emailOk && verified && exp > now && !!info.aud;
}

async function audAllowed(aud: string): Promise<boolean> {
  const pinned = (process.env.GMAIL_SCRIPT_AUD ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (pinned.length) return pinned.includes(aud);

  const sb = createServiceClient();
  const { data } = await sb.from("automation_events").select("id, detail").eq("idempotency_key", AUD_KEY).maybeSingle();
  if (data) return (data.detail as { aud?: string } | null)?.aud === aud;
  await recordAutomationEvent({
    event_type: "gmail_script_linked",
    summary: "Gmail скриптът за отговорите е вързан към CRM-а",
    detail: { aud, owner: OWNER },
    idempotency_key: AUD_KEY,
  });
  return true;
}

function bearer(request: Request): string | null {
  const h = request.headers.get("authorization") ?? "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() || null : null;
}

/** true = пусни заявката. `viaScript` = дошла е от Gmail скрипта (за пулса). */
export async function authorizeEmailReply(request: Request): Promise<{ ok: boolean; viaScript: boolean }> {
  if (checkHermesAuth(request)) return { ok: true, viaScript: false };
  const token = bearer(request);
  if (!token || token.split(".").length !== 3) return { ok: false, viaScript: false };
  try {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, viaScript: false };
    const info = (await res.json()) as TokenInfo;
    if (!tokenInfoOk(info)) return { ok: false, viaScript: false };
    return { ok: await audAllowed(info.aud as string), viaScript: true };
  } catch {
    return { ok: false, viaScript: false };
  }
}

/**
 * Пулсът на скрипта — по един ред на ден в `automation_events`. Сутрешният
 * отчет вика „⚠️ мълчи“, ако няма пулс от 26 часа: иначе спрял скрипт (изтекло
 * разрешение, сменена парола) би изглеждал като ден без отговори.
 */
export async function scriptHeartbeat(summary: string): Promise<void> {
  const day = isoToSofiaLocal(new Date()).slice(0, 10);
  await recordAutomationEvent({
    event_type: "gmail_script_run",
    summary,
    idempotency_key: `gmail-script-run:${day}`,
  }).catch(() => {});
}
