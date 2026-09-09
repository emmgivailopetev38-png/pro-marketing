"use client";
import { useEffect } from "react";

/**
 * Маякът на личната страница.
 *
 * Клиентски, а не запис при рендера, по същата причина като при офертите:
 * прелоадъри, ботове и предварителните заявки на месинджърите отварят адреса,
 * без човек да е гледал нищо. Две секунди на страницата вече значат човек.
 */
export function ZatopliViewTracker({ code }: { code: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      void fetch("/api/tracking/zatopli-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
        keepalive: true,
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [code]);

  return null;
}
