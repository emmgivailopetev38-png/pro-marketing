import type { AnswerRow, ReviewItem } from "./types";

/**
 * Чистата част от „Изпрати избора“: от клиповете и отговорите прави
 * обобщение за имейла до собственика и за активността в CRM-а.
 * Без база и без мрежа — за да е тестваемо.
 */

export interface SummaryLine {
  code: string;
  name: string;
  comment: string | null;
}

export interface Summary {
  approved: SummaryLine[];
  rejected: SummaryLine[];
  pending: SummaryLine[];
  total: number;
}

function cleanComment(raw: string | null | undefined): string | null {
  const t = (raw ?? "").trim();
  return t.length ? t : null;
}

export function buildSummary(items: ReviewItem[], answers: AnswerRow[]): Summary {
  const byCode = new Map(answers.map((a) => [a.item_code, a]));
  const s: Summary = { approved: [], rejected: [], pending: [], total: items.length };
  for (const it of items) {
    const a = byCode.get(it.code);
    const line: SummaryLine = { code: it.code, name: it.name, comment: cleanComment(a?.comment) };
    if (a?.verdict === "approved") s.approved.push(line);
    else if (a?.verdict === "rejected") s.rejected.push(line);
    else s.pending.push(line);
  }
  return s;
}

/** Заглавие за имейла/Telegram: „Биляна одобри 11 от 13 видеа“. */
export function summaryHeadline(s: Summary, clientName: string | null): string {
  const who = clientName?.trim() || "Клиентът";
  return `${who} одобри ${s.approved.length} от ${s.total} видеа`;
}

function lineText(l: SummaryLine): string {
  return l.comment ? `${l.code} ${l.name} — „${l.comment}“` : `${l.code} ${l.name}`;
}

/** Плоският текст — влиза в CRM активността и в text-версията на имейла. */
export function summaryText(s: Summary, general?: string | null): string {
  const out: string[] = [];
  const g = cleanComment(general);
  if (g) {
    out.push(`Насоки към нас: „${g}“`);
    out.push("");
  }
  out.push(`Одобрени (${s.approved.length}):`);
  out.push(...(s.approved.length ? s.approved.map((l) => `  ✓ ${lineText(l)}`) : ["  —"]));
  out.push("");
  out.push(`За преправяне (${s.rejected.length}):`);
  out.push(...(s.rejected.length ? s.rejected.map((l) => `  ✗ ${lineText(l)}`) : ["  —"]));
  if (s.pending.length) {
    out.push("");
    out.push(`Без отговор (${s.pending.length}):`);
    out.push(...s.pending.map((l) => `  · ${lineText(l)}`));
  }
  return out.join("\n");
}
