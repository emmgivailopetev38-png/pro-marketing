import "server-only";
import { createHash } from "node:crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const CAPI_TOKEN = process.env.META_CAPI_TOKEN;
const TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE;

const GRAPH_BASE = "https://graph.facebook.com/v23.0";

interface UserData {
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

interface ServerEvent {
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
 * Send a single Conversions API event. Hashes PII server-side per Meta's
 * requirements. Returns the API response or an { error } object.
 */
export async function sendCapiEvent(event: ServerEvent): Promise<{ ok: boolean; data?: unknown; error?: string }> {
  if (!isCapiConfigured()) {
    return { ok: false, error: "Meta CAPI not configured (missing pixel id or token)" };
  }
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

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: event.event_name,
        event_time: event.event_time ?? Math.floor(Date.now() / 1000),
        action_source: event.action_source ?? "website",
        event_id: event.event_id,
        event_source_url: event.event_source_url,
        user_data,
        custom_data: event.custom_data,
      },
    ],
  };
  if (TEST_CODE) payload.test_event_code = TEST_CODE;

  try {
    const res = await fetch(
      `${GRAPH_BASE}/${PIXEL_ID}/events?access_token=${CAPI_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: JSON.stringify(data).slice(0, 240) };
    }
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
