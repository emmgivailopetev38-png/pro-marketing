"use client";
import { getCalApi } from "@calcom/embed-react";
import { track, newEventId } from "@/lib/meta/pixel-client";

const USERNAME = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "promarketing";
const SLUG = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "consultation";

export const CAL_LINK = `${USERNAME}/${SLUG}`;

/** Същият флаг като exit-intent попъпа (ConversionFloats): отворил ли е
 * календара, той вече е показал намерение — втори попъп отгоре не му трябва. */
const EXIT_FLAG = "pm_v2_exit_intent_shown";

/**
 * Цветовете на сайта вътре в календара. Досега бяха зададени само 4 от
 * променливите на Cal.com, а останалите (фон на блоковете, рамки, бледия
 * текст) идваха от сивата тема на Cal.com — календарът стоеше като сива
 * кутия върху тъмносиния сайт.
 */
const CAL_COLORS: Record<string, string> = {
  "cal-bg": "#060612",
  "cal-bg-muted": "#0a0a1f",
  "cal-bg-subtle": "#10102a",
  "cal-bg-emphasis": "#141436",
  "cal-border": "#1f2a44",
  "cal-border-subtle": "#161d33",
  "cal-border-booker": "#161d33",
  "cal-text": "#e6eaf5",
  "cal-text-emphasis": "#f5f7ff",
  "cal-text-subtle": "#a5b0c8",
  "cal-text-muted": "#6b7590",
  "cal-brand": "#06b6d4",
  "cal-brand-emphasis": "#22d3ee",
  "cal-brand-text": "#030308",
};

export const CAL_UI = {
  theme: "dark" as const,
  cssVarsPerTheme: { light: CAL_COLORS, dark: CAL_COLORS },
  hideEventTypeDetails: false,
};

export async function initCalEmbed() {
  const cal = await getCalApi({ namespace: "consultation" });
  cal("ui", CAL_UI);
  return cal;
}

/**
 * Зарежда календара скрит, докато човекът чете страницата. Без това първото
 * „Запази среща“ показваше ~10 секунди празен черен екран, докато Cal.com
 * се зареди.
 */
export async function preloadBookingPopup() {
  const cal = await initCalEmbed();
  cal("preload", { calLink: CAL_LINK, type: "modal" });
}

export async function openBookingPopup() {
  try {
    sessionStorage.setItem(EXIT_FLAG, "1");
  } catch {
    /* private mode */
  }
  // Fire Meta Lead + InitiateCheckout the moment intent is shown.
  track("Lead", {
    params: { content_name: "Cal.com booking popup", content_category: "consultation" },
  });
  track("InitiateCheckout", {
    params: { content_name: "Cal.com booking popup", content_category: "consultation" },
  });
  const cal = await initCalEmbed();
  cal("modal", { calLink: CAL_LINK });
}

/**
 * Cal.com changes the shape of the bookingSuccessful payload between embed
 * versions, so dig for the booking uid instead of trusting one path.
 */
function bookingUid(detail: unknown): string | null {
  const d = detail as
    | { data?: { booking?: { uid?: unknown }; uid?: unknown }; booking?: { uid?: unknown } }
    | null
    | undefined;
  const candidates = [d?.data?.booking?.uid, d?.data?.uid, d?.booking?.uid];
  for (const c of candidates) {
    if (typeof c === "string" && c) return c;
  }
  return null;
}

/**
 * Meta events for a CONFIRMED booking. The event ids mirror the ones the
 * Cal.com webhook sends server-side (app/api/webhooks/cal), so the Pixel and
 * the Conversions API collapse each pair into a single conversion.
 *
 *  Schedule             — the clean "meeting booked" number.
 *  Lead                 — what the ad sets optimise on; it has the volume history.
 *  CompleteRegistration — kept for continuity with the events already recorded.
 */
export function trackBookingSuccess(detail?: unknown): void {
  const uid = bookingUid(detail);
  const params = { content_name: "Cal.com consultation", content_category: "consultation" };
  track("Schedule", { eventID: uid ? `cal_sched_${uid}` : newEventId(), params });
  track("Lead", { eventID: uid ? `cal_lead_${uid}` : newEventId(), params });
  track("CompleteRegistration", {
    eventID: uid ? `cal_${uid}` : newEventId(),
    params: { ...params, status: "confirmed" },
  });
}
