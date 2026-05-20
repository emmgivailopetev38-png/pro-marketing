"use client";
import { getCalApi } from "@calcom/embed-react";

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

export async function openBookingPopup() {
  const cal = await initCalEmbed();
  cal("modal", { calLink: CAL_LINK });
}
