/**
 * Правилата на рутинното изравняване на CRM-а — чиста логика, без база.
 *
 * Поискано на 05.09.2026: „да няма разминавания рутинно, за всеки случай" и
 * „полета, които са празни, а трябва да се пълнят автоматично — оферти и
 * всичко". Прилагането е в `consistency.ts` (в сутрешния крон и зад
 * POST /api/crm/consistency); тук е само какво трябва да е вярно за един
 * картон, за да може да се тества.
 *
 * Принципът: пълним само ПРАЗНО, местим етапа само НАПРЕД, и всяка промяна
 * оставя бележка в картона — нищо не се пренаписва тихо.
 */

import type { ContactStage, FollowupStatus } from "@/lib/contacts/types";
import { alignStage, alignStatus, followupState } from "@/lib/contacts/followup";

const PIPELINE: ContactStage[] = ["lead", "contacted", "discovery", "presentation_sent", "offer_sent", "negotiating"];

/** Пощи, чийто домейн не казва нищо за фирмата. */
export const PUBLIC_MAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "abv.bg", "yahoo.com", "yahoo.co.uk", "yahoo.de", "mail.bg", "mail.ru",
  "outlook.com", "hotmail.com", "hotmail.co.uk", "live.com", "msn.com", "icloud.com", "me.com", "mac.com",
  "dir.bg", "protonmail.com", "proton.me", "yandex.ru", "yandex.com", "gmx.de", "gmx.net", "web.de",
  "aol.com", "zoho.com", "meta.com", "example.com", "promarketing.pw",
]);

/**
 * Фирмата от домейна на имейла. `office@tus-bg.com` → „tus-bg.com".
 * Не е името на фирмата, но е достатъчно, за да се види в опашката, че това е
 * фирмен лийд, а не частно лице — и после Ивайло го поправя с едно писане.
 */
export function companyFromEmail(email: string | null | undefined): string | null {
  const e = (email ?? "").trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return null;
  let domain = e.slice(at + 1);
  if (!domain.includes(".") || PUBLIC_MAIL_DOMAINS.has(domain)) return null;
  domain = domain.replace(/^(mail|www|smtp|imap)\./, "");
  if (PUBLIC_MAIL_DOMAINS.has(domain)) return null;
  return domain;
}

/**
 * Сумата в евро от текст като „оферта 3 000 €", „890 € еднократно",
 * „1 500 + 1 500 €", „€ 2 400". Връща най-голямата правдоподобна сума
 * (100 … 100 000) — при „800 € + 80 €/мес" сделката е 800, не 80.
 */
export function parseEurAmount(text: string | null | undefined): number | null {
  if (!text) return null;
  const found: number[] = [];
  const re = /(?:€|EUR|евро)\s*(\d{1,3}(?:[  .]\d{3})*(?:,\d{1,2})?)|(\d{1,3}(?:[  .]\d{3})*(?:,\d{1,2})?)\s*(?:€|EUR|евро)/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const raw = (m[1] ?? m[2] ?? "").replace(/[  .]/g, "").replace(",", ".");
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 100 && n <= 100_000) found.push(Math.round(n));
  }
  return found.length ? Math.max(...found) : null;
}

export interface ActivityLike {
  id?: string;
  activity_type: string;
  title: string | null;
  body?: string | null;
  occurred_at: string;
  metadata?: Record<string, unknown> | null;
}

/** Активност, която значи „пратихме оферта" — по тип или по заглавие на ръчно пратен имейл. */
export function isOfferActivity(a: ActivityLike): boolean {
  if (a.activity_type === "offer_sent") return true;
  if (a.activity_type === "offer_ready") return false; // готова, но НЕ е изпратена
  if (a.activity_type !== "email_sent") return false;
  const t = a.title ?? "";
  // Автоматичните писма от поредиците никога не са оферти.
  if (/^(Поредица|Топъл кръг) ·/.test(t)) return false;
  return /оферт|проформ/i.test(t);
}

/**
 * Най-ниският етап, който следва от това, което реално се е СЛУЧИЛО в картона.
 * Активностите са по-надеждни от статуса: те са записи на събития.
 */
export function minStageFromActivities(acts: ActivityLike[]): ContactStage | null {
  const types = new Set(acts.map((a) => a.activity_type));
  if (types.has("payment_received") || types.has("contract_signed")) return "won";
  if (types.has("contract_sent")) return "negotiating";
  if (acts.some(isOfferActivity)) return "offer_sent";
  if (types.has("presentation_sent")) return "presentation_sent";
  if (["call", "meeting", "booking", "booking_voice"].some((t) => types.has(t))) return "contacted";
  return null;
}

function stageIndex(s: ContactStage): number {
  return PIPELINE.indexOf(s);
}

export interface ContactLike {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage: ContactStage;
  followup_status: FollowupStatus | null;
  next_followup_at: string | null;
  last_heard_from_at: string | null;
  deal_value_eur: number | null;
}

export interface OfferLike {
  amount_gross: number | null;
  amount_net: number | null;
  created_at: string;
}
export interface InvoiceLike {
  amount_gross: number | null;
  amount_net: number | null;
  status: string;
  invoice_type?: string | null;
}

export interface Fix {
  field: "stage" | "followup_status" | "next_followup_at" | "last_heard_from_at" | "company" | "deal_value_eur";
  from: unknown;
  to: unknown;
  reason: string;
}

/**
 * Какво трябва да се оправи в един картон. Празен списък = картонът е верен.
 */
export function planContactFixes(
  c: ContactLike,
  acts: ActivityLike[],
  offers: OfferLike[],
  invoices: InvoiceLike[],
  now: Date = new Date()
): Fix[] {
  const fixes: Fix[] = [];
  let stage: ContactStage = c.stage;
  let status: FollowupStatus | null = c.followup_status;
  let next = c.next_followup_at;
  let heard = c.last_heard_from_at;

  // 1. Етапът — напред според статуса и според случилото се. Крайните не се пипат
  //    (won остава won; lost остава lost — „загубен" е решение на Ивайло).
  if (stage !== "won" && stage !== "lost") {
    const byStatus = alignStage(stage, status);
    const byActs = minStageFromActivities(acts);
    let want: ContactStage = byStatus;
    if (byActs === "won") {
      want = "won";
    } else if (byActs && byActs !== "lost" && stageIndex(byActs) > stageIndex(want)) {
      want = byActs;
    }
    if (want !== stage) {
      fixes.push({ field: "stage", from: stage, to: want, reason: byActs && want === byActs ? "според активностите" : "според статуса" });
      stage = want;
    }
  }

  // 2. Спечеленият няма продажбен статус. Напомнянето му обаче остава: то може
  //    да е обаждане по доставката, а сутрешният списък и без това не брои won.
  if (stage === "won") {
    if (alignStatus(stage, status) !== status) {
      fixes.push({ field: "followup_status", from: status, to: null, reason: "спечелен клиент" });
      status = null;
    }
  }

  // 3. Изпълнено напомняне — обаждане/среща на деня или след него → маха се.
  if (next) {
    const attempts = acts
      .filter((a) => a.activity_type === "call" || a.activity_type === "meeting")
      .map((a) => a.occurred_at)
      .sort();
    const lastAttempt = attempts.length ? attempts[attempts.length - 1] : null;
    const state = followupState({ next_followup_at: next, last_heard_from_at: heard }, lastAttempt, now);
    if (state === "fulfilled") {
      fixes.push({ field: "next_followup_at", from: next, to: null, reason: "обаждането е направено" });
      next = null;
      // Срещата значи, че сме се чули — ако „чут" още е празно.
      const lastMeeting = acts
        .filter((a) => a.activity_type === "meeting")
        .map((a) => a.occurred_at)
        .sort()
        .pop();
      if (lastMeeting && !heard && new Date(lastMeeting) <= now) {
        fixes.push({ field: "last_heard_from_at", from: null, to: lastMeeting, reason: "проведена среща" });
        heard = lastMeeting;
      }
    }
  }

  // 4. Статус след първо писмо: човек, на когото само сме писали, е „изпратен имейл",
  //    не празно — така опашката знае, че вече е докоснат.
  if (!status && stage !== "won" && stage !== "lost") {
    const hasEmail = acts.some((a) => a.activity_type === "email_sent");
    const talked = acts.some((a) => ["call", "meeting"].includes(a.activity_type));
    if (hasEmail && !talked) {
      fixes.push({ field: "followup_status", from: null, to: "sent_email", reason: "има изпратен имейл, няма разговор" });
      status = "sent_email";
    }
  }

  // 5. Фирмата от домейна, когда полето е празно.
  if (!c.company) {
    const co = companyFromEmail(c.email);
    if (co) fixes.push({ field: "company", from: null, to: co, reason: "фирмен домейн на имейла" });
  }

  // 6. Стойност на сделката — от офертата, от фактурите или от текста на изпратената оферта.
  if (!c.deal_value_eur) {
    let value: number | null = null;
    let reason = "";
    const latestOffer = [...offers].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))[0];
    if (latestOffer && (latestOffer.amount_gross || latestOffer.amount_net)) {
      value = Math.round(latestOffer.amount_gross ?? latestOffer.amount_net ?? 0);
      reason = "от офертата";
    }
    if (!value) {
      const live = invoices.filter((i) => i.status !== "cancelled" && i.status !== "draft");
      const sum = live.reduce((s, i) => s + (i.amount_gross ?? i.amount_net ?? 0), 0);
      if (sum >= 50) {
        value = Math.round(sum);
        reason = "от фактурите";
      }
    }
    if (!value) {
      const offerActs = acts.filter(isOfferActivity).sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
      for (const a of offerActs) {
        const n = parseEurAmount(`${a.title ?? ""}\n${a.body ?? ""}`);
        if (n) {
          value = n;
          reason = "от текста на изпратената оферта";
          break;
        }
      }
    }
    if (value) fixes.push({ field: "deal_value_eur", from: null, to: value, reason });
  }

  return fixes;
}

export interface PlannedOffer {
  title: string;
  amount: number | null;
  sent_at: string;
  dedupe_key: string;
}

/**
 * Оферта за секцията „Оферти", ако е пратена като имейл, но никой не ѝ е
 * направил запис. Заглавието е това на имейла, без емоджитата и префиксите.
 */
export function planOfferFromActivities(acts: ActivityLike[], existingOffers: number): PlannedOffer | null {
  if (existingOffers > 0) return null;
  const offerActs = acts.filter(isOfferActivity).sort((a, b) => (a.occurred_at < b.occurred_at ? 1 : -1));
  const a = offerActs[0];
  if (!a) return null;
  const title = (a.title ?? "Оферта")
    .replace(/^[^\p{L}\p{N}„"]+/u, "")
    .replace(/^(ИЗПРАТЕНА?\s+)?(ОФЕРТА|оферта|имейл)\s*·\s*/i, "")
    .replace(/^ИЗПРАТЕН(А|О)?\s*·\s*/i, "")
    .trim()
    .slice(0, 160);
  return {
    title: title || "Оферта",
    amount: parseEurAmount(`${a.title ?? ""}\n${a.body ?? ""}`),
    sent_at: a.occurred_at,
    dedupe_key: a.id ? `activity:${a.id}` : `offer:${a.occurred_at}`,
  };
}
