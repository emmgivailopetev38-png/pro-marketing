import "server-only";
import { sendCapiEvent, isCapiConfigured } from "@/lib/meta/conversions-api";
import { clientIp } from "./server";

/**
 * Meta Conversions API за залата. Всяко събитие носи СЪЩИЯ event_id като
 * пиксела в браузъра — Meta слива двойката в едно. Сървърното не зависи от
 * блокери и бисквитки (виж паметта: cookie банерът души пиксела), а носи
 * имейла и телефона (хеширани) → по-добро съвпадение.
 * Без META_CAPI_TOKEN / NEXT_PUBLIC_META_PIXEL_ID — тихо нищо.
 */

export type KinoCapiEvent = "ViewContent" | "CompleteRegistration" | "InitiateCheckout" | "Purchase" | "Schedule";

const EVENT_ID_RE = /^[A-Za-z0-9_.:-]{6,120}$/;

export function safeEventId(v: unknown): string | null {
  return typeof v === "string" && EVENT_ID_RE.test(v) ? v : null;
}

export async function kinoCapi(args: {
  event: KinoCapiEvent;
  eventId: string;
  request?: Request;
  url?: string | null;
  contact?: { id?: string | null; email?: string | null; phone?: string | null; name?: string | null } | null;
  fbp?: string | null;
  fbc?: string | null;
  custom?: Record<string, unknown>;
  actionSource?: "website" | "system_generated";
}): Promise<{ ok: boolean; error?: string }> {
  if (!isCapiConfigured()) return { ok: false, error: "capi not configured" };
  const [firstName, ...rest] = (args.contact?.name ?? "").trim().split(/\s+/);
  const r = await sendCapiEvent({
    event_name: args.event,
    event_id: args.eventId,
    event_source_url: args.url ?? undefined,
    action_source: args.actionSource ?? "website",
    user_data: {
      email: args.contact?.email ?? null,
      phone: args.contact?.phone ?? null,
      firstName: firstName || null,
      lastName: rest.join(" ") || null,
      country: "bg",
      external_id: args.contact?.id ?? null,
      client_ip: args.request ? clientIp(args.request) : null,
      client_user_agent: args.request?.headers.get("user-agent") ?? null,
      fbp: args.fbp ?? null,
      fbc: args.fbc ?? null,
    },
    custom_data: { content_name: "ВЪЛНАТА · онлайн кино", content_category: "kino", ...(args.custom ?? {}) },
  });
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
