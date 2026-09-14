import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { sendTelegram } from "@/lib/notifications/telegram";
import { loadReview, markSubmitted, upsertAnswers } from "@/lib/pregled/repository";
import { buildSummary, summaryHeadline, summaryText, type Summary, type SummaryLine } from "@/lib/pregled/summary";
import { isValidKey } from "@/lib/pregled/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/pregled/<ключ>/izprati
 *
 * „Изпрати избора“. Първо записва подадените отговори (за да не се загуби
 * бележка, която е още в полето), после:
 *   1. имейл до собственика с одобрените, върнатите и бележките;
 *   2. Telegram с бутон към картона в CRM-а (тих no-op без токен);
 *   3. активност client_review в CRM-а + last_heard_from_at на контакта —
 *      клиентът реално се е обадил, дори да не е написал имейл.
 * Всичко се await-ва: на Vercel функцията замръзва след отговора.
 * Ако имейлът падне, отговорите пак са записани — връщаме ok с notified:false.
 */

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://promarketing.pw";

const schema = z.object({
  answers: z
    .array(
      z.object({
        code: z.string().trim().min(1).max(20),
        verdict: z.enum(["approved", "rejected"]).nullable(),
        comment: z.string().max(1500).default(""),
      })
    )
    .max(60)
    .optional(),
});

function adminEmail(): string {
  return (
    (process.env.ALLOWED_ADMIN_EMAILS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)[0] ||
    process.env.EMAIL_REPLY_TO?.trim() ||
    "emmgivailopetev38@gmail.com"
  );
}

function htmlList(lines: SummaryLine[], mark: string, color: string): string {
  if (!lines.length) return `<p style="margin:0 0 4px;color:#777">—</p>`;
  return `<ul style="margin:0 0 4px;padding-left:18px">${lines
    .map(
      (l) =>
        `<li style="margin:0 0 6px"><span style="color:${color};font-weight:700">${mark}</span> <b>${escapeHtml(l.code)}</b> ${escapeHtml(l.name)}${
          l.comment ? `<br/><em style="color:#444">„${escapeHtml(l.comment)}“</em>` : ""
        }</li>`
    )
    .join("")}</ul>`;
}

function buildEmail(s: Summary, clientName: string | null, title: string, contactId: string | null, nth: number) {
  const headline = summaryHeadline(s, clientName);
  const suffix = nth > 1 ? ` · промяна №${nth}` : "";
  const subject = `🎬 ${headline}${suffix}`;
  const crmLink = contactId ? `${SITE}/admin/clients/${contactId}` : `${SITE}/admin/clients`;
  const text = [`${headline}${suffix}`, title, "", summaryText(s), "", `Картонът в CRM-а: ${crmLink}`].join("\n");
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111">
      <h2 style="margin:0 0 4px">🎬 ${escapeHtml(headline)}${escapeHtml(suffix)}</h2>
      <p style="margin:0 0 16px;color:#555">${escapeHtml(title)}</p>
      <p style="margin:0 0 4px"><b>Одобрени (${s.approved.length})</b></p>
      ${htmlList(s.approved, "✓", "#1f7a3a")}
      <p style="margin:14px 0 4px"><b>За преправяне (${s.rejected.length})</b></p>
      ${htmlList(s.rejected, "✗", "#9b1d1d")}
      ${
        s.pending.length
          ? `<p style="margin:14px 0 4px"><b>Без отговор (${s.pending.length})</b></p>${htmlList(s.pending, "·", "#777")}`
          : ""
      }
      <p style="margin:18px 0 0"><a href="${crmLink}">Картонът в CRM-а →</a></p>
    </div>`;
  return { subject, text, html };
}

export async function POST(request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  if (!isValidKey(key)) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  const raw = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(raw ?? {});
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Invalid input" }, { status: 400 });

  let loaded = await loadReview(key);
  if (!loaded) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  try {
    if (parsed.data.answers?.length) {
      const { error } = await upsertAnswers(loaded.review.id, loaded.review.items, parsed.data.answers);
      if (error) return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
      loaded = (await loadReview(key)) ?? loaded;
    }

    const { review, answers } = loaded;
    const summary = buildSummary(review.items, answers);
    const nth = review.submit_count + 1;
    await markSubmitted(review.id, review.submit_count);

    // 1. имейл
    const mail = buildEmail(summary, review.client_name, review.title, review.contact_id, nth);
    const sent = await sendEmail({ to: adminEmail(), subject: mail.subject, html: mail.html, text: mail.text });
    if (sent.error) console.error("[pregled/izprati] email failed:", sent.error);

    // 2. Telegram
    const headline = summaryHeadline(summary, review.client_name);
    await sendTelegram(
      `🎬 <b>${escapeHtml(headline)}</b>${nth > 1 ? ` (промяна №${nth})` : ""}\n${escapeHtml(review.title)}\n\n${escapeHtml(
        summaryText(summary)
      )}`,
      review.contact_id ? { buttons: [{ text: "👤 Картонът", url: `${SITE}/admin/clients/${review.contact_id}` }] } : undefined
    );

    // 3. CRM
    if (review.contact_id) {
      const sb = createServiceClient();
      const now = new Date().toISOString();
      const { error: actErr } = await sb.from("contact_activities").insert({
        contact_id: review.contact_id,
        activity_type: "client_review",
        title: `${headline}${nth > 1 ? ` (промяна №${nth})` : ""}`,
        body: summaryText(summary),
        occurred_at: now,
        created_by: "website",
        metadata: {
          review_key: review.key,
          review_title: review.title,
          submit_count: nth,
          approved: summary.approved.map((l) => l.code),
          rejected: summary.rejected.map((l) => l.code),
          pending: summary.pending.map((l) => l.code),
          comments: Object.fromEntries(
            [...summary.approved, ...summary.rejected, ...summary.pending]
              .filter((l) => l.comment)
              .map((l) => [l.code, l.comment])
          ),
        },
      });
      if (actErr) console.error("[pregled/izprati] activity insert failed:", actErr.message);
      const { error: heardErr } = await sb
        .from("contacts")
        .update({ last_heard_from_at: now, updated_at: now })
        .eq("id", review.contact_id);
      if (heardErr) console.error("[pregled/izprati] last_heard_from_at failed:", heardErr.message);
    }

    return NextResponse.json({
      ok: true,
      notified: !sent.error,
      approved: summary.approved.length,
      rejected: summary.rejected.length,
      pending: summary.pending.length,
      total: summary.total,
    });
  } catch (e) {
    console.error("[pregled/izprati] unexpected error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "Unexpected error" }, { status: 500 });
  }
}
