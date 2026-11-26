"use client";
import { useEffect } from "react";
import { newEventId } from "@/lib/meta/pixel-client";
import { eStandartno, type SabitieIme } from "@/lib/uebinar/meta-sabitia";

/**
 * Пълното проследяване на страниците на уебинара (Ивайло, 25.11.2026: „да
 * следи всички данни, за всеки случай“). Всяко действие тръгва към пиксела на
 * уебинара и от браузъра, и от сървъра (/api/uebinar/sabitie) със същия
 * event_id. Сървърното копие тръгва и когато пикселът в браузъра е блокиран.
 *
 * Следи: PageView (сървърното копие на този от MetaPixel), ViewContent,
 * отваряне на формата (кой бутон), скрол 25/50/75/90 %, време 15/60/180 сек.,
 * пуснато видео, клик към Viber канала и към календара.
 * CompleteRegistration се праща от формата и /api/uebinar/register.
 */

declare global {
  interface Window {
    __pmPv?: string;
  }
}

const VID_KEY = "pm_vid";

/** Анонимен идентификатор на посетителя (за external_id) — пази се в браузъра. */
function vid(): string | null {
  try {
    let v = localStorage.getItem(VID_KEY);
    if (!v || !/^[A-Za-z0-9_-]{8,64}$/.test(v)) {
      v = newEventId().replace(/[^A-Za-z0-9_-]/g, "");
      localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch {
    return null;
  }
}

function kamSarvara(name: SabitieIme, eventId: string, params?: Record<string, string | number>): void {
  try {
    const body = JSON.stringify({ name, event_id: eventId, params, url: location.href, vid: vid() });
    if (navigator.sendBeacon) {
      const ok = navigator.sendBeacon("/api/uebinar/sabitie", new Blob([body], { type: "application/json" }));
      if (ok) return;
    }
    void fetch("/api/uebinar/sabitie", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
  } catch {
    /* проследяването никога не чупи страницата */
  }
}

/** Събитие и в браузъра (ако пикселът е зареден), и от сървъра. */
export function sabitie(name: SabitieIme, params?: Record<string, string | number>): void {
  const eventId = newEventId().replace(/[^A-Za-z0-9_-]/g, "");
  try {
    if (typeof window.fbq === "function") {
      window.fbq(eStandartno(name) ? "track" : "trackCustom", name, params ?? {}, { eventID: eventId });
    }
  } catch {
    /* нищо */
  }
  kamSarvara(name, eventId, params);
}

export function UebinarSledene({ stranica, varianta }: { stranica: "lending" | "podaraci"; varianta?: "A" | "B" }) {
  useEffect(() => {
    // A/B тестът на лендинга: версията тръгва с всяко събитие (lib/uebinar/ab.ts).
    const v = (p?: Record<string, string | number>) => (varianta ? { ...(p ?? {}), varianta } : p);
    const s = (name: SabitieIme, p?: Record<string, string | number>) => sabitie(name, v(p));
    const timers: number[] = [];
    let spryano = false;

    // 1) PageView от сървъра — със същия id като браузърния (MetaPixel го слага в window.__pmPv).
    let opiti = 0;
    const pv = () => {
      if (spryano) return;
      if (window.__pmPv) return kamSarvara("PageView", window.__pmPv, v());
      if (++opiti > 30) return kamSarvara("PageView", newEventId().replace(/[^A-Za-z0-9_-]/g, ""), v()); // пикселът е блокиран
      timers.push(window.setTimeout(pv, 200));
    };
    pv();

    // 2) ViewContent — след като пикселът се зареди (или до 3 сек.).
    timers.push(
      window.setTimeout(
        () => s("ViewContent", { content_name: stranica === "lending" ? "uebinar-lending" : "uebinar-podaraci", content_category: "uebinar" }),
        typeof window.fbq === "function" ? 300 : 3000,
      ),
    );

    // 3) Време на страницата.
    for (const sek of [15, 60, 180]) timers.push(window.setTimeout(() => s("VremeNaStranicata", { sekundi: sek }), sek * 1000));

    // 4) Скрол.
    const praguve = [25, 50, 75, 90];
    const minati = new Set<number>();
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (h <= 0) return;
      const p = (window.scrollY / h) * 100;
      for (const t of praguve) {
        if (p >= t && !minati.has(t)) {
          minati.add(t);
          s("Skrol", { procent: t });
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // 5) Кликове: бутоните за записване, Viber, календарът.
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      const zapis = el?.closest("[data-zapis]");
      if (zapis) return s("OtvoriFormata", { mesto: zapis.getAttribute("data-zapis") || "" });
      const a = el?.closest("a");
      const href = a?.getAttribute("href") || "";
      if (/viber/i.test(href)) return s("KlikViber");
      if (/calendar|kalendar/i.test(href)) return s("KlikKalendar");
    };
    document.addEventListener("click", onClick, true);

    // 6) Видео отзивите (play не се качва нагоре — хваща се на capture).
    const gledani = new Set<string>();
    const onPlay = (e: Event) => {
      const v = e.target as HTMLVideoElement | null;
      if (!v || v.tagName !== "VIDEO") return;
      const ime = (v.currentSrc || v.src || "").split("/").pop()?.split("?")[0] || "video";
      if (gledani.has(ime)) return;
      gledani.add(ime);
      s("GledaVideo", { video: ime });
    };
    document.addEventListener("play", onPlay, true);

    return () => {
      spryano = true;
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("play", onPlay, true);
    };
  }, [stranica, varianta]);

  return null;
}
