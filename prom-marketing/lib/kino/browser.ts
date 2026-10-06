/**
 * Помощници за браузъра — само за клиентските компоненти на залата.
 * Нищо тук не бива да чупи страницата: всяка грешка се преглъща.
 */
import { pickUtm, type KinoUtm } from "./people";

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name.replace(/[.$?*|{}()[\]\\/+^]/g, "\\$&")}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

/** _fbp и _fbc за Conversions API. Ако бисквитката _fbc я няма, но адресът носи fbclid — сглобява я. */
export function fbIds(): { fbp?: string; fbc?: string } {
  try {
    const fbp = readCookie("_fbp") ?? undefined;
    let fbc = readCookie("_fbc") ?? undefined;
    if (!fbc) {
      const id = new URLSearchParams(window.location.search).get("fbclid");
      if (id) fbc = `fb.1.${Date.now()}.${id}`;
    }
    return { fbp, fbc };
  } catch {
    return {};
  }
}

const UTM_KEY = "kino_utm";

/**
 * UTM-ите от първото влизане: пазят се за сесията, за да не се изгубят, ако
 * човекът мине през друга страница, преди да вземе билета.
 */
export function firstTouchUtm(): KinoUtm {
  try {
    const now = pickUtm(new URLSearchParams(window.location.search));
    if (Object.keys(now).length) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(now));
      return now;
    }
    const saved = sessionStorage.getItem(UTM_KEY);
    return saved ? pickUtm(JSON.parse(saved) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function newKinoEventId(prefix: string): string {
  const rnd =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
      : Math.random().toString(36).slice(2, 14);
  return `${prefix}_${Date.now().toString(36)}_${rnd}`;
}

export async function postJson<T = Record<string, unknown>>(url: string, body: unknown): Promise<{ ok: boolean; status: number; data: T }> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    });
    const data = (await res.json().catch(() => ({}))) as T;
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: {} as T };
  }
}

/** При затваряне на таба fetch може да не стигне — sendBeacon стига. */
export function beacon(url: string, body: unknown): void {
  try {
    const blob = new Blob([JSON.stringify(body)], { type: "text/plain;charset=UTF-8" });
    if (!navigator.sendBeacon?.(url, blob)) void postJson(url, body);
  } catch {
    /* нищо */
  }
}

export function safeLocal(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
