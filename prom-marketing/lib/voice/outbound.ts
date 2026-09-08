import "server-only";

/**
 * Изходящо обаждане от Коста към човек, който току-що е оставил телефона си
 * на /glas — бутонът „Коста да ти звънне".
 *
 * Защо съществува: от 03 до 08.09.2026 осем от осем лийда от рекламата
 * попълниха формата и нито един не стигна до разговор. Първата причина беше
 * заглавката `Permissions-Policy: microphone=()` за целия сайт (поправена
 * във vercel.json). Втората остава и след нея: вграденият браузър на
 * Facebook и Instagram не дава микрофон на страницата. Телефонът на човека
 * вече го имаме — по-сигурно е Коста да го набере, отколкото да чакаме
 * микрофонът да проработи.
 *
 * Иска `ELEVENLABS_API_KEY` с право ElevenAgents = Write. Старият ключ във
 * Vercel връща 401 (виж /api/voice/public/session). Без работещ ключ рутът
 * не е счупен: казва на човека, че Ивайло ще го потърси, и праща известие —
 * лийдът не се губи, само обаждането е ръчно.
 */

const API = "https://api.elevenlabs.io";

export const DEFAULT_PUBLIC_AGENT_ID = "agent_4401m0fym8eqfeebgfqx4jnwqreg";

/** Номерът, от който Коста набира. Американски е — промптът го обяснява. */
export function outboundNumber(): string {
  return process.env.ELEVENLABS_OUTBOUND_NUMBER?.trim() || "+14754269084";
}

/** Същият номер, както се казва на глас и се показва на екрана. */
export function outboundNumberSpoken(): string {
  const n = outboundNumber();
  return n === "+14754269084" ? "+1 475 426 9084" : n;
}

export function outboundApiKey(): string | null {
  const k = process.env.ELEVENLABS_API_KEY?.trim();
  return k ? k : null;
}

/**
 * `PUBLIC_VOICE_CALLBACK=false` спира набирането без деплой — бутонът остава,
 * но човекът получава „Ивайло ще ви потърси" вместо обаждане.
 */
export function isOutboundConfigured(): boolean {
  if ((process.env.PUBLIC_VOICE_CALLBACK ?? "true").toLowerCase() === "false") return false;
  return outboundApiKey() !== null;
}

export type OutboundVariables = Record<string, string>;

export function buildOutboundPayload(args: {
  agentId: string;
  phoneNumberId: string;
  toNumber: string;
  variables: OutboundVariables;
}): Record<string, unknown> {
  return {
    agent_id: args.agentId,
    agent_phone_number_id: args.phoneNumberId,
    to_number: args.toNumber,
    conversation_initiation_client_data: {
      dynamic_variables: args.variables,
    },
  };
}

function digits(s: string): string {
  return s.replace(/\D/g, "");
}

export function sameNumber(a: string, b: string): boolean {
  const x = digits(a);
  const y = digits(b);
  return x.length > 0 && x === y;
}

/**
 * Намира `phone_number_id` на нашия номер в списъка от ElevenLabs.
 * Приема и гол масив, и `{ phone_numbers: [...] }` — документацията показва
 * масив, но обвивката не бива да е причина обаждането да не тръгне.
 */
export function pickPhoneNumberId(list: unknown, number: string): string | null {
  const rows: unknown[] = Array.isArray(list)
    ? list
    : list && typeof list === "object" && Array.isArray((list as { phone_numbers?: unknown }).phone_numbers)
      ? ((list as { phone_numbers: unknown[] }).phone_numbers)
      : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const r = row as { phone_number?: unknown; phone_number_id?: unknown };
    if (typeof r.phone_number !== "string" || typeof r.phone_number_id !== "string") continue;
    if (sameNumber(r.phone_number, number)) return r.phone_number_id;
  }
  return null;
}

let cachedId: { number: string; id: string; at: number } | null = null;

export async function resolvePhoneNumberId(apiKey: string, number: string): Promise<string | null> {
  const override = process.env.ELEVENLABS_AGENT_PHONE_NUMBER_ID?.trim();
  if (override) return override;
  if (cachedId && cachedId.number === number && Date.now() - cachedId.at < 6 * 3600_000) return cachedId.id;

  const res = await fetch(`${API}/v1/convai/phone-numbers`, {
    headers: { "xi-api-key": apiKey },
    cache: "no-store",
  });
  if (!res.ok) {
    console.error("[voice/outbound] списъкът с номера върна", res.status);
    return null;
  }
  const id = pickPhoneNumberId(await res.json().catch(() => null), number);
  if (id) cachedId = { number, id, at: Date.now() };
  return id;
}

export type OutboundResult =
  | { ok: true; conversationId: string | null; callSid: string | null }
  | { ok: false; reason: "not_configured" | "no_number_id" | "api" | "network"; detail?: string };

/**
 * Набира човека. Динамичните променливи са същите като при бутона на сайта
 * (`ime`, `imeil`, `telefon`, `deynost`, `kanal`, `minuti`, `sesia`), за да
 * работи и промптът, и post-call webhook-ът без промяна: webhook-ът намира
 * човека по `imeil`, а `sesia` залепя минутите за реда в тефтера.
 */
export async function placeOutboundCall(args: {
  toNumber: string;
  variables: OutboundVariables;
  agentId?: string;
}): Promise<OutboundResult> {
  const apiKey = outboundApiKey();
  if (!apiKey || !isOutboundConfigured()) return { ok: false, reason: "not_configured" };
  const agentId = args.agentId ?? process.env.ELEVENLABS_PUBLIC_AGENT_ID ?? DEFAULT_PUBLIC_AGENT_ID;

  try {
    const phoneNumberId = await resolvePhoneNumberId(apiKey, outboundNumber());
    if (!phoneNumberId) return { ok: false, reason: "no_number_id" };

    const res = await fetch(`${API}/v1/convai/twilio/outbound-call`, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(
        buildOutboundPayload({ agentId, phoneNumberId, toNumber: args.toNumber, variables: args.variables })
      ),
    });
    const data = (await res.json().catch(() => ({}))) as {
      success?: boolean;
      message?: string;
      conversation_id?: string | null;
      callSid?: string | null;
    };
    if (!res.ok || data.success === false) {
      const msg = typeof data.message === "string" ? data.message : JSON.stringify(data).slice(0, 200);
      return { ok: false, reason: "api", detail: `${res.status} ${msg}` };
    }
    return { ok: true, conversationId: data.conversation_id ?? null, callSid: data.callSid ?? null };
  } catch (e) {
    return { ok: false, reason: "network", detail: e instanceof Error ? e.message : String(e) };
  }
}
