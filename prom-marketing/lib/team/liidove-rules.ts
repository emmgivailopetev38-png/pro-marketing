/**
 * „Всички лийдове“ (24.11.2026, след срещата с RevStream: „всичките лийдове,
 * които са чути, които не са чути, срещи“) — чистите правила: какво е станало
 * с всеки човек и в коя група влиза. Без база, за да се тестват.
 */
import { DQ_OUTCOME, TALKED_OUTCOMES } from "./napredak-rules";
import { LEAD_OFFERS } from "@/lib/leads/lead-offers";

export const LEAD_STATUSES = ["nov", "ne_vdiga", "govorili", "sreshta", "doshal", "ne_doshal", "oferta", "klient", "dq", "otkaz"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_META: Record<LeadStatus, { label: string; short: string; cls: string; hint: string }> = {
  nov: { label: "🆕 Нечути", short: "🆕 нечут", cls: "text-sky-300", hint: "никой не им е звънял" },
  ne_vdiga: { label: "📵 Не вдигат", short: "📵 не вдига", cls: "text-[var(--color-text-secondary)]", hint: "звънено е, още не са вдигнали" },
  govorili: { label: "💬 Говорили", short: "💬 говорили", cls: "text-amber-200", hint: "вдигнали са, но още няма среща" },
  sreshta: { label: "📅 Среща напред", short: "📅 среща", cls: "text-violet-300", hint: "имат записан час" },
  doshal: { label: "🤝 Дошли на среща", short: "🤝 дошъл", cls: "text-emerald-300", hint: "срещата се проведе — следва оферта или решение" },
  ne_doshal: { label: "🙈 Не дошли", short: "🙈 не дошъл", cls: "text-rose-300", hint: "не се явиха — звъни се за нов час" },
  oferta: { label: "📄 Оферта", short: "📄 оферта", cls: "text-cyan-300", hint: "оферта или преговори" },
  klient: { label: "✅ Клиенти", short: "✅ клиент", cls: "text-emerald-300", hint: "спечелени" },
  dq: { label: "🚫 DQ", short: "🚫 DQ", cls: "text-rose-300", hint: "неквалифицирани — не са за програмата" },
  otkaz: { label: "✕ Отказали / затворени", short: "✕ затворен", cls: "text-[var(--color-text-tertiary)]", hint: "не се интересуват, грешен номер, спряно звънене" },
};

export interface LeadActivityRow {
  contact_id: string;
  activity_type: string;
  title: string | null;
  occurred_at: string;
  created_by: string | null;
  metadata: Record<string, unknown> | null;
}

export interface LeadTouch {
  at: string;
  title: string;
  by: string | null;
}

export interface LeadActivitySummary {
  /** обаждания от човек (екипа или Ивайло), вкл. „Записах среща“ */
  calls: number;
  /** обаждания на Ели (гласовият агент) */
  eli: number;
  /** вдигнал е поне веднъж */
  reached: boolean;
  /** отбелязан като неквалифициран — на разговора или на срещата */
  dq: boolean;
  /** последните докосвания, най-новото първо (до 5) */
  history: LeadTouch[];
}

function outcomeOf(a: Pick<LeadActivityRow, "metadata">): string {
  const o = a.metadata?.outcome;
  return typeof o === "string" ? o : "";
}

/** Обаждане/среща/изход от среща/Ели → обобщение по човек. Редовете могат да са в какъвто и да е ред. */
export function summarizeLeadActivities(rows: LeadActivityRow[]): Map<string, LeadActivitySummary> {
  const out = new Map<string, LeadActivitySummary>();
  const sorted = [...rows].sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
  for (const a of sorted) {
    let s = out.get(a.contact_id);
    if (!s) {
      s = { calls: 0, eli: 0, reached: false, dq: false, history: [] };
      out.set(a.contact_id, s);
    }
    const o = outcomeOf(a);
    if (a.activity_type === "call") {
      s.calls += 1;
      if (TALKED_OUTCOMES.has(o) || o.startsWith("answered") || o === "not_interested" || o === DQ_OUTCOME || a.metadata?.kind === "dnevnik") s.reached = true;
    } else if (a.activity_type === "meeting") {
      if (o === "meeting") s.calls += 1;
      s.reached = true;
    } else if (a.activity_type === "voice_outbound") {
      // Ели набира — опит.
      s.eli += 1;
    } else if (a.activity_type === "voice_call") {
      // Ели е говорила с човека; под ~20 сек = затворил, щом е чул агента (eli-rules.ts).
      const secs = a.metadata?.duration_secs;
      if (typeof secs !== "number" || secs >= 20) s.reached = true;
    }
    if (o === DQ_OUTCOME || a.metadata?.dq === true) s.dq = true;
    if (s.history.length < 5 && a.title) s.history.push({ at: a.occurred_at, title: a.title, by: a.created_by });
  }
  return out;
}

export interface LeadBookingRef {
  status: string;
  scheduled_at: string;
}

export interface LeadFacts {
  stage: string;
  followupStatus: string | null;
  activity: LeadActivitySummary | null;
  /** всички срещи на човека (по телефон или имейл), без значение реда */
  bookings: LeadBookingRef[];
}

const DEAD = new Set(["cancelled", "rejected"]);

/** Последната отбелязана среща и дали има предстояща. */
export function meetingFacts(bookings: LeadBookingRef[], now: Date): { upcoming: LeadBookingRef | null; last: LeadBookingRef | null; held: number; noShow: number } {
  const nowMs = now.getTime();
  const live = bookings.filter((b) => !DEAD.has(b.status));
  const upcoming = live
    .filter((b) => new Date(b.scheduled_at).getTime() > nowMs)
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))[0] ?? null;
  const past = live.filter((b) => new Date(b.scheduled_at).getTime() <= nowMs).sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at));
  return {
    upcoming,
    last: past[0] ?? null,
    held: past.filter((b) => b.status === "completed").length,
    noShow: past.filter((b) => b.status === "no_show").length,
  };
}

/** В коя група е човекът — по реда на важност: клиент > DQ > оферта > среща напред > дошъл > не дошъл > отказ > говорили > не вдига > нечут. */
export function leadStatus(f: LeadFacts, now: Date): LeadStatus {
  if (f.stage === "won") return "klient";
  if (f.activity?.dq) return "dq";
  if (f.stage === "offer_sent" || f.stage === "negotiating") return "oferta";
  const m = meetingFacts(f.bookings, now);
  if (m.upcoming) return "sreshta";
  if (m.last?.status === "completed") return "doshal";
  if (m.last?.status === "no_show") return "ne_doshal";
  if (f.stage === "lost" || f.followupStatus === "not_interested") return "otkaz";
  if (f.activity?.reached) return "govorili";
  if ((f.activity?.calls ?? 0) + (f.activity?.eli ?? 0) > 0) return "ne_vdiga";
  return "nov";
}

/** Записан за уебинара (ivailopetev.com) — source „uebinar-…“. */
export function isUebinarSource(source: string | null | undefined): boolean {
  return (source ?? "").trim().startsWith("uebinar");
}

/** Откъде е дошъл — кратко, за списъка. */
export function sourceLabel(source: string | null | undefined, ad: { campaign?: string | null; ad?: string | null; form?: string | null } | null): string {
  const s = (source ?? "").trim();
  if (s === "meta_lead") {
    const name = (ad?.ad || ad?.campaign || ad?.form || "").trim();
    return name ? `Meta · ${name}` : "Meta реклама";
  }
  if (isUebinarSource(s)) return LEAD_OFFERS.uebinar.label;
  if (s === "voice_web" || s === "voice_phone") return "Ели (гласовият асистент)";
  if (s === "website_form" || s === "site_chatbot") return "сайтът";
  if (s === "cal_booking") return "записал се сам (календар)";
  if (s === "akademia") return "Академията";
  if (s === "sait-obuchenie-az") return "сайт · обучение АЗ";
  return s || "—";
}

/** Търсене по име, телефон, имейл, фирма, дейност — без значение главни/малки и интервали в телефона. */
export function matchesQuery(row: { name: string; phone: string | null; email: string | null; company: string | null; business: string | null }, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const digits = needle.replace(/\D/g, "");
  if (digits.length >= 4 && (row.phone ?? "").replace(/\D/g, "").includes(digits.replace(/^0/, ""))) return true;
  return [row.name, row.email, row.company, row.business].some((v) => (v ?? "").toLowerCase().includes(needle));
}
