import "server-only";
import { sendEmail } from "./resend";
import { escapeHtml } from "./escape";
import type { createServiceClient } from "@/lib/supabase/service";

type Sb = ReturnType<typeof createServiceClient>;

/** Where replies land — the owner's active inbox. */
function replyToAddress(): string {
  return process.env.EMAIL_REPLY_TO || "ivailopetev38@gmail.com";
}

export interface WelcomeArgs {
  supabase: Sb;
  contactId: string;
  to: string;
  fullName?: string | null;
  /** Channel label for logging: 'website' | 'meta_lead' | … */
  source: string;
}

export interface WelcomeResult {
  sent: boolean;
  skipped: boolean;
  id: string | null;
  error: string | null;
}

/**
 * Send the auto-welcome email to a new lead — single source of truth for both
 * the website form and the Meta webhook. Idempotent: a contact is welcomed at
 * most once (dedupe via a `welcome:<contactId>` key on an email_sent activity).
 * Failures are logged as a separate `email_failed` activity (no dedupe key) so
 * they stay visible and can be retried.
 */
export async function sendWelcomeEmail(args: WelcomeArgs): Promise<WelcomeResult> {
  const { supabase, contactId, to, fullName, source } = args;
  const dedupeKey = `welcome:${contactId}`;

  // Idempotency — never welcome the same contact twice.
  const { data: already } = await supabase
    .from("contact_activities")
    .select("id")
    .eq("contact_id", contactId)
    .eq("activity_type", "email_sent")
    .contains("metadata", { dedupe_key: dedupeKey })
    .maybeSingle();
  if (already) return { sent: false, skipped: true, id: null, error: null };

  const firstName = fullName?.trim().split(/\s+/)[0] ?? "";
  const greetingText = firstName ? `Здравейте, ${firstName}` : "Здравейте";
  const greetingHtml = firstName ? `Здравейте, ${escapeHtml(firstName)}` : "Здравейте";
  const subject = "Получихме запитването ви — ще се чуем скоро";

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:#0d1221;max-width:600px;margin:0 auto;">
  <p>${greetingHtml},</p>
  <p>Благодаря, че се свързахте с <strong>ProMarketing</strong>. Получихме запитването ви за AI автоматизация и маркетинг и ще ви се обадим съвсем скоро, за да уточним как най-бързо можем да помогнем.</p>
  <p>Междувременно можете да:</p>
  <ul style="padding-left:20px;margin:10px 0;">
    <li>📅 Резервирате безплатна 30-мин консултация: <a href="https://promarketing.pw/booking" style="color:#0066cc;">promarketing.pw/booking</a></li>
    <li>🌐 Разгледате какво правим: <a href="https://promarketing.pw" style="color:#0066cc;">promarketing.pw</a></li>
    <li>↩️ Просто да отговорите на този имейл, ако имате конкретен въпрос</li>
  </ul>
  <p style="margin-top:24px;">До скоро,<br/>
  <strong>Ивайло Петев</strong><br/>
  Управител · „ПроМаркетинг" ЕООД<br/>
  📞 +359 877 399 963 · 🌐 <a href="https://promarketing.pw" style="color:#0066cc;">promarketing.pw</a></p>
</div>`;

  const text = `${greetingText},

Благодаря, че се свързахте с ProMarketing. Получихме запитването ви за AI автоматизация и маркетинг и ще ви се обадим съвсем скоро.

Междувременно можете да:
- Резервирате безплатна 30-мин консултация: https://promarketing.pw/booking
- Разгледате какво правим: https://promarketing.pw
- Просто да отговорите на този имейл, ако имате конкретен въпрос

До скоро,
Ивайло Петев
Управител · „ПроМаркетинг" ЕООД
+359 877 399 963 · promarketing.pw`;

  const res = await sendEmail({ to, subject, html, text, replyTo: replyToAddress() });

  if (res.error) {
    await supabase.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: "email_failed",
      title: "⚠️ Welcome имейл не тръгна",
      body: `Авто-welcome (${source}) не беше изпратен: ${res.error}`,
      occurred_at: new Date().toISOString(),
      created_by: source,
      metadata: { auto: true, source, error: res.error },
    });
    return { sent: false, skipped: false, id: null, error: res.error };
  }

  await supabase.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "email_sent",
    title: "🤖 Auto-welcome имейл",
    body: `Автоматичен приветствен имейл (${source}). Resend ID: ${res.id ?? "n/a"}`,
    occurred_at: new Date().toISOString(),
    created_by: source,
    metadata: { dedupe_key: dedupeKey, resend_id: res.id, auto: true, source },
  });

  return { sent: true, skipped: false, id: res.id, error: null };
}
