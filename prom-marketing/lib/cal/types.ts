import { z } from "zod";

export const calBookingSchema = z.object({
  triggerEvent: z.enum([
    "BOOKING_CREATED",
    "BOOKING_RESCHEDULED",
    "BOOKING_CANCELLED",
  ]),
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
    responses: z
      .object({
        phone: z.union([z.string(), z.object({ value: z.string() })]).optional(),
      })
      .passthrough()
      .optional(),
    status: z.string().optional(),
  }),
  createdAt: z.string().optional(),
});

export type CalBookingPayload = z.infer<typeof calBookingSchema>;

export function extractPhone(p: CalBookingPayload["payload"]): string | null {
  const raw = p.responses?.phone;
  if (typeof raw === "string") return raw;
  if (raw && typeof raw === "object" && "value" in raw) return raw.value;
  return null;
}

export function statusFromTrigger(t: CalBookingPayload["triggerEvent"]): string {
  switch (t) {
    case "BOOKING_CANCELLED":
      return "cancelled";
    case "BOOKING_RESCHEDULED":
      return "rescheduled";
    default:
      return "confirmed";
  }
}

export function durationMinutes(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}
