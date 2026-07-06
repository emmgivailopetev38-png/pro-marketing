import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/resend";
import { escapeHtml } from "@/lib/email/escape";
import { WEBINAR, GIFT, OFFERS, webinarDateLabel } from "@/lib/webinar/config";

/**
 * Webinar Flow — date-triggered автоматизации.
 *
 * Задаваш дата в lib/webinar/config.ts → cron-ът (/api/cron/webinar-flow)
 * започва сам да изпълнява стъпките спрямо датата. Нула ръчна работа.
 *
 * Всяка стъпка има прозорец [времето ѝ → sendUntil]: така късно записалите
 * се НЕ получават стари напомняния, а ако cron-ът пропусне час, стъпката
 * пак се изпраща при следващото завъртане (докато прозорецът е отворен).
 * Дедуп: една activity `webinar_email_{stage}` на контакт = един имейл.
 */

const SITE = "https://promarketing.pw";
const MIN = 60_000;

export interface FlowStage {
  id: string;
  /** Минути спрямо старта на уебинара (отрицателно = преди). */
  offsetMinutes: number;
  /** До кога стъпката е валидна (минути спрямо старта). */
  sendUntilMinutes: number;
  subject: string;
  html: (name: string) => string;
  text: (name: string) => string;
}

/**
 * Линкът за влизане се разкрива САМО в стъпката 1 час преди старта —
 * така никой не влиза дни по-рано. Всички по-ранни стъпки казват кога идва.
 */
function zoomJoin(): { html: string; text: string } {
  if (WEBINAR.zoomJoinUrl) {
    return {
      html: `<p>🔗 Влизаш от тук: <a href="${WEBINAR.zoomJoinUrl}"><strong>${WEBINAR.zoomJoinUrl}</strong></a><br/><em>Линкът работи от началния час — има чакалня, пускаме всички точно в началото.</em></p>`,
      text: `Zoom линк: ${WEBINAR.zoomJoinUrl} (работи от началния час, има чакалня)`,
    };
  }
  return {
    html: `<p>🔗 Zoom линкът пристига в отделен имейл точно преди старта.</p>`,
    text: "Zoom линкът пристига в отделен имейл точно преди старта.",
  };
}

const zoomComing = {
  html: `<p>🔗 Zoom линкът пристига на този имейл <strong>1 час преди старта</strong> — пази пощата си.</p>`,
  text: "Zoom линкът пристига на този имейл 1 час преди старта.",
};

function wrap(inner: string): string {
  return `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.65;color:#0d1221;max-width:560px;">${inner}
<p style="margin-top:24px;">${escapeHtml(WEBINAR.host.name)}<br/><span style="color:#667;">${escapeHtml(WEBINAR.host.role)}</span></p></div>`;
}

export function buildStages(): FlowStage[] {
  const date = webinarDateLabel() ?? "";
  const zoom = zoomJoin();
  const c = OFFERS.course;

  return [
    {
      id: "reminder_3d",
      offsetMinutes: -3 * 24 * 60,
      sendUntilMinutes: -1 * 24 * 60,
      subject: `След 3 дни: ${WEBINAR.title} — ето какво ще видиш`,
      html: (name) =>
        wrap(`<p>Здравей, ${escapeHtml(name)},</p>
<p>След 3 дни — <strong>${escapeHtml(date)}</strong> — се виждаме на живо в Zoom за „${WEBINAR.title}”.</p>
<p>Ще минем през 4 системи, показани отвътре:</p>
<ul>${WEBINAR.secrets.map((s) => `<li><strong>${escapeHtml(s.title)}</strong></li>`).join("")}</ul>
<p>💡 Дотогава: отвори подаръка си „${GIFT.title}” и мини през Ден 1 — така на обучението ще ти е в пъти по-полезно. <a href="${SITE}${GIFT.pdfPath}">Свали го пак от тук</a>.</p>
${zoomComing.html}`),
      text: (name) =>
        `Здравей, ${name},\n\nСлед 3 дни — ${date} — се виждаме на живо в Zoom за „${WEBINAR.title}”.\n\nДотогава: мини през Ден 1 от подаръка „${GIFT.title}”: ${SITE}${GIFT.pdfPath}\n${zoomComing.text}`,
    },
    {
      id: "reminder_1d",
      offsetMinutes: -24 * 60,
      sendUntilMinutes: -3 * 60,
      subject: `Утре в ${date.split(" ").slice(-1)[0] || "19:00"}: ${WEBINAR.title} (запази си мястото в календара)`,
      html: (name) =>
        wrap(`<p>Здравей, ${escapeHtml(name)},</p>
<p><strong>Утре е!</strong> ${escapeHtml(date)} — на живо в Zoom, ${WEBINAR.durationMinutes} минути.</p>
<p>Запиши си го в календара сега — бонусите в края (стойност 540+ €) са само за присъстващите на живо, включително безплатният AI одит на твоя бизнес.</p>
${zoomComing.html}
<p>До утре!</p>`),
      text: (name) =>
        `Здравей, ${name},\n\nУтре е! ${date} — на живо в Zoom, ${WEBINAR.durationMinutes} минути.\nБонусите в края са само за присъстващите на живо.\n${zoomComing.text}\n\nДо утре!`,
    },
    {
      id: "reminder_dayof",
      offsetMinutes: -9 * 60,
      sendUntilMinutes: -2 * 60,
      subject: `🔥 ДНЕС в ${date.split(" ").slice(-1)[0] || "19:00"} ч. — ${WEBINAR.title}`,
      html: (name) =>
        wrap(`<p>Здравей, ${escapeHtml(name)},</p>
<p><strong>Днес е денят!</strong> Започваме точно в ${escapeHtml(date.split(" ").slice(-1)[0] || "19:00")} ч. — ${WEBINAR.durationMinutes} минути на живo, 4 системи отвътре, бонуси за 540+ € в края.</p>
<p>✅ Приготви си: тихо място, зареден лаптоп/телефон, нещо за писане.</p>
${zoomComing.html}
<p>До довечера!</p>`),
      text: (name) =>
        `Здравей, ${name},\n\nДнес е денят! Започваме точно в ${date.split(" ").slice(-1)[0] || "19:00"} ч.\nПриготви си тихо място и нещо за писане.\n${zoomComing.text}\n\nДо довечера!`,
    },
    {
      id: "reminder_1h",
      offsetMinutes: -60,
      sendUntilMinutes: 30,
      subject: `🔴 Започваме след 1 час — ${WEBINAR.title}`,
      html: (name) =>
        wrap(`<p>Здравей, ${escapeHtml(name)},</p>
<p><strong>Започваме след 1 час.</strong> Вземи си кафе, отвори лаптопа (или телефона) и влез 5 минути по-рано.</p>
${zoom.html}
<p>До след малко! 👋</p>`),
      text: (name) => `Здравей, ${name},\n\nЗапочваме след 1 час!\n${zoom.text}\n\nДо след малко!`,
    },
    {
      id: "followup_offer",
      offsetMinutes: 3 * 60,
      sendUntilMinutes: 24 * 60,
      subject: `🎁 Офертите от обучението: курсът за ${c.webinarPriceEur} € + пълното ниво с −30% (48 часа)`,
      html: (name) =>
        wrap(`<p>Здравей, ${escapeHtml(name)},</p>
<p>Благодаря, че беше на „${WEBINAR.title}”! (А ако не успя — ето най-важното от края.)</p>
<p>Само за участници, валидно <strong>48 часа</strong>:</p>
<div style="margin:16px 0;padding:16px 18px;border:2px solid #06b6d4;border-radius:12px;background:#f0fdff;">
<p style="margin:0;"><strong>Ниво 1 · „${c.name}”</strong> — 30-дневният курс с всички шаблони<br/>
<span style="color:#889;text-decoration:line-through;">${c.priceEur} €</span> <strong style="font-size:19px;">${c.webinarPriceEur} €</strong></p>
</div>
<div style="margin:16px 0;padding:16px 18px;border:2px solid #f59e0b;border-radius:12px;background:#fffbeb;">
<p style="margin:0;"><strong>Ниво 2 · Пълното ниво</strong> — курсът + 16 лични 1-на-1 сесии с мен (4 месеца)<br/>
<span style="color:#889;text-decoration:line-through;">${OFFERS.mentorship.priceEur} €</span> <strong style="font-size:19px;">${OFFERS.mentorship.webinarPriceEur} €</strong> <span style="color:#0a7a4b;font-weight:bold;">(−30%, спестяваш ${OFFERS.mentorship.priceEur - OFFERS.mentorship.webinarPriceEur} €)</span></p>
</div>
<p><a href="${SITE}/webinar/oferta" style="display:inline-block;background:#06b6d4;color:#03121a;font-weight:bold;padding:12px 26px;border-radius:999px;text-decoration:none;">Виж офертите и избери нивото си →</a></p>
<p style="color:#667;font-size:13px;">14-дневна гаранция „връщане на парите” и за двете нива. Бонусите от уебинара са включени.</p>`),
      text: (name) =>
        `Здравей, ${name},\n\nБлагодаря, че беше на „${WEBINAR.title}”! Офертите за участници (48 часа):\n\nНиво 1 · Курсът „${c.name}”: ${c.webinarPriceEur} € (вместо ${c.priceEur} €)\nНиво 2 · Пълното ниво (курс + 16 лични сесии 1-на-1): ${OFFERS.mentorship.webinarPriceEur} € (вместо ${OFFERS.mentorship.priceEur} €, −30%)\n\nИзбери тук: ${SITE}/webinar/oferta\n\n14-дневна гаранция и за двете.`,
    },
    {
      id: "lastchance_24h",
      offsetMinutes: 27 * 60,
      sendUntilMinutes: 48 * 60,
      subject: `⏳ Последни часове: −30% на пълното ниво и курсът за ${c.webinarPriceEur} €`,
      html: (name) =>
        wrap(`<p>Здравей, ${escapeHtml(name)},</p>
<p>Кратко напомняне — уебинар цените изтичат довечера:</p>
<p>• Курсът „${c.name}”: <strong>${c.webinarPriceEur} €</strong> (вместо ${c.priceEur} €)<br/>
• Пълното ниво (курс + 16 лични сесии 1-на-1): <strong>${OFFERS.mentorship.webinarPriceEur} €</strong> (вместо ${OFFERS.mentorship.priceEur} €, −30%)</p>
<p>Ако на обучението си каза „това ми трябва” — сега е моментът:</p>
<p><a href="${SITE}/webinar/oferta" style="display:inline-block;background:#f59e0b;color:#3d2a00;font-weight:bold;padding:12px 26px;border-radius:999px;text-decoration:none;">Хващам офертата преди края →</a></p>
<p>Въпрос преди това? Просто отговори на този имейл — аз чета отговорите.</p>`),
      text: (name) =>
        `Здравей, ${name},\n\nУебинар цените изтичат довечера:\n• Курсът: ${c.webinarPriceEur} € (вместо ${c.priceEur} €)\n• Пълното ниво (курс + менторство 1-на-1): ${OFFERS.mentorship.webinarPriceEur} € (вместо ${OFFERS.mentorship.priceEur} €, −30%)\n\n${SITE}/webinar/oferta\n\nВъпрос? Отговори на този имейл.`,
    },
  ];
}

export interface FlowRunResult {
  ran: boolean;
  reason?: string;
  stagesActive: string[];
  sent: Array<{ stage: string; count: number }>;
  errors: string[];
}

/** Едно завъртане на flow-а. Викa се от cron-а (или ръчно). */
export async function runWebinarFlow(now = new Date()): Promise<FlowRunResult> {
  if (!WEBINAR.dateISO) {
    return { ran: false, reason: "Няма зададена дата (lib/webinar/config.ts → dateISO)", stagesActive: [], sent: [], errors: [] };
  }
  const start = new Date(WEBINAR.dateISO).getTime();
  const stages = buildStages().filter((s) => {
    const opens = start + s.offsetMinutes * MIN;
    const closes = start + s.sendUntilMinutes * MIN;
    return now.getTime() >= opens && now.getTime() <= closes;
  });
  if (stages.length === 0) {
    return { ran: true, reason: "Няма активни стъпки в този час", stagesActive: [], sent: [], errors: [] };
  }

  const supabase = createServiceClient();
  const errors: string[] = [];

  // Всички записани за уебинара (activity-то се пише при регистрация).
  const { data: regs, error: regsErr } = await supabase
    .from("contact_activities")
    .select("contact_id")
    .eq("activity_type", "webinar_registration");
  if (regsErr) {
    return { ran: true, stagesActive: stages.map((s) => s.id), sent: [], errors: [regsErr.message] };
  }
  const contactIds = [...new Set((regs ?? []).map((r) => r.contact_id).filter(Boolean))];
  if (contactIds.length === 0) {
    return { ran: true, reason: "Няма записани участници", stagesActive: stages.map((s) => s.id), sent: [], errors: [] };
  }

  const { data: contacts } = await supabase
    .from("contacts")
    .select("id, full_name, email")
    .in("id", contactIds);
  const recipients = (contacts ?? []).filter((c) => c.email);

  const sent: Array<{ stage: string; count: number }> = [];
  for (const stage of stages) {
    // Дедуп: кой вече е получил тази стъпка.
    const { data: already } = await supabase
      .from("contact_activities")
      .select("contact_id")
      .eq("activity_type", `webinar_email_${stage.id}`)
      .in("contact_id", contactIds);
    const alreadySet = new Set((already ?? []).map((a) => a.contact_id));

    let count = 0;
    for (const r of recipients) {
      if (alreadySet.has(r.id)) continue;
      const name = r.full_name || "приятелю";
      const { error } = await sendEmail({
        to: r.email!,
        subject: stage.subject,
        html: stage.html(name),
        text: stage.text(name),
      });
      if (error) {
        errors.push(`${stage.id} → ${r.email}: ${error}`);
        continue; // без activity → ще опита пак на следващото завъртане
      }
      await supabase.from("contact_activities").insert({
        contact_id: r.id,
        activity_type: `webinar_email_${stage.id}`,
        title: `📧 Webinar Flow: ${stage.subject}`,
        created_by: "webinar_flow",
        metadata: { stage: stage.id, webinar: WEBINAR.title },
      });
      count++;
    }
    sent.push({ stage: stage.id, count });
  }

  return { ran: true, stagesActive: stages.map((s) => s.id), sent, errors };
}
