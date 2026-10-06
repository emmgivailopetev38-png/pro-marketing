"use client";
import { useEffect } from "react";
import { track as pixelTrack, isPixelReady } from "@/lib/meta/pixel-client";
import { track } from "@/lib/analytics/track";
import { fbIds, firstTouchUtm, newKinoEventId, postJson } from "@/lib/kino/browser";

/**
 * ViewContent — веднъж на отваряне: пикселът в браузъра И сървърът (CAPI) със
 * същия event_id. Пикселът се зарежда след хидратацията, затова се чака до 6 s;
 * сървърното събитие тръгва веднага и не зависи от него.
 * Тук се записват и UTM-ите от първото влизане (за формата по-късно).
 */
export function ViewBeacon({ content, token }: { content: "afish" | "bilet" | "zala"; token?: string | null }) {
  useEffect(() => {
    firstTouchUtm();
    const eventId = newKinoEventId(`kino_view_${content}`);
    const params = { content_name: "ВЪЛНАТА · онлайн кино", content_category: "kino", content_type: content };
    let tries = 0;
    const id = window.setInterval(() => {
      tries++;
      if (isPixelReady()) {
        pixelTrack("ViewContent", { eventID: eventId, params });
        window.clearInterval(id);
      } else if (tries > 20) {
        window.clearInterval(id);
      }
    }, 300);
    void postJson("/api/kino/view", { eventId, page: window.location.origin + window.location.pathname, content, t: token ?? undefined, ...fbIds() });
    track("kino_view", { content });
    return () => window.clearInterval(id);
  }, [content, token]);
  return null;
}
