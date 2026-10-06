"use client";
import { useEffect } from "react";
import Cal, { getCalApi } from "@calcom/embed-react";
import { KINO } from "@/lib/kino/config";

/**
 * Календарът под филма („Искам първо да поговорим“ и след капарото).
 * Вграден Cal.com с попълнени име, имейл и бележка от анкетата, и с
 * metadata[funnel]=kino — по нея срещата се познава като дошла от залата.
 * ⚠ Събитието е KINO.cal.link (20 мин, пон–чт) — до създаването му води
 * към общата консултация.
 */

function bookingUid(detail: unknown): string | null {
  const d = detail as { data?: { booking?: { uid?: unknown }; uid?: unknown }; booking?: { uid?: unknown } } | null | undefined;
  for (const c of [d?.data?.booking?.uid, d?.data?.uid, d?.booking?.uid]) {
    if (typeof c === "string" && c) return c;
  }
  return null;
}

export function KinoCal({
  name,
  email,
  notes,
  onBooked,
  namespace = "kino",
}: {
  name?: string | null;
  email?: string | null;
  notes?: string;
  onBooked?: (uid: string | null) => void;
  namespace?: string;
}) {
  useEffect(() => {
    let alive = true;
    (async () => {
      const cal = await getCalApi({ namespace });
      if (!alive) return;
      cal("ui", {
        theme: "dark",
        cssVarsPerTheme: {
          light: { "cal-brand": "#a855f7", "cal-bg-emphasis": "#141228", "cal-bg": "#0b0a18", "cal-text": "#f5f3ff" },
          dark: { "cal-brand": "#a855f7", "cal-bg-emphasis": "#141228", "cal-bg": "#0b0a18", "cal-text": "#f5f3ff" },
        },
        hideEventTypeDetails: false,
      });
      cal("on", {
        action: "bookingSuccessful",
        callback: (e: unknown) => onBooked?.(bookingUid((e as { detail?: unknown } | undefined)?.detail)),
      });
    })();
    return () => {
      alive = false;
    };
  }, [namespace, onBooked]);

  const config: Record<string, string> = { layout: "month_view", theme: "dark", "metadata[funnel]": "kino" };
  if (name) config.name = name;
  if (email) config.email = email;
  if (notes) config.notes = notes;

  return (
    <Cal
      namespace={namespace}
      calLink={KINO.cal.link}
      style={{ width: "100%", height: "auto", minHeight: 520, overflow: "visible" }}
      config={config}
    />
  );
}
