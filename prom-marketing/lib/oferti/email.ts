/** Имейлът, с който тръгва офертата — PDF прикачен + линкът, отговорът стига до продавача и Ивайло. */
import { escapeHtml } from "@/lib/text/escape";
import { IVAILO_EMAIL } from "./katalog";
import { fmtEur } from "./smetki";
import type { OfferView } from "./view";

export interface OfferEmail {
  subject: string;
  html: string;
  text: string;
  replyTo: string[];
}

function paragraphs(text: string): string {
  return text
    .trim()
    .split(/\n\s*\n/)
    .map((p) => `<p style="margin:0 0 14px">${escapeHtml(p.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function offerEmail(v: OfferView, opts: { subject?: string; text?: string } = {}): OfferEmail {
  const { seller, content } = v;
  const who = v.clientCompany || v.clientName || "теб";
  const subject = (opts.subject ?? "").trim() || `Оферта за ${who} — ${v.offer.title} · ProMarketing`;
  const intro = (opts.text ?? "").trim() || content.intro || `Благодаря за разговора. Ето какво предлагаме за ${who} — накратко, както говорихме.`;
  const rows = v.offer.items.map((i) => {
    const setup = i.setup_price ? ` + ${fmtEur(i.setup_price)} ${i.setup_label ?? "внедряване"}` : "";
    return { title: i.title, price: `${fmtEur(i.price)} ${i.unit}${setup}` };
  });
  const tot: string[] = [];
  if (v.totals.one_time_after > 0) tot.push(`${fmtEur(v.totals.one_time_after)} еднократно`);
  if (v.totals.monthly_after > 0) tot.push(`${fmtEur(v.totals.monthly_after)} на месец`);
  const totalLine = tot.join(" + ");
  const replyWho = seller.key === "ivailo" ? "стига направо до мен" : `стига до ${seller.first} и до Ивайло`;
  const nextStep = content.next_steps[0] ? content.next_steps[0] : "Казваш „да“ — с отговор на този имейл или по телефона.";

  const text = [
    v.greeting,
    "",
    intro,
    "",
    `Офертата е прикачена като PDF и е тук: ${v.url}`,
    "",
    ...rows.map((r) => `- ${r.title} — ${r.price}`),
    totalLine ? `Общо: ${totalLine}${v.totals.discount > 0 ? ` (с отстъпка ${fmtEur(v.totals.discount)})` : ""}. ${v.vatLine}` : "",
    v.hasInstallments ? `На вноски през TBI Bank: ${v.installmentLines.map((l) => l.line).join(" / ")} на месец.` : "",
    "",
    content.outcome ? `${content.outcome}\n` : "",
    `Следващата стъпка: ${nextStep}`,
    `Офертата е валидна до ${v.validUntil}.`,
    "",
    `Отговорете направо на този имейл — ${replyWho}.`,
    "",
    `${seller.name} · ${seller.role}`,
    `${seller.phone}`,
    "promarketing.pw · petevai.com",
  ]
    .filter((l) => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#1d2320;max-width:640px">
<p style="margin:0 0 14px"><strong>${escapeHtml(v.greeting)}</strong></p>
${paragraphs(intro)}
<p style="margin:0 0 14px">Офертата е прикачена като PDF и е тук: <a href="${v.url}" style="color:#0e7490">${escapeHtml(v.url.replace(/^https?:\/\//, ""))}</a></p>
<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 14px;width:100%">
${rows
  .map(
    (r) =>
      `<tr><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb">${escapeHtml(r.title)}</td><td style="padding:8px 10px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap"><strong>${escapeHtml(r.price)}</strong></td></tr>`
  )
  .join("")}
${totalLine ? `<tr><td style="padding:10px;font-weight:700">Общо</td><td style="padding:10px;text-align:right;font-weight:700;white-space:nowrap">${escapeHtml(totalLine)}</td></tr>` : ""}
</table>
${v.totals.discount > 0 ? `<p style="margin:0 0 6px;color:#475569">С отстъпка ${escapeHtml(fmtEur(v.totals.discount))}${v.offer.discount_note ? ` — ${escapeHtml(v.offer.discount_note)}` : ""}.</p>` : ""}
${v.vatLine ? `<p style="margin:0 0 6px;color:#475569">${escapeHtml(v.vatLine)}</p>` : ""}
${v.hasInstallments ? `<p style="margin:0 0 14px;color:#475569">На вноски през TBI Bank: ${escapeHtml(v.installmentLines.map((l) => l.line).join(" / "))} на месец.</p>` : ""}
${content.outcome ? `<p style="margin:14px 0;padding:12px 14px;background:#ecfeff;border-left:3px solid #06b6d4">${escapeHtml(content.outcome)}</p>` : ""}
<p style="margin:0 0 6px"><strong>Следващата стъпка:</strong> ${escapeHtml(nextStep)}</p>
<p style="margin:0 0 18px;color:#475569">Офертата е валидна до ${escapeHtml(v.validUntil)}.</p>
<p style="margin:18px 0 0;color:#1d2320"><strong>Отговорете направо на този имейл</strong> — ${escapeHtml(replyWho)}.</p>
<p style="margin:14px 0 0">${escapeHtml(seller.name)} · ${escapeHtml(seller.role)}<br>${escapeHtml(seller.phone)}<br>🌐 <a href="https://promarketing.pw" style="color:#0b6b4a">promarketing.pw</a> · <a href="https://petevai.com" style="color:#0b6b4a">petevai.com</a></p>
</div>`;

  const replyTo = Array.from(new Set([seller.email, IVAILO_EMAIL].map((s) => s.toLowerCase())));
  return { subject, html, text, replyTo };
}
