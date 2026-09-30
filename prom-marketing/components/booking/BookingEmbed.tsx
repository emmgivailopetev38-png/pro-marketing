"use client";
import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { CAL_UI, trackBookingSuccess } from "@/lib/cal/embed";

const USERNAME = process.env.NEXT_PUBLIC_CAL_USERNAME ?? "promarketing";
const SLUG = process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "consultation";

export function BookingEmbed() {
  useEffect(() => {
    (async () => {
      const cal = await getCalApi({ namespace: "booking-inline" });
      cal("ui", CAL_UI);
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
      config={{ layout: "month_view", theme: "dark" }}
    />
  );
}
