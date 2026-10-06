import "server-only";
import { createHash } from "node:crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

const GRAPH_BASE = "https://graph.facebook.com/v23.0";

export interface UserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  country?: string | null;
  external_id?: string | null;
  client_ip?: string | null;
  client_user_agent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  /** Meta Lead Ads leadgen id — НЕ се хешира; свързва събитието с точния лийд/реклама. */
  lead_id?: string | number | null;
}

export interface ServerEvent {
  event_name: string;
  event_time?: number;
  event_id?: string;
  event_source_url?: string;
  action_source?:
    | "website"
    | "email"
    | "app"
    | "phone_call"
    | "chat"
    | "physical_store"
    | "system_generated"
    | "other";
  user_data?: UserData;
  custom_data?: Record<string, unknown>;
}

export interface CapiResult {
  ok: boolean;
  /** HTTP статусът от Meta, когато е имало отговор. */
  status?: number;
  data?: unknown;
  error?: string;
  /**
   * Заявката не е получила отговор (мрежа, таймаут). Тогава не знаем дали Meta
   * е приела събитието — затова такова събитие не се праща повторно само.
   */
  network?: boolean;
}

export interface PostOptions {
  /** Тестов код от Events Manager → събитията отиват в „Test events“. */
  testEventCode?: string | null;
  /**
   * `lead_id` като JSON число. Спецификацията на Meta за CRM събития иска
   * integer (15–17 цифри); JS Number губи точност над 16 цифри, затова
   * числото се пише в JSON текста директно, без да минава през Number.
   */
  numericLeadId?: boolean;
}

function sha256(input: string | null | undefined): string | undefined {
  if (!input) return undefined;
  const norm = input.trim().toLowerCase();
  if (!norm) return undefined;
  return createHash("sha256").update(norm).digest("hex");
}

function normalizePhone(p: string | null | undefined): string | undefined {
  if (!p) return undefined;
  return p.replace(/[^\d]/g, "");
}

export function isCapiConfigured(): boolean {
  return Boolean(PIXEL_ID && CAPI_TOKEN);
}

/**
 * Едно събитие във вида, който Meta иска: личните данни са хеширани (sha256),
 * празните полета ги няма. Без мрежа — отделено, за да може готовото събитие
 * да се запише и да се прати пак същото.
 */
export function buildCapiEvent(event: ServerEvent): Record<string, unknown> {
  const u = event.user_data ?? {};
  const user_data: Record<string, unknown> = {
    em: u.email ? [sha256(u.email)] : undefined,
    ph: u.phone ? [sha256(normalizePhone(u.phone) ?? "")] : undefined,
    fn: u.firstName ? [sha256(u.firstName)] : undefined,
    ln: u.lastName ? [sha256(u.lastName)] : undefined,
    ct: u.city ? [sha256(u.city)] : undefined,
    country: u.country ? [sha256(u.country)] : undefined,
    external_id: u.external_id ? [sha256(u.external_id)] : undefined,
    client_ip_address: u.client_ip ?? undefined,
    client_user_agent: u.client_user_agent ?? undefined,
    fbp: u.fbp ?? undefined,
    fbc: u.fbc ?? undefined,
    lead_id: u.lead_id ?? undefined,
  };
  // Strip undefined keys
  for (const k of Object.keys(user_data)) {
    if (user_data[k] === undefined) delete user_data[k];
  }

  return {
    event_name: event.event_name,
    event_time: event.event_time ?? Math.floor(Date.now() / 1000),
    action_source: event.action_source ?? "website",
    event_id: event.event_id,
    event_source_url: event.event_source_url,
    user_data,
    custom_data: event.custom_data,
  };
}

/** `"lead_id":"123…"` → `"lead_id":123…` в готовия JSON текст. */
export function leadIdAsJsonNumber(json: string): string {
  return json.replace(/"lead_id":"(\d{1,20})"/g, '"lead_id":$1');
}

/** Праща вече сглобени събития (от `buildCapiEvent`) към Conversions API. */
export async function postCapiEvents(
  events: Record<string, unknown>[],
  opts: PostOptions = {}
): Promise<CapiResult> {
  if (!isCapiConfigured()) {
    return { ok: false, error: "Meta CAPI not configured (missing pixel id or token)" };
  }
  const payload: Record<string, unknown> = { data: events };
  const testCode = opts.testEventCode ?? TEST_CODE;
  if (testCode) payload.test_event_code = testCode;

  let body = JSON.stringify(payload);
  if (opts.numericLeadId) body = leadIdAsJsonNumber(body);

  let res: Response;
  try {
    res = await fetch(`${GRAPH_BASE}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  } catch (e) {
    return { ok: false, network: true, error: e instanceof Error ? e.message : String(e) };
  }
  const text = await res.text().catch(() => "");
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 200) };
  }
  if (!res.ok) {
    return { ok: false, status: res.status, error: JSON.stringify(data).slice(0, 240) };
  }
  return { ok: true, status: res.status, data };
}

/**
 * Send a single Conversions API event. Hashes PII server-side per Meta's
 * requirements. Returns the API response or an { error } object.
 */
export async function sendCapiEvent(event: ServerEvent): Promise<CapiResult> {
  if (!isCapiConfigured()) {
    return { ok: false, error: "Meta CAPI not configured (missing pixel id or token)" };
  }
  return postCapiEvents([buildCapiEvent(event)]);
}
