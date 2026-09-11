"use client";
import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { trackBookingSuccess } from "@/lib/cal/embed";

const USERNAME = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "promarketing";
const SLUG = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "consultation";

/**
 * Данните, с които календарът тръгва попълнен.
 *
 * Личната страница (/z/<код>) знае кой е човекът — да го кара да си пише пак
 * името и имейла е точно фрикшънът, който яде срещи. Cal.com приема стойностите
 * в `config` и полетата излизат готови.
 */
export interface BookingPrefill {
  name?: string | null;
  email?: string | null;
  /** Cal.com иска телефона в международен формат — иначе събитието не се създава. */
  phone?: string | null;
}

export function BookingEmbed({ prefill }: { prefill?: BookingPrefill } = {}) {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "booking-inline" });
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
      // Без това записаната среща не стига до Meta: вграденият календар е
      // iframe и пикселът не вижда нищо вътре в него. Реклами, които водят
      // насам, иначе оптимизират на сляпо.
      cal("on", {
        action: "bookingSuccessful",
        callback: (e: unknown) => {
          trackBookingSuccess((e as { detail?: unknown } | undefined)?.detail);
        },
      });
    })();
  }, []);

  return (
    // Cal сам преоразмерява iframe-а до съдържанието си (auto-resize), а
    // СТРАНИЦАТА скролва — никакъв вложен скрол-капан на телефон. На мобилно
    // Cal минава в подреден (stacked) изглед автоматично; minHeight пази от
    // колапс докато зарежда.
    <Cal
      namespace="booking-inline"
      calLink={`${USERNAME}/${SLUG}`}
      style={{ width: "100%", height: "auto", minHeight: "560px", overflow: "visible" }}
      config={{
        layout: "month_view",
        theme: "dark",
        ...(prefill?.name ? { name: prefill.name } : {}),
        ...(prefill?.email ? { email: prefill.email } : {}),
        ...(prefill?.phone ? { attendeePhoneNumber: prefill.phone } : {}),
      }}
    />
  );
}
