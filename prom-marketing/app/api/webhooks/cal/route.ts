import { NextResponse } from "next/server";
import {
  calBookingSchema,
  extractPhone,
  extractString,
  extractStringArray,
  statusFromTrigger,
  durationMinutes,
  isKnownTrigger,
} from "@/lib/cal/types";
import { verifyCalSignature } from "@/lib/cal/verify-webhook";
import { createServiceClient } from "@/lib/supabase/service";
import { sendCapiEvent, isCapiConfigured } from "@/lib/meta/conversions-api";
import { upsertContactAndLog } from "@/lib/contacts/repository";

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

  // Trigger events Cal.com sends that we don't act on (e.g. MEETING_ENDED,
  // BOOKING_REQUESTED, BOOKING_PAID...). Log and 200 so Cal doesn't retry.
  if (!isKnownTrigger(triggerEvent)) {
    await supabase.from("cal_webhook_log").insert({
      event_type: triggerEvent,
      payload: parsed.data,
      signature_valid: true,
    });
    return NextResponse.json({ ok: true, skipped: true });
  }

  const row = {
    cal_booking_id: payload.uid,
    attendee_name: payload.attendees[0]?.name ?? "Unknown",
    attendee_email: payload.attendees[0]?.email ?? "unknown@unknown",
    attendee_phone: extractPhone(payload),
    scheduled_at: new Date(payload.startTime).toISOString(),
    duration_minutes: durationMinutes(payload.startTime, payload.endTime),
    status: statusFromTrigger(triggerEvent),
    // Custom booking questions → typed columns for stats
    business: extractString(payload, "business"),
    automation_goal: extractString(payload, "automation_goal"),
    services_interested: extractStringArray(payload, "services_interested"),
    timeline: extractString(payload, "timeline"),
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

  // Mirror into contacts dashboard — upsert by email, log a booking activity.
  await upsertContactAndLog({
    full_name: row.attendee_name,
    email: row.attendee_email,
    phone: row.attendee_phone,
    source: "cal_booking",
    source_ref: row.cal_booking_id,
    initial_stage: "discovery",
    bump_stage_to: "discovery",
    activity: {
      type: "booking",
      title: `Cal.com среща — ${new Date(row.scheduled_at).toLocaleString("bg-BG", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`,
      occurred_at: row.scheduled_at,
      body: [row.business && `Бизнес: ${row.business}`, row.automation_goal && `Цел: ${row.automation_goal}`]
        .filter(Boolean)
        .join("\n") || null,
      metadata: {
        cal_booking_id: row.cal_booking_id,
        status: row.status,
        duration_minutes: row.duration_minutes,
        scheduled_at: row.scheduled_at,
        trigger: triggerEvent,
      },
      dedupe_key: `cal:${row.cal_booking_id}:${triggerEvent}`,
    },
  }).catch(() => null);

  // Mirror the conversion to Meta's Conversions API for accurate ad attribution.
  // Only fire on the first creation, not on reschedules/cancellations.
  if (triggerEvent === "BOOKING_CREATED" && isCapiConfigured()) {
    const [firstName, ...rest] = (row.attendee_name ?? "").split(/\s+/);
    void sendCapiEvent({
      event_name: "CompleteRegistration",
      event_id: `cal_${row.cal_booking_id}`,
      event_source_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/`,
      action_source: "website",
      user_data: {
        email: row.attendee_email,
        phone: row.attendee_phone,
        firstName,
        lastName: rest.join(" ") || null,
        external_id: row.cal_booking_id,
      },
      custom_data: {
        content_name: "Cal.com consultation",
        content_category: "lead",
        status: row.status,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

function safeParse(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
