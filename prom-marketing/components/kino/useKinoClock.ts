"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Часовникът на залата. „Премиерата на живо“ зависи от точния час, а
 * часовниците на телефоните понякога бъркат с минути — затова се изравнява
 * със сървъра (/api/kino/time, с половината от времето за отиване и връщане).
 *
 * `simMs` — прегледът на Ивайло (?sim=…): часовникът тръгва от симулирания
 * момент и върви нормално оттам. Тогава сървърът не се пита.
 *
 * Първото рисуване (и на сървъра) е с `initialMs`, за да няма разминаване при
 * хидратацията; истинският час идва с първия тик.
 */
export function useKinoClock({ initialMs, simMs, tickMs = 1000 }: { initialMs: number; simMs?: number | null; tickMs?: number }) {
  const [now, setNow] = useState(initialMs);
  const [synced, setSynced] = useState(false);
  const offset = useRef(0);

  useEffect(() => {
    let alive = true;
    const tick = () => alive && setNow(Date.now() + offset.current);
    let first: number;
    if (simMs != null) {
      offset.current = simMs - Date.now();
      first = window.setTimeout(() => {
        tick();
        if (alive) setSynced(true);
      }, 0);
    } else {
      offset.current = 0;
      first = window.setTimeout(tick, 0);
      const t0 = performance.now();
      fetch("/api/kino/time", { cache: "no-store" })
        .then((r) => r.json())
        .then((d: { now?: number }) => {
          if (!alive || typeof d.now !== "number") return;
          const rtt = performance.now() - t0;
          // Сървърното време в момента на отговора ≈ now + rtt/2.
          const diff = d.now + rtt / 2 - Date.now();
          // Под половин секунда — не си струва да местим филма.
          offset.current = Math.abs(diff) > 500 ? diff : 0;
          tick();
        })
        .catch(() => undefined)
        .finally(() => alive && setSynced(true));
    }
    const id = window.setInterval(tick, tickMs);
    return () => {
      alive = false;
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [simMs, tickMs]);

  return { now, synced };
}
