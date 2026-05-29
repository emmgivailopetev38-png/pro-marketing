import { z } from "zod";

// Cal.com sends ~15 different trigger events. We only act on these three; the
// rest are accepted and logged but produce no row in `bookings`.
export const KNOWN_BOOKING_TRIGGERS = [
  "BOOKING_CREATED",
  "BOOKING_RESCHEDULED",
  "BOOKING_CANCELLED",
] as const;
export type KnownBookingTrigger = (typeof KNOWN_BOOKING_TRIGGERS)[number];

// Cal.com responses are now wrapped: { label, value?, isHidden } where value can be
// anything — string, array, nested object (for location), or missing (hidden fields).
// We accept ANYTHING and unwrap in extractors below.
const responseValueSchema = z.unknown();

export const calBookingSchema = z.object({
  // Accept any trigger string — Cal sends many. We dispatch by enum check later.
  triggerEvent: z.string(),
  payload: z.object({
    uid: z.string(),
    title: z.string().optional(),
    startTime: z.string(),
    endTime: z.string(),
    attendees: z.array(
      z.object({
        name: z.string(),
        email: z.email(),
        timeZone: z.string().optional(),
      })
    ),
    responses: z.record(z.string(), responseValueSchema).optional(),
    userFieldsResponses: z.record(z.string(), responseValueSchema).optional(),
    status: z.string().optional(),
  }),
  createdAt: z.string().optional(),
});

export type CalBookingPayload = z.infer<typeof calBookingSchema>;

export function isKnownTrigger(t: string): t is KnownBookingTrigger {
  return (KNOWN_BOOKING_TRIGGERS as readonly string[]).includes(t);
}

// Cal serializes custom question answers under `responses.<identifier>` and
// duplicates them under `userFieldsResponses.<identifier>`. Values come wrapped as
// { label, value?, isHidden } where value can be string, string[], nested object,
// or missing entirely (hidden fields). We probe both maps and unwrap safely.
function pickResponse(p: CalBookingPayload["payload"], key: string): unknown {
  const r = p.responses?.[key];
  if (r !== undefined) return r;
  return p.userFieldsResponses?.[key];
}

function unwrapResponse(raw: unknown): unknown {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    if ("value" in raw) {
      const inner = (raw as { value: unknown }).value;
      // Handle nested wrapping (e.g. location: { value: { value: "..." } })
      if (inner && typeof inner === "object" && !Array.isArray(inner) && "value" in inner) {
        return (inner as { value: unknown }).value;
      }
      return inner;
    }
    // Hidden fields with no value at all
    return null;
  }
  return raw;
}

export function extractString(
  p: CalBookingPayload["payload"],
  key: string
): string | null {
  const v = unwrapResponse(pickResponse(p, key));
  if (typeof v === "string" && v.trim().length > 0) return v.trim();
  if (typeof v === "number") return String(v);
  return null;
}

export function extractStringArray(
  p: CalBookingPayload["payload"],
  key: string
): string[] | null {
  const v = unwrapResponse(pickResponse(p, key));
  if (Array.isArray(v) && v.every((x) => typeof x === "string")) return v.length > 0 ? v : null;
  if (typeof v === "string" && v.trim().length > 0) return [v.trim()];
  return null;
}

export function extractPhone(p: CalBookingPayload["payload"]): string | null {
  // Cal.com sends phone under attendeePhoneNumber identifier
  return extractString(p, "phone") ?? extractString(p, "attendeePhoneNumber");
}

export function statusFromTrigger(t: string): string {
  if (t === "BOOKING_CANCELLED") return "cancelled";
  if (t === "BOOKING_RESCHEDULED") return "rescheduled";
  return "confirmed";
}

export function durationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}
