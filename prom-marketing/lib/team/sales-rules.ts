/**
 * Таблото на продавача — чистите правила. Единицата работа е картонът, който
 * той води (contacts.owner_id). Денят му: кого да чуе днес, кой го чака с
 * оферта, кои срещи има, докъде е стигнал всеки в тръбата.
 */
import { dayKey } from "@/lib/contacts/followup";

export const SALES_STAGES = ["contacted", "discovery", "presentation_sent", "offer_sent", "negotiating"] as const;

export interface SalesContact {
  id: string;
  full_name: string | null;
  company: string | null;
  business: string | null;
  phone: string | null;
  email: string | null;
  stage: string;
  followup_status: string | null;
  next_followup_at: string | null;
  last_heard_from_at: string | null;
  deal_value_eur: number | null;
  mood: string | null;
  owner_id: string | null;
  updated_at: string;
  created_at: string;
}

/** Срещата, както е записана в `bookings` — само полетата, от които се чете какво е казал човекът. */
export interface BookingLike {
  business?: string | null;
  automation_goal?: string | null;
  timeline?: string | null;
  /** `raw_payload.notes` — бележката на Ели / Hermes / календарната задача при записването */
  raw_payload?: unknown;
}

/**
 * Какво е казал човекът, когато си е записал срещата — един ред за картата на
 * продавача (02.11.2026, Георги: „как да видя какво са дали като бележка, като
 * са се записвали?“). Бележката е първа; дейността, целта и срокът се добавят
 * само ако бележката вече не ги съдържа (Ели завършва с „· Дейност: …“).
 */
export function bookingNote(b: BookingLike, max = 280): string | null {
  const rawNotes = b.raw_payload && typeof b.raw_payload === "object" ? (b.raw_payload as Record<string, unknown>).notes : null;
  const note = typeof rawNotes === "string" ? rawNotes.replace(/\s+/g, " ").trim() : "";
  const parts: string[] = note ? [note] : [];
  const lower = note.toLowerCase();
  const extra: Array<[string, string | null | undefined]> = [
    ["Дейност", b.business],
    ["Цел", b.automation_goal],
    ["Кога", b.timeline],
  ];
  for (const [label, v] of extra) {
    const s = (v ?? "").replace(/\s+/g, " ").trim();
    if (s && !lower.includes(s.toLowerCase().slice(0, 40))) parts.push(`${label}: ${s}`);
  }
  if (!parts.length) return null;
  const out = parts.join(" · ");
  return out.length > max ? out.slice(0, max - 1).trimEnd() + "…" : out;
}

export type SalesBucket = "today" | "overdue" | "handed" | "pipeline" | "won" | "lost";

/** Днес/просрочени по обещаното чуване; печеливши и загубени — за последните 30 дни. */
export function salesBucket(
  c: Pick<SalesContact, "stage" | "next_followup_at" | "last_heard_from_at" | "updated_at">,
  now: Date,
  wonSince: string
): SalesBucket | null {
  if (c.stage === "won") return c.updated_at >= wonSince ? "won" : null;
  if (c.stage === "lost") return c.updated_at >= wonSince ? "lost" : null;
  if (c.next_followup_at) {
    const due = dayKey(c.next_followup_at);
    const today = dayKey(now);
    const heard = c.last_heard_from_at ? dayKey(c.last_heard_from_at) : null;
    const fulfilled = heard !== null && heard >= due;
    if (!fulfilled && due < today) return "overdue";
    if (!fulfilled && due === today) return "today";
  }
  return "pipeline";
}

export interface PipelineStep {
  stage: string;
  count: number;
  value: number;
}

export function pipelineOf(contacts: Array<Pick<SalesContact, "stage" | "deal_value_eur">>): PipelineStep[] {
  return SALES_STAGES.map((stage) => {
    const rows = contacts.filter((c) => c.stage === stage);
    return { stage, count: rows.length, value: rows.reduce((s, c) => s + (Number(c.deal_value_eur) || 0), 0) };
  });
}

/** Най-старите обещания първи — те са най-просрочени. */
export function byFollowup<T extends { next_followup_at: string | null; updated_at: string }>(a: T, b: T): number {
  if (a.next_followup_at && b.next_followup_at) return a.next_followup_at.localeCompare(b.next_followup_at);
  if (a.next_followup_at) return -1;
  if (b.next_followup_at) return 1;
  return b.updated_at.localeCompare(a.updated_at);
}

/** Резултат на продавача за период: спечелени, стойност, срещи, разговори. */
export function salesScore(args: {
  won: Array<{ deal_value_eur: number | null }>;
  calls: number;
  meetings: number;
  offers: number;
}) {
  const value = args.won.reduce((s, c) => s + (Number(c.deal_value_eur) || 0), 0);
  return {
    won: args.won.length,
    value,
    calls: args.calls,
    meetings: args.meetings,
    offers: args.offers,
    closeRate: args.meetings > 0 ? Math.round((args.won.length / args.meetings) * 100) : null,
  };
}
