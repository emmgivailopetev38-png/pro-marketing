import { NextResponse } from "next/server";
import {
  calBookingSchema,
  extractPhone,
  statusFromTrigger,
  durationMinutes,
} from "@/lib/cal/types";
import { verifyCalSignature } from "@/lib/cal/verify-webhook";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-cal-signature-256");
  const secret = process.env.CAL_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const valid = verifyCalSignature(rawBody, signature, secret);

  const supabase = createServiceClient();

  if (!valid) {
    await supabase.from("cal_webhook_log").insert({
      event_type: null,
      payload: safeParse(rawBody),
      signature_valid: false,
      error: "invalid_signature",
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const json = safeParse(rawBody);
  const parsed = calBookingSchema.safeParse(json);

  if (!parsed.success) {
    await supabase.from("cal_webhook_log").insert({
      event_type:
        typeof json === "object" && json && "triggerEvent" in json
          ? String((json as { triggerEvent: unknown }).triggerEvent)
          : null,
      payload: json,
      signature_valid: true,
      error: `schema:${parsed.error.message.slice(0, 240)}`,
    });
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { triggerEvent, payload } = parsed.data;

  const row = {
    cal_booking_id: payload.uid,
    attendee_name: payload.attendees[0]?.name ?? "Unknown",
    attendee_email: payload.attendees[0]?.email ?? "unknown@unknown",
    attendee_phone: extractPhone(payload),
    scheduled_at: new Date(payload.startTime).toISOString(),
    duration_minutes: durationMinutes(payload.startTime, payload.endTime),
    status: statusFromTrigger(triggerEvent),
    raw_payload: parsed.data,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("bookings")
    .upsert(row, { onConflict: "cal_booking_id" });

  if (error) {
    await supabase.from("cal_webhook_log").insert({
      event_type: triggerEvent,
      payload: parsed.data,
      signature_valid: true,
      error: `db:${error.message.slice(0, 240)}`,
    });
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  await supabase.from("cal_webhook_log").insert({
    event_type: triggerEvent,
    payload: parsed.data,
    signature_valid: true,
  });

  return NextResponse.json({ ok: true });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
