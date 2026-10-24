"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "pm_demo_k";
const SENT = "pm_demo_sent";

function store(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/**
 * Маякът на личния линк от писмата (`/demo?k=…`).
 *
 * Ключът се помни за сесията, за да се брои и браншовото демо, в което човекът
 * влезе от хъба (линковете там са без `k`). Всяка страница се праща веднъж на
 * сесия, след 2 секунди на видим екран — скенерите на пощата, които само
 * „докосват“ линка, не стигат дотам. Тихо — грешките не пречат на демото.
 */
export function DemoViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname?.startsWith("/demo") || navigator.webdriver) return;
    const s = store();
    const fromUrl = new URLSearchParams(window.location.search).get("k")?.trim().toLowerCase() ?? "";
    if (/^[0-9a-f]{8}$/.test(fromUrl)) s?.setItem(KEY, fromUrl);
    const k = /^[0-9a-f]{8}$/.test(fromUrl) ? fromUrl : (s?.getItem(KEY) ?? "");
    if (!k) return;

    let sent = new Set<string>();
    try {
      sent = new Set<string>(JSON.parse(s?.getItem(SENT) ?? "[]") as string[]);
    } catch {}
    if (sent.has(pathname)) return;

    const t = setTimeout(() => {
      if (document.visibilityState !== "visible") return;
      sent.add(pathname);
      s?.setItem(SENT, JSON.stringify([...sent]));
      void fetch("/api/tracking/demo-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ k, path: pathname }),
        keepalive: true,
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
