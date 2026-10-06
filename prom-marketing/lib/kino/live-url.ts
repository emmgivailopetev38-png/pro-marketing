/**
 * „Влизам на живо“ — линкът, който Ивайло слага в Режисьорската кабина
 * (/admin/kino). Чиста функция: проверява го и казва какъв е.
 *  - YouTube Live → вгражда се под плейъра (и бутон към YouTube);
 *  - Zoom / Google Meet / друго (само https) → бутон, отваря се в нов таб.
 */

export type LiveKind = "youtube" | "zoom" | "meet" | "link";

export interface LiveTarget {
  url: string;
  kind: LiveKind;
  /** само за YouTube — за вграждането */
  youtubeId: string | null;
  /** „Zoom“, „Google Meet“, „YouTube Live“ или домейнът */
  label: string;
}

export function parseLiveUrl(raw: string | null | undefined): LiveTarget | null {
  const v = (raw ?? "").trim();
  if (!v || v.length > 600) return null;
  let u: URL;
  try {
    u = new URL(v);
  } catch {
    return null;
  }
  if (u.protocol !== "https:" || !u.hostname.includes(".")) return null;
  const host = u.hostname.toLowerCase();
  const url = u.toString();
  if (/(^|\.)youtube\.com$/.test(host) || host === "youtu.be") {
    const id =
      host === "youtu.be"
        ? u.pathname.slice(1).split("/")[0]
        : (u.searchParams.get("v") ?? u.pathname.match(/^\/(?:live|embed|shorts)\/([\w-]{6,})/)?.[1] ?? "");
    return { url, kind: "youtube", youtubeId: /^[\w-]{6,}$/.test(id) ? id : null, label: "YouTube Live" };
  }
  if (/(^|\.)zoom\.us$/.test(host)) return { url, kind: "zoom", youtubeId: null, label: "Zoom" };
  if (host === "meet.google.com") return { url, kind: "meet", youtubeId: null, label: "Google Meet" };
  return { url, kind: "link", youtubeId: null, label: host };
}
