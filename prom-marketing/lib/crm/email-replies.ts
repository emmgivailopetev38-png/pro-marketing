import { createServiceClient } from "@/lib/supabase/service";
import { recordActivity } from "./repository";
import { tgNotify } from "@/lib/notifications/telegram";

/**
 * ОТГОВОРИТЕ НА АВТОМАТИЧНИТЕ ПИСМА → CRM-ът.
 *
 * Писмата тръгват през Resend от ivailo@promarketing.pw, а Reply-To е Gmail-ът
 * на Ивайло. Отговорът каца там и до 20.10.2026 CRM-ът не научаваше за него:
 * Стефан Христов отговори на 16.10 с „пратете ми предложение“, писмото стоя
 * непрочетено 4 дни, а поредицата му прати следващото на 18.10.
 *
 * Сега Google Apps Script в същия Gmail (`scripts/gmail-otgovori/`) пита на
 * 15 минути „от кого да гледам“ (`watchlistEmails`), търси писма от тези
 * адреси и ги праща тук (`recordInboundReplies`). Всеки нов отговор:
 *   • влиза в картона като „📨 Получен имейл“ (`email_received`);
 *   • слага `last_heard_from_at` — студената поредица спира от следващата сутрин;
 *   • праща Telegram на Ивайло веднага, за да не стои 4 дни.
 *
 * Писмо от човек, който НЕ е получавал автоматично писмо, не се пипа — това е
 * лична поща на Ивайло и няма работа в CRM-а оттук.
 */

/** Колко назад гледаме кой е получил автоматично писмо. */
export const WATCH_DAYS = 60;

/** Нашите адреси — писмо оттам никога не е „отговор от лийд“. */
const OWN = new Set(["ivailo@promarketing.pw", (process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com").toLowerCase()]);

/** Колко назад от отговора търсим вече вписан ръчно имейл (Claude/Хермес) — да не се дублира. */
const SAME_EMAIL_WINDOW_MS = 15 * 60_000;

const PAGE = 1000;
const IN_CHUNK = 150;

export interface InboundMessage {
  /** Gmail id на писмото — по него е идемпотентността. */
  gmail_id: string;
  thread_id?: string | null;
  /** „Име <a@b.bg>“ или само адресът. */
  from: string;
  subject?: string | null;
  /** ISO. */
  date: string;
  /** Snippet-ът от Gmail (началото на новия текст) или целият текст. */
  text?: string | null;
}

/** Адресът от заглавката From, малки букви. */
export function senderEmail(from: string): string | null {
  const m = from.match(/<([^<>\s]+@[^<>\s]+)>/) ?? from.match(/([^\s<>"]+@[^\s<>"]+)/);
  if (!m) return null;
  return m[1].trim().replace(/^mailto:/i, "").toLowerCase();
}

/** „Re: Re: Отг: Тема“ → „Тема“. */
export function cleanSubject(subject: string | null | undefined): string {
  return (subject ?? "").replace(/^\s*((re|fw|fwd|aw|wg|отг|отговор|пп)\s*(\[\d+\])?\s*:\s*)+/i, "").trim();
}

/**
 * Къде започва цитатът. „On/На/Am“ са с главна буква нарочно: „на“ е най-честата
 * дума в българския и без това всяко изречение с „написа:“ би се рязало.
 */
const QUOTE_START: RegExp[] = [
  /(^|\s)On\s[^\n]{0,200}?wrote:/,
  /(^|\s)На\s[^\n]{0,200}?написа:/,
  /(^|\s)Am\s[^\n]{0,200}?schrieb:/,
  /-{2,}\s*(Original Message|Оригинално съобщение)/i,
  /\n\s*(From|От):\s/,
  /\n\s*>/,
];

const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&nbsp;": " " };

/**
 * Само новото, което човекът е написал — без цитата на нашето писмо отдолу.
 * Gmail snippet-ът идва с HTML ентитита; цитатът започва с „On … wrote:“,
 * „На … написа:“, „-----Original Message“, „From:“/„От:“ (Outlook) или „>“.
 */
export function replyExcerpt(text: string | null | undefined, max = 600): string {
  let t = (text ?? "").replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (e) => ENTITIES[e] ?? e);
  const cuts = QUOTE_START.map((re) => t.search(re)).filter((i) => i >= 0);
  if (cuts.length) t = t.slice(0, Math.min(...cuts));
  t = t.replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

type Sb = ReturnType<typeof createServiceClient>;

/** Всички страници на една заявка — Supabase връща най-много 1000 реда наведнъж. */
async function pages<T>(build: (from: number, to: number) => PromiseLike<{ data: unknown }>): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data } = await build(from, from + PAGE - 1);
    const rows = (data ?? []) as T[];
    out.push(...rows);
    if (rows.length < PAGE) return out;
  }
}

function chunks<T>(xs: T[], n = IN_CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < xs.length; i += n) out.push(xs.slice(i, i + n));
  return out;
}

/** Контактите, получили автоматично писмо в последните `days` дни. */
async function autoMailedContactIds(sb: Sb, days: number, onlyIds?: string[]): Promise<Set<string>> {
  const since = new Date(Date.now() - days * 86_400_000).toISOString();
  const ids = new Set<string>();
  const batches = onlyIds ? chunks(onlyIds) : [null];
  for (const batch of batches) {
    const rows = await pages<{ contact_id: string }>((a, b) => {
      let q = sb
        .from("contact_activities")
        .select("contact_id")
        .eq("activity_type", "email_sent")
        .contains("metadata", { auto: true })
        .gte("occurred_at", since);
      if (batch) q = q.in("contact_id", batch);
      return q.order("occurred_at", { ascending: false }).range(a, b);
    });
    for (const r of rows) if (r.contact_id) ids.add(r.contact_id);
  }
  return ids;
}

/**
 * Адресите, от които Gmail скриптът да търси писма: всеки, получил
 * автоматично писмо в последните `WATCH_DAYS` дни. Без нашите адреси.
 */
export async function watchlistEmails(days = WATCH_DAYS): Promise<string[]> {
  const sb = createServiceClient();
  const ids = [...(await autoMailedContactIds(sb, days))];
  const emails = new Set<string>();
  for (const batch of chunks(ids)) {
    const { data } = await sb.from("contacts").select("id, email").in("id", batch);
    for (const c of (data ?? []) as Array<{ email: string | null }>) {
      const e = c.email?.trim().toLowerCase();
      if (e && e.includes("@") && !OWN.has(e)) emails.add(e);
    }
  }
  return [...emails].sort();
}

export interface RepliesResult {
  received: number;
  recorded: number;
  skipped: Record<string, number>;
  details: Array<{ contact_id: string; name: string | null; gmail_id: string }>;
}

/**
 * Вписва отговорите в картоните. Идемпотентно: същото Gmail писмо втори път
 * не прави нищо (скриптът праща последните 3 дни при всяко пускане), а писмо,
 * вече вписано на ръка (Claude/Хермес с час до 15 минути от отговора), не се дублира.
 */
export async function recordInboundReplies(messages: InboundMessage[]): Promise<RepliesResult> {
  const sb = createServiceClient();
  const out: RepliesResult = { received: messages.length, recorded: 0, skipped: {}, details: [] };
  const skip = (why: string) => (out.skipped[why] = (out.skipped[why] ?? 0) + 1);

  const withEmail = messages
    .map((m) => ({ m, email: senderEmail(m.from) }))
    .filter((x): x is { m: InboundMessage; email: string } => {
      if (!x.email) return (skip("no_sender"), false);
      if (OWN.has(x.email)) return (skip("own_address"), false);
      return true;
    });
  if (withEmail.length === 0) return out;

  // Картоните с тези адреси (един човек може да има няколко).
  const emails = [...new Set(withEmail.map((x) => x.email))];
  const byEmail = new Map<string, Array<{ id: string; full_name: string | null }>>();
  for (const batch of chunks(emails)) {
    const { data } = await sb.from("contacts").select("id, full_name, email").in("email", batch);
    for (const c of (data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>) {
      const e = c.email?.toLowerCase();
      if (!e) continue;
      byEmail.set(e, [...(byEmail.get(e) ?? []), { id: c.id, full_name: c.full_name }]);
    }
  }
  const contactIds = [...new Set([...byEmail.values()].flat().map((c) => c.id))];
  const mailed = contactIds.length > 0 ? await autoMailedContactIds(sb, WATCH_DAYS + 30, contactIds) : new Set<string>();

  // Вече вписаните входящи имейли на тези хора — за идемпотентността.
  const logged = new Map<string, Array<{ at: number; gmail_id: string | null }>>();
  for (const batch of chunks(contactIds)) {
    const { data } = await sb
      .from("contact_activities")
      .select("contact_id, occurred_at, metadata")
      .in("contact_id", batch)
      .in("activity_type", ["email_received", "email"]);
    for (const a of (data ?? []) as Array<{ contact_id: string; occurred_at: string; metadata: Record<string, unknown> | null }>) {
      const list = logged.get(a.contact_id) ?? [];
      list.push({ at: new Date(a.occurred_at).getTime(), gmail_id: (a.metadata?.gmail_id as string | undefined) ?? null });
      logged.set(a.contact_id, list);
    }
  }

  for (const { m, email } of withEmail) {
    const targets = (byEmail.get(email) ?? []).filter((c) => mailed.has(c.id));
    if (targets.length === 0) {
      skip(byEmail.has(email) ? "no_auto_email" : "not_a_contact");
      continue;
    }
    const at = new Date(m.date);
    const atMs = Number.isNaN(at.getTime()) ? Date.now() : at.getTime();
    const subject = cleanSubject(m.subject);
    const excerpt = replyExcerpt(m.text);

    let notified = false;
    for (const c of targets) {
      const prev = logged.get(c.id) ?? [];
      if (prev.some((p) => p.gmail_id === m.gmail_id)) {
        skip("already_recorded");
        continue;
      }
      if (prev.some((p) => Math.abs(p.at - atMs) <= SAME_EMAIL_WINDOW_MS)) {
        skip("logged_by_hand");
        continue;
      }
      const r = await recordActivity({
        contact_id: c.id,
        activity_type: "email_received",
        title: subject ? `📩 Отговори на имейла „${subject}“` : "📩 Отговори на имейла",
        body: excerpt || undefined,
        occurred_at: new Date(atMs).toISOString(),
        metadata: { gmail_id: m.gmail_id, thread_id: m.thread_id ?? null, from: email, subject: m.subject ?? null, source: "gmail_script" },
        dedupe_key: `gmail:${m.gmail_id}`,
        mark_heard: true,
        created_by: "email_reply",
      });
      if (r.error || !r.created) {
        skip(r.error ? "error" : "already_recorded");
        continue;
      }
      prev.push({ at: atMs, gmail_id: m.gmail_id });
      logged.set(c.id, prev);
      out.recorded++;
      out.details.push({ contact_id: c.id, name: c.full_name, gmail_id: m.gmail_id });
      if (!notified) {
        notified = true;
        await tgNotify.emailReply(c.full_name ?? email, subject, excerpt, c.id, m.thread_id ?? null);
      }
    }
  }
  return out;
}

// ── сутрешният отчет ──────────────────────────────────────────────────────

export interface Engagement {
  replies: Array<{ contact_id: string; name: string; title: string; excerpt: string }>;
  demo: Array<{ contact_id: string; name: string; pages: string[] }>;
  /** Gmail скриптът се е обаждал в последните 26 часа. */
  scriptAlive: boolean;
}

/** Кой отговори и кой отвори демото от `sinceIso` насам — за сутрешния отчет. */
export async function loadEngagement(sinceIso: string): Promise<Engagement> {
  const sb = createServiceClient();
  const { data } = await sb
    .from("contact_activities")
    .select("contact_id, activity_type, title, body, metadata, occurred_at")
    .in("activity_type", ["email_received", "email", "demo_view"])
    .gte("occurred_at", sinceIso)
    .order("occurred_at", { ascending: true })
    .limit(200);
  const rows = (data ?? []) as Array<{
    contact_id: string;
    activity_type: string;
    title: string | null;
    body: string | null;
    metadata: Record<string, unknown> | null;
  }>;
  const ids = [...new Set(rows.map((r) => r.contact_id))];
  const names = new Map<string, string>();
  for (const batch of chunks(ids)) {
    const { data: cs } = await sb.from("contacts").select("id, full_name, company, email").in("id", batch);
    for (const c of (cs ?? []) as Array<{ id: string; full_name: string | null; company: string | null; email: string | null }>) {
      names.set(c.id, c.full_name || c.company || c.email || "Без име");
    }
  }
  const heartbeatSince = new Date(Date.now() - 26 * 3_600_000).toISOString();
  const { data: beats } = await sb
    .from("automation_events")
    .select("id")
    .eq("event_type", "gmail_script_run")
    .gte("created_at", heartbeatSince)
    .limit(1);

  return {
    replies: rows
      .filter((r) => r.activity_type !== "demo_view")
      .map((r) => ({
        contact_id: r.contact_id,
        name: names.get(r.contact_id) ?? "Без име",
        title: r.title ?? "Имейл",
        excerpt: replyExcerpt(r.body, 140),
      })),
    demo: rows
      .filter((r) => r.activity_type === "demo_view")
      .map((r) => ({
        contact_id: r.contact_id,
        name: names.get(r.contact_id) ?? "Без име",
        pages: Array.isArray(r.metadata?.pages) ? (r.metadata.pages as string[]) : [],
      })),
    scriptAlive: ((beats ?? []) as unknown[]).length > 0,
  };
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Блокът „📩 отговориха · 👀 отвориха демото“ под автоматичните писма. */
export function engagementSummary(e: Engagement): { html: string; text: string } {
  const replyLines = e.replies.map((r) => ({
    html: `<li><a href="${SITE}/admin/clients/${r.contact_id}" style="color:#0066cc;font-weight:600">${esc(r.name)}</a> — ${esc(r.title.replace(/^📩\s*/, ""))}${r.excerpt ? `<br><span style="color:#555">„${esc(r.excerpt)}“</span>` : ""}</li>`,
    text: `  ${r.name} — ${r.title.replace(/^📩\s*/, "")}${r.excerpt ? ` · „${r.excerpt}“` : ""}`,
  }));
  const demoLines = e.demo.map((d) => {
    const where = d.pages.length ? d.pages.join(", ") : "демото";
    return {
      html: `<li><a href="${SITE}/admin/clients/${d.contact_id}" style="color:#0066cc;font-weight:600">${esc(d.name)}</a> — ${esc(where)}</li>`,
      text: `  ${d.name} — ${where}`,
    };
  });
  const warn = e.scriptAlive
    ? null
    : "⚠️ Gmail проверката на отговорите не е минавала от вчера — отвори скрипта „ProMarketing · отговори“ на script.google.com и натисни Run.";

  const html = `<div style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#0d1221;max-width:680px;background:#f5f7fa;border-radius:8px;padding:14px 18px;margin-top:12px">
    <h2 style="margin:0 0 6px;font-size:15px;color:#0066cc">📩 Отговориха (24 ч): ${e.replies.length}</h2>
    ${replyLines.length ? `<ul style="margin:0 0 8px;padding-left:20px">${replyLines.map((l) => l.html).join("")}</ul>` : `<p style="margin:0 0 8px;color:#666">Никой.</p>`}
    <h2 style="margin:0 0 6px;font-size:15px;color:#0066cc">👀 Отвориха демото от писмото (24 ч): ${e.demo.length}</h2>
    ${demoLines.length ? `<ul style="margin:0;padding-left:20px">${demoLines.map((l) => l.html).join("")}</ul>` : `<p style="margin:0;color:#666">Никой.</p>`}
    ${warn ? `<p style="margin:10px 0 0;color:#b45309;font-weight:600">${esc(warn)}</p>` : ""}
  </div>`;
  const text = `\n📩 ОТГОВОРИХА (24 ч): ${e.replies.length}\n${replyLines.map((l) => l.text).join("\n") || "  Никой."}\n👀 ОТВОРИХА ДЕМОТО ОТ ПИСМОТО (24 ч): ${e.demo.length}\n${demoLines.map((l) => l.text).join("\n") || "  Никой."}${warn ? `\n${warn}` : ""}\n`;
  return { html, text };
}
