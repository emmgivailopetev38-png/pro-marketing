import { format } from "date-fns";
import { bg } from "date-fns/locale";
import type { NormalizedLead } from "@/lib/leads/import";

interface Args {
  leads: NormalizedLead[];
  totalLast24h: number;
  totalLast7d: number;
  syncErrors: string[];
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderDailyLeadsEmail(args: Args): { subject: string; html: string; text: string } {
  const today = format(new Date(), "d MMMM yyyy", { locale: bg });
  const count = args.leads.length;

  const subject =
    count > 0
      ? `🎯 ${count} ${count === 1 ? "нов лийд" : "нови лийда"} от Meta — ${today}`
      : `Meta лийдове — ${today} (без нови)`;

  const leadRows = args.leads
    .slice(0, 50)
    .map(
      (l) => `
      <tr>
        <td style="padding:12px 14px;border-bottom:1px solid #1f2540;color:#f5f7ff">
          <strong>${escapeHtml(l.full_name) || "—"}</strong><br>
          <span style="font-size:12px;color:#a0a8c0">${escapeHtml(l.email) || ""}</span>
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid #1f2540;color:#a0a8c0;font-size:13px">
          ${escapeHtml(l.phone) || "—"}
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid #1f2540;color:#a0a8c0;font-size:13px">
          ${escapeHtml(l.form_name || l.campaign_name) || "—"}
        </td>
      </tr>`
    )
    .join("");

  const errorBlock = args.syncErrors.length
    ? `<div style="margin:20px 0;padding:14px;background:#3d1f25;border-left:3px solid #ef4444;border-radius:6px;color:#fecaca">
        <strong>Грешки при синхронизация:</strong><br>
        ${args.syncErrors.map((e) => escapeHtml(e)).join("<br>")}
      </div>`
    : "";

  const html = `<!doctype html>
<html lang="bg">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:32px 16px;background:#030308;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#0a0a1f;border-radius:14px;overflow:hidden;border:1px solid rgba(124,58,237,0.18)">
    <tr><td style="padding:28px 32px 8px">
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#06b6d4;font-family:ui-monospace,SFMono-Regular,monospace">// daily lead report</div>
      <h1 style="margin:8px 0 0;font-size:28px;color:#f5f7ff;font-weight:700;letter-spacing:-0.01em">
        ${count > 0 ? `${count} нови лийда` : "Без нови лийдове"}
      </h1>
      <p style="margin:6px 0 0;color:#a0a8c0;font-size:14px">${today} · ProMarketing LTD</p>
    </td></tr>

    <tr><td style="padding:8px 32px 0">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-top:20px">
        <tr>
          <td style="padding:14px;background:rgba(6,182,212,0.08);border-radius:10px;text-align:center;width:33%">
            <div style="font-size:24px;color:#06b6d4;font-weight:700">${count}</div>
            <div style="font-size:11px;color:#a0a8c0;text-transform:uppercase;letter-spacing:1px">Днес</div>
          </td>
          <td style="width:4%"></td>
          <td style="padding:14px;background:rgba(124,58,237,0.08);border-radius:10px;text-align:center;width:33%">
            <div style="font-size:24px;color:#7c3aed;font-weight:700">${args.totalLast7d}</div>
            <div style="font-size:11px;color:#a0a8c0;text-transform:uppercase;letter-spacing:1px">7 дни</div>
          </td>
          <td style="width:4%"></td>
          <td style="padding:14px;background:rgba(236,72,153,0.08);border-radius:10px;text-align:center;width:33%">
            <div style="font-size:24px;color:#ec4899;font-weight:700">${args.totalLast24h}</div>
            <div style="font-size:11px;color:#a0a8c0;text-transform:uppercase;letter-spacing:1px">24 часа</div>
          </td>
        </tr>
      </table>
    </td></tr>

    ${errorBlock ? `<tr><td style="padding:0 32px">${errorBlock}</td></tr>` : ""}

    ${count > 0
      ? `<tr><td style="padding:24px 32px 8px">
          <h2 style="margin:0 0 12px;font-size:15px;color:#f5f7ff;text-transform:uppercase;letter-spacing:2px;font-weight:600">
            Нови лийдове
          </h2>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">
            ${leadRows}
          </table>
          ${count > 50 ? `<p style="margin:16px 0 0;color:#a0a8c0;font-size:13px">…и още ${count - 50} лийда. Всички в админ панела.</p>` : ""}
        </td></tr>`
      : `<tr><td style="padding:24px 32px;color:#a0a8c0;font-size:14px">
          Няма нови лийдове за последните 24 часа. Системата синхронизира успешно — ще те уведомим веднага щом дойдат нови.
        </td></tr>`
    }

    <tr><td style="padding:24px 32px;background:rgba(6,182,212,0.04);border-top:1px solid rgba(124,58,237,0.15)">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? "https://pro-marketing-eight.vercel.app"}/admin/leads"
         style="display:inline-block;padding:12px 22px;background:#06b6d4;color:#030308;text-decoration:none;border-radius:999px;font-weight:600;font-size:14px">
        Виж всичко в админ →
      </a>
    </td></tr>

    <tr><td style="padding:16px 32px;color:#4a5070;font-size:11px;background:#030308">
      ProMarketing LTD · автоматичен дневен отчет · ${today}
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${subject}\n\n${count} нови лийда днес.\n\n${args.leads
    .map((l) => `• ${l.full_name ?? "—"} (${l.email ?? ""}) ${l.phone ?? ""} — ${l.form_name ?? ""}`)
    .join("\n")}\n\nВиж всичко: ${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads`;

  return { subject, html, text };
}
