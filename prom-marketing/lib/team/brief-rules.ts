/**
 * Брифът на картата (05.11.2026). Когда Ивайло предаде топъл лийд на клоузъра,
 * на картона остава бележка „🎯 Бриф за Георги …“ — кой е човекът, какво е
 * искал, офертата, възраженията дословно (с линк към момента в записа), къде се
 * е изгубила продажбата и с какво изречение да го отвори. Картата в /ekip я
 * показва цяла, за да не търси продавачът нищо извън системата.
 *
 * Чисти правила — без база, без React.
 */

export const BRIEF_PREFIX = "🎯 Бриф";

export interface BriefLike {
  contact_id: string;
  title: string | null;
  body: string | null;
  occurred_at: string;
}

export interface Brief {
  title: string;
  body: string;
  at: string;
}

/** Бележката е бриф, когато заглавието започва с „🎯 Бриф“. */
export function isBriefTitle(title: string | null | undefined): boolean {
  return (title ?? "").trim().startsWith(BRIEF_PREFIX);
}

/** Последният бриф на всеки картон (по occurred_at), празните тела не се броят. */
export function pickBriefs(acts: BriefLike[]): Map<string, Brief> {
  const out = new Map<string, Brief>();
  for (const a of acts) {
    if (!isBriefTitle(a.title) || !a.body || !a.body.trim()) continue;
    const cur = out.get(a.contact_id);
    if (!cur || a.occurred_at > cur.at) out.set(a.contact_id, { title: (a.title ?? "").trim(), body: a.body, at: a.occurred_at });
  }
  return out;
}

export type BriefSegment = { kind: "text"; text: string } | { kind: "bold"; text: string } | { kind: "link"; href: string; label: string };

export interface BriefLine {
  kind: "h" | "p" | "blank";
  /** 1–3 за заглавията (`#`, `##`, `###`) */
  level?: number;
  segments: BriefSegment[];
}

const TOKEN = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<>()„“”"]+)|\*\*([^*]+)\*\*/g;

/** Един ред → парчета: markdown линк, гол URL, **удебелено**, обикновен текст. */
export function formatBriefLine(line: string): BriefSegment[] {
  const out: BriefSegment[] = [];
  let last = 0;
  for (const m of line.matchAll(TOKEN)) {
    const idx = m.index ?? 0;
    if (idx > last) out.push({ kind: "text", text: line.slice(last, idx) });
    if (m[1] && m[2]) out.push({ kind: "link", href: m[2], label: m[1] });
    else if (m[3]) {
      // точка/запетая след URL не е част от него
      const trimmed = m[3].replace(/[.,;:]+$/, "");
      out.push({ kind: "link", href: trimmed, label: trimmed });
      if (trimmed.length < m[3].length) out.push({ kind: "text", text: m[3].slice(trimmed.length) });
    } else if (m[4]) out.push({ kind: "bold", text: m[4] });
    last = idx + m[0].length;
  }
  if (last < line.length) out.push({ kind: "text", text: line.slice(last) });
  return out;
}

/** Цялото тяло → редове за рисуване (заглавия, абзаци, празни). */
export function briefLines(body: string): BriefLine[] {
  return body.split(/\r?\n/).map((raw) => {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) return { kind: "blank", segments: [] };
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) return { kind: "h", level: h[1].length, segments: formatBriefLine(h[2]) };
    return { kind: "p", segments: formatBriefLine(line.replace(/^[-*]\s+/, "• ")) };
  });
}
