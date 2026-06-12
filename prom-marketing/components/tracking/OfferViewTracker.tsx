"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * View beacon: при отваряне на /oferta/* страница уведомява CRM-а, че
 * офертата е видяна (sent → viewed). Тихо — грешките не пречат на страницата.
 */
export function OfferViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/oferta/")) return;
    const t = setTimeout(() => {
      void fetch("/api/tracking/offer-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname }),
        keepalive: true,
      }).catch(() => {});
    }, 2000); // 2 сек на страницата = реално гледане, не случаен клик
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
