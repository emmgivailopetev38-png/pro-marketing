import { NextResponse } from "next/server";
import { syncAllSources } from "@/lib/leads/import";
import { sendEmail } from "@/lib/email/resend";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Lightweight hourly sync — pulls fresh Meta leads from configured Google
 * Sheets, mirrors into contacts/activities, and emails the admin ONLY when
 * something new arrives. Cuts down the noise vs the daily summary cron.
 *
 * Auth: Vercel cron sends `Authorization: Bearer ${CRON_SECRET}` automatically.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (expected && authHeader !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncAllSources();
  const newCount = result.totalNewLeads;

  // Only ping admin when something actually arrived
  if (newCount > 0) {
    const adminTo = (process.env.ALLOWED_ADMIN_EMAILS ?? "")
      .split(",").map((s) => s.trim()).filter(Boolean)[0];

    if (adminTo) {
      const list = result.newLeads
        .slice(0, 10)
        .map((l) => `• ${l.full_name ?? "(без име)"} — ${l.email ?? l.phone ?? "—"}`)
        .join("\n");

      sendEmail({
        to: adminTo,
        subject: `🔥 ${newCount} нов${newCount === 1 ? "" : "и"} Meta lead${newCount === 1 ? "" : "а"} в CRM-а`,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#0d1221;">
<p><strong>Hourly sync · ${newCount} нов${newCount === 1 ? "" : "и"} lead${newCount === 1 ? "" : "а"}</strong></p>
<pre style="background:#f5f5f7;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;">${list}${newCount > 10 ? `\n... и още ${newCount - 10}` : ""}</pre>
<p>Записани са в CRM-а с source <code>meta_lead</code>.</p>
<p>📊 <a href="https://promarketing.pw/admin/clients">Виж в CRM-а</a></p>
</div>`,
        text: `Hourly sync · ${newCount} нов(и) lead(а):\n\n${list}\n\nCRM: https://promarketing.pw/admin/clients`,
      }).catch(() => {});
    }
  }

  return NextResponse.json({ ok: true, totalNewLeads: newCount, results: result.results, mirroredToContacts: result.mirroredToContacts });
}
