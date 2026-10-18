"use client";
import { getCalApi } from "@calcom/embed-react";
import { track, newEventId } from "@/lib/meta/pixel-client";
import { ga4Event, gadsConversion } from "@/lib/google/gtag-client";

const USERNAME = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "promarketing";
const SLUG = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "consultation";

export const CAL_LINK = `${USERNAME}/${SLUG}`;

export async function initCalEmbed() {
  const cal = await getCalApi({ namespace: "consultation" });
  cal("ui", {
    theme: "dark",
    cssVarsPerTheme: {
      light: {
        "cal-brand": "#06b6d4",
        "cal-bg-emphasis": "#0a0a1f",
        "cal-bg": "#030308",
        "cal-text": "#f5f7ff",
      },
      dark: {
        "cal-brand": "#06b6d4",
        "cal-bg-emphasis": "#0a0a1f",
        "cal-bg": "#030308",
        "cal-text": "#f5f7ff",
      },
    },
    hideEventTypeDetails: false,
  });
  return cal;
}

let bookingListenerRegistered = false;

export async function openBookingPopup() {
  // Fire Meta Lead + InitiateCheckout the moment intent is shown.
  track("Lead", {
    params: { content_name: "Cal.com booking popup", content_category: "consultation" },
  });
  track("InitiateCheckout", {
    params: { content_name: "Cal.com booking popup", content_category: "consultation" },
  });
  const cal = await initCalEmbed();
  // Попъпът е iframe: без този слушател записана среща от бутоните по сайта
  // не стига нито до Meta, нито до Google. Регистрира се веднъж на зареждане;
  // повторното броене (BookingConfetti лови същото събитие) се пази от
  // trackBookingSuccess. Същият API като в components/booking/BookingEmbed.tsx.
  if (!bookingListenerRegistered) {
    try {
      cal("on", {
        action: "bookingSuccessful",
        callback: (e: unknown) => {
          trackBookingSuccess((e as { detail?: unknown } | undefined)?.detail);
        },
      });
      bookingListenerRegistered = true;
    } catch {
      /* аналитиката никога не чупи бутона */
    }
  }
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
 * Една и съща записана среща може да стигне до няколко слушателя (Cal embed
 * callback + window message на BookingConfetti). Ключът е uid-ът; ако Cal не
 * го даде, пазим се с кратък прозорец, за да не се брои два пъти.
 */
const trackedBookings = new Set<string>();
const UNKEYED_WINDOW_MS = 10_000;
let lastUnkeyedAt = 0;

function alreadyTracked(uid: string | null): boolean {
  if (uid) {
    if (trackedBookings.has(uid)) return true;
    trackedBookings.add(uid);
    return false;
  }
  const now = Date.now();
  if (now - lastUnkeyedAt < UNKEYED_WINDOW_MS) return true;
  lastUnkeyedAt = now;
  return false;
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
  if (alreadyTracked(uid)) return;
  const params = { content_name: "Cal.com consultation", content_category: "consultation" };
  track("Schedule", { eventID: uid ? `cal_sched_${uid}` : newEventId(), params });
  track("Lead", { eventID: uid ? `cal_lead_${uid}` : newEventId(), params });
  track("CompleteRegistration", {
    eventID: uid ? `cal_${uid}` : newEventId(),
    params: { ...params, status: "confirmed" },
  });
  // Google: Ads conversion + GA4. transaction_id = същият uid → Google сам
  // изхвърля повторение. Добавено след Meta, редът на Meta не е пипан.
  gadsConversion("booking", uid ? { transactionId: `cal_${uid}` } : undefined);
  ga4Event("book_appointment", { ...params, ...(uid ? { transaction_id: `cal_${uid}` } : {}) });
}
