import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { sendRelayEmail } from "@/lib/email/resend";
import { relayFromAddress } from "@/lib/email/relay-from";

export const dynamic = "force-dynamic";
// До 100 писма на заявка с пауза между тях (лимитът на Resend е 2 заявки/с).
export const maxDuration = 60;

const MAX_MESSAGES = 100;
const PACE_MS = 520;
const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/**
 * POST /api/crm/email-relay — писма от името на ДРУГА система през нашия Resend.
 *
 * Системата на Иво (ccgroup-crm) няма свой Resend ключ; тя подава готовите
 * писма тук, а ние ги пращаме от потвърдения ни домейн (адресът на подателя е
 * `sistema@<домейна на EMAIL_FROM>`, EMAIL_RELAY_FROM_ADDRESS го сменя), с
 * нейното име за подател и нейния reply_to. Idempotency-Key = id на писмото —
 * повторен опит със същия id не праща второ писмо.
 *
 *   Authorization: Bearer <HERMES_API_TOKEN>
 *   { "messages": [ { "id", "to", "from_name", "reply_to"?, "subject", "html", "text"?, "headers"?, "tags"? } ] }
 *   → { "results": [ { "id", "ok", "provider_id"?, "error"?, "retry"? } ] }
 *
 * `retry: true` = Resend върна 429/5xx или мрежата падна — да се опита пак по-късно.
 */
interface RelayMessage {
  id: string;
  to: string;
  from_name: string;
  reply_to?: string;
  subject: string;
  html: string;
  text?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
}

interface RelayOutcome {
  id: string;
  ok: boolean;
  provider_id?: string;
  error?: string;
  retry?: boolean;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Името на подателя — без кавички, ъглови скоби и нови редове (иначе чупи From). */
function cleanName(v: unknown): string {
  return str(v, 80).replace(/["<>\r\n]/g, "").trim();
}

function parseMessage(raw: unknown, index: number): { ok: true; msg: RelayMessage } | { ok: false; id: string; error: string } {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const id = str(o.id, 200) || `#${index}`;
  const to = str(o.to, 320);
  const fromName = cleanName(o.from_name);
  const subject = str(o.subject, 500);
  const html = typeof o.html === "string" ? o.html : "";
  if (!str(o.id, 200)) return { ok: false, id, error: "id е задължително" };
  if (!to || !EMAIL_RE.test(to)) return { ok: false, id, error: "to не е валиден имейл" };
  if (!fromName) return { ok: false, id, error: "from_name е задължително" };
  if (!subject) return { ok: false, id, error: "subject е задължително" };
  if (!html.trim()) return { ok: false, id, error: "html е задължително" };
  const replyTo = str(o.reply_to, 320);
  if (replyTo && !EMAIL_RE.test(replyTo)) return { ok: false, id, error: "reply_to не е валиден имейл" };

  const headers: Record<string, string> = {};
  if (o.headers && typeof o.headers === "object" && !Array.isArray(o.headers)) {
    for (const [k, v] of Object.entries(o.headers as Record<string, unknown>)) {
      const key = k.trim();
      if (!/^[A-Za-z0-9-]{1,80}$/.test(key) || typeof v !== "string") continue;
      // Пликът (From/To/Subject/Reply-To) го слагаме ние — не се подменя през headers.
      if (/^(from|to|cc|bcc|subject|reply-to|content-type|date)$/i.test(key)) continue;
      headers[key] = v.replace(/[\r\n]/g, " ").slice(0, 1000);
    }
  }
  const tags: Array<{ name: string; value: string }> = [];
  if (Array.isArray(o.tags)) {
    for (const t of o.tags as Array<Record<string, unknown>>) {
      const name = str(t?.name, 256);
      const value = str(t?.value, 256);
      // Resend приема само ASCII букви, цифри, „_“ и „-“ в етикетите.
      if (name && value && /^[A-Za-z0-9_-]+$/.test(name) && /^[A-Za-z0-9_-]+$/.test(value)) tags.push({ name, value });
    }
  }
  return {
    ok: true,
    msg: {
      id: str(o.id, 200),
      to,
      from_name: fromName,
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      html,
      ...(typeof o.text === "string" && o.text.trim() ? { text: o.text } : {}),
      ...(Object.keys(headers).length ? { headers } : {}),
      ...(tags.length ? { tags } : {}),
    },
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { messages?: unknown };
  try {
    body = (await request.json()) as { messages?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body?.messages) || body.messages.length === 0) {
    return NextResponse.json({ ok: false, error: "messages[] е задължително" }, { status: 400 });
  }
  if (body.messages.length > MAX_MESSAGES) {
    return NextResponse.json(
      { ok: false, error: `До ${MAX_MESSAGES} писма на заявка (получени ${body.messages.length})` },
      { status: 413 }
    );
  }
  const fromAddress = relayFromAddress();
  if (!fromAddress) {
    return NextResponse.json({ ok: false, error: "EMAIL_FROM / EMAIL_RELAY_FROM_ADDRESS липсва" }, { status: 500 });
  }

  const results: RelayOutcome[] = [];
  let sent = 0;
  let failed = 0;
  let invalid = 0;
  for (let i = 0; i < body.messages.length; i++) {
    const parsed = parseMessage(body.messages[i], i);
    if (!parsed.ok) {
      invalid++;
      results.push({ id: parsed.id, ok: false, error: parsed.error, retry: false });
      continue;
    }
    const m = parsed.msg;
    if (sent + failed > 0) await sleep(PACE_MS);
    const r = await sendRelayEmail({
      from: `${m.from_name} <${fromAddress}>`,
      to: m.to,
      subject: m.subject,
      html: m.html,
      text: m.text,
      replyTo: m.reply_to,
      headers: m.headers,
      tags: m.tags,
      idempotencyKey: m.id,
    });
    if (r.error) {
      failed++;
      const retry = r.statusCode === null || r.statusCode === 429 || r.statusCode >= 500;
      results.push({ id: m.id, ok: false, error: r.error, retry });
      continue;
    }
    sent++;
    results.push({ id: m.id, ok: true, ...(r.id ? { provider_id: r.id } : {}) });
  }
  console.log(`[email-relay] ${body.messages.length} писма: изпратени ${sent}, неуспешни ${failed}, невалидни ${invalid}`);
  return NextResponse.json({ ok: failed === 0 && invalid === 0, sent, failed, invalid, results });
}
