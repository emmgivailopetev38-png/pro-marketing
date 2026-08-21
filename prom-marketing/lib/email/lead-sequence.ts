import "server-only";
import { sendEmail } from "./resend";
import { escapeHtml } from "./escape";
import type { createServiceClient } from "@/lib/supabase/service";

type Sb = ReturnType<typeof createServiceClient>;

const SITE = "https://www.promarketing.pw";
const YT = "https://www.youtube.com/@promarketingbg";
const PHONE = "+359 877 399 963";

function replyTo(): string {
  return process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
}

/** Първо име, за да звучи като писано на ръка, а не като циркуляр. */
function firstName(full: string | null | undefined): string | null {
  const n = (full ?? "").trim().split(/\s+/)[0];
  if (!n || n.length < 2 || /^[^\p{L}]/u.test(n)) return null;
  return n;
}

function shell(bodyHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.65;color:#1d2320;max-width:580px">
${bodyHtml}
<p style="margin:20px 0 0;color:#4a5651">
<strong style="color:#1d2320">Ивайло Петев</strong><br>Pro Marketing LTD<br>
${PHONE} · <a href="${SITE}" style="color:#0b6b4a">promarketing.pw</a>
</p></div>`;
}

export interface SequenceStep {
  /** Стабилен ключ — по него се пази идемпотентността. */
  key: string;
  /** Дни след влизането на лийда. 0 = веднага. */
  afterDays: number;
  subject: string;
  build: (name: string | null) => { html: string; text: string };
}

/**
 * Продажбена последователност за лийд от реклама.
 *
 * Тонът е по правилото на Ивайло: приветствен, без самопринизяване, всеки
 * имейл води към услуга с конкретна следваща стъпка. Никакво „гоня",
 * никакви извинения, че пишем.
 */
export const LEAD_SEQUENCE: SequenceStep[] = [
  {
    key: "s1_lichno",
    afterDays: 0,
    subject: "Видях запитването ти — ето откъде бих започнал",
    build: (name) => {
      const hi = name ? `Здравей, ${escapeHtml(name)},` : "Здравей,";
      const hiT = name ? `Здравей, ${name},` : "Здравей,";
      return {
        html: shell(`<p>${hi}</p>
<p>Видях, че остави телефона си на нашата реклама за AI автоматизации. Радвам се — това обикновено значи, че някъде в деня ти има работа, която не би трябвало да я вършиш ти.</p>
<p>Обикновено е едно от три неща: запитвания, които се губят, оферти и документи на ръка, или едни и същи въпроси по цял ден. И трите се решават, при това по-бързо, отколкото повечето хора очакват.</p>
<p>Най-бързият начин да разбереш кое точно при теб си струва: <strong>20 минути разговор</strong>. Идвам с конкретно предложение, не с презентация.</p>
<p style="margin:22px 0"><a href="${SITE}/booking" style="display:inline-block;background:#0b6b4a;color:#fff;padding:12px 24px;border-radius:7px;text-decoration:none;font-weight:600">Запази 20 минути →</a></p>
<p style="color:#4a5651">Ако предпочиташ първо да видиш нещо: <a href="${SITE}/demo" style="color:#0b6b4a">живото демо на системата</a> · <a href="${YT}" style="color:#0b6b4a">каналът ми в YouTube</a></p>
<p>Отговори директно на този имейл, ако имаш въпрос — чета всичко лично.</p>`),
        text: `${hiT}

Видях, че остави телефона си на нашата реклама за AI автоматизации. Радвам се — това обикновено значи, че някъде в деня ти има работа, която не би трябвало да я вършиш ти.

Обикновено е едно от три неща: запитвания, които се губят, оферти и документи на ръка, или едни и същи въпроси по цял ден. И трите се решават, при това по-бързо, отколкото повечето хора очакват.

Най-бързият начин да разбереш кое точно при теб си струва: 20 минути разговор. Идвам с конкретно предложение, не с презентация.

Запази 20 минути: ${SITE}/booking

Ако предпочиташ първо да видиш нещо:
Живо демо: ${SITE}/demo
YouTube: ${YT}

Отговори на този имейл, ако имаш въпрос — чета всичко лично.

Ивайло Петев
Pro Marketing LTD
${PHONE} · promarketing.pw`,
      };
    },
  },
  {
    key: "s2_glas",
    afterDays: 2,
    subject: "Искаш ли да чуеш как звучи, когато AI вдига телефона?",
    build: (name) => {
      const hi = name ? `Здравей, ${escapeHtml(name)},` : "Здравей,";
      const hiT = name ? `Здравей, ${name},` : "Здравей,";
      return {
        html: shell(`<p>${hi}</p>
<p>Това е частта, която изненадва всички: гласовият агент.</p>
<p>Звъни на клиентите за потвърждение на час или поръчка, вдига, когато ти си зает, отговаря на въпроси и предлага допълнително. Говори почти като реален човек — повечето отсреща не разбират.</p>
<p>За студени обаждания върши същата работа: минава списъка, отсява кой има интерес, и на теб оставя само хората, които си струват. Ти говориш с петима готови, вместо с петдесет случайни.</p>
<p>Мога да ти го пусна на живо за две минути в разговор — чуваш го и решаваш.</p>
<p style="margin:22px 0"><a href="${SITE}/booking" style="display:inline-block;background:#0b6b4a;color:#fff;padding:12px 24px;border-radius:7px;text-decoration:none;font-weight:600">Чуй го на живо →</a></p>`),
        text: `${hiT}

Това е частта, която изненадва всички: гласовият агент.

Звъни на клиентите за потвърждение на час или поръчка, вдига, когато ти си зает, отговаря на въпроси и предлага допълнително. Говори почти като реален човек — повечето отсреща не разбират.

За студени обаждания върши същата работа: минава списъка, отсява кой има интерес, и на теб оставя само хората, които си струват. Ти говориш с петима готови, вместо с петдесет случайни.

Мога да ти го пусна на живо за две минути в разговор — чуваш го и решаваш.

Чуй го на живо: ${SITE}/booking

Ивайло Петев
Pro Marketing LTD
${PHONE} · promarketing.pw`,
      };
    },
  },
  {
    key: "s3_demota",
    afterDays: 5,
    subject: "Три демота, които можеш да разгледаш сам",
    build: (name) => {
      const hi = name ? `Здравей, ${escapeHtml(name)},` : "Здравей,";
      const hiT = name ? `Здравей, ${name},` : "Здравей,";
      return {
        html: shell(`<p>${hi}</p>
<p>Вместо да ти обяснявам, ето същите неща, които показвам на клиенти. Отварят се от браузъра, нищо не се инсталира:</p>
<ul style="padding-left:20px;margin:14px 0">
<li style="margin-bottom:8px"><a href="${SITE}/demo" style="color:#0b6b4a"><strong>Цялата система</strong></a> — как едно запитване минава от рекламата до подписан договор</li>
<li style="margin-bottom:8px"><a href="${SITE}/demo/influencer" style="color:#0b6b4a"><strong>За съдържание и инфлуенсъри</strong></a> — снимаш веднъж, публикува се навсякъде</li>
<li style="margin-bottom:8px"><a href="${SITE}/demo/shop" style="color:#0b6b4a"><strong>За онлайн магазин</strong></a> — поръчки, потвърждения и връщания без ръчна работа</li>
</ul>
<p>И ако ти се гледа нещо по-спокойно: <a href="${YT}" style="color:#0b6b4a">каналът ми в YouTube</a> — там разказвам как се строят тези неща.</p>
<p>Като видиш кое ти е най-близо, кажи ми и говорим само по него.</p>
<p style="margin:22px 0"><a href="${SITE}/booking" style="display:inline-block;background:#0b6b4a;color:#fff;padding:12px 24px;border-radius:7px;text-decoration:none;font-weight:600">Запази разговор →</a></p>`),
        text: `${hiT}

Вместо да ти обяснявам, ето същите неща, които показвам на клиенти. Отварят се от браузъра, нищо не се инсталира:

- Цялата система: ${SITE}/demo — как едно запитване минава от рекламата до подписан договор
- За съдържание и инфлуенсъри: ${SITE}/demo/influencer — снимаш веднъж, публикува се навсякъде
- За онлайн магазин: ${SITE}/demo/shop — поръчки, потвърждения и връщания без ръчна работа

И ако ти се гледа нещо по-спокойно: ${YT}

Като видиш кое ти е най-близо, кажи ми и говорим само по него.

Запази разговор: ${SITE}/booking

Ивайло Петев
Pro Marketing LTD
${PHONE} · promarketing.pw`,
      };
    },
  },
  {
    key: "s4_posledno",
    afterDays: 9,
    subject: "Да оставя ли вратата отворена?",
    build: (name) => {
      const hi = name ? `Здравей, ${escapeHtml(name)},` : "Здравей,";
      const hiT = name ? `Здравей, ${name},` : "Здравей,";
      return {
        html: shell(`<p>${hi}</p>
<p>Пиша ти за последно по този повод — не искам да съм поредната пощенска кутия, която трябва да чистиш.</p>
<p>Ако моментът не е сега, напълно разбираемо е. Оставям ти двете неща, които струват най-много, и толкова:</p>
<ul style="padding-left:20px;margin:14px 0">
<li style="margin-bottom:6px"><a href="${SITE}/automation-audit" style="color:#0b6b4a"><strong>Безплатен AI одит</strong></a> — казвам ти кои процеси при теб горят пари, дори да не работим заедно</li>
<li><a href="${SITE}/booking" style="color:#0b6b4a"><strong>20 минути разговор</strong></a>, когато решиш — часът стои отворен</li>
</ul>
<p>А ако сега е моментът, отговори с една дума и се заемам.</p>
<p style="color:#4a5651">Успех с бизнеса — и в двата случая.</p>`),
        text: `${hiT}

Пиша ти за последно по този повод — не искам да съм поредната пощенска кутия, която трябва да чистиш.

Ако моментът не е сега, напълно разбираемо е. Оставям ти двете неща, които струват най-много, и толкова:

- Безплатен AI одит: ${SITE}/automation-audit — казвам ти кои процеси при теб горят пари, дори да не работим заедно
- 20 минути разговор: ${SITE}/booking — часът стои отворен

А ако сега е моментът, отговори с една дума и се заемам.

Успех с бизнеса — и в двата случая.

Ивайло Петев
Pro Marketing LTD
${PHONE} · promarketing.pw`,
      };
    },
  },
];

/** Изпраща една стъпка. Идемпотентно по (contact_id, step.key). */
export async function sendSequenceStep(args: {
  supabase: Sb;
  contactId: string;
  to: string;
  fullName: string | null;
  step: SequenceStep;
}): Promise<{ sent: boolean; skipped?: string; error?: string }> {
  const { supabase, contactId, to, fullName, step } = args;

  const { data: already } = await supabase
    .from("contact_activities")
    .select("id")
    .eq("contact_id", contactId)
    .eq("activity_type", "email_sent")
    .contains("metadata", { seq_step: step.key })
    .maybeSingle();
  if (already) return { sent: false, skipped: "already_sent" };

  const { html, text } = step.build(firstName(fullName));
  const res = await sendEmail({ to, subject: step.subject, html, text, replyTo: replyTo() });

  if (res.error) {
    await supabase.from("contact_activities").insert({
      contact_id: contactId,
      activity_type: "note",
      title: `Имейлът от поредицата не тръгна (${step.key})`,
      body: res.error,
      metadata: { seq_step_failed: step.key },
      created_by: "lead_sequence",
    });
    return { sent: false, error: res.error };
  }

  await supabase.from("contact_activities").insert({
    contact_id: contactId,
    activity_type: "email_sent",
    title: `Поредица · ${step.subject}`,
    body: `Автоматичен продажбен имейл до ${to}. Отговорите отиват на ${replyTo()}.`,
    metadata: { seq_step: step.key, resend_id: res.id, to, auto: true },
    created_by: "lead_sequence",
  });
  return { sent: true };
}

/**
 * ПРЕДПАЗИТЕЛ: поредицата важи само за лийдове, влезли СЛЕД този момент.
 * Без него един деплой би изсипал продажбени имейли върху 163-те исторически
 * лийда, внесени на 21.08 — хора отпреди месеци, които не чакат нищо от нас.
 * Не се пипа назад във времето.
 */
const SEQUENCE_EPOCH = "2026-08-21T12:00:00+03:00";

/** Втори предпазител: нищо по-старо от 30 дни не влиза в поредица. */
const MAX_AGE_DAYS = 30;

/** Трети предпазител: таван на изпратените за едно пускане. */
const MAX_PER_RUN = 40;

interface SeqContact {
  id: string;
  full_name: string | null;
  email: string | null;
  stage: string;
  source: string;
  created_at: string;
  last_heard_from_at: string | null;
}

/**
 * Минава лийдовете и изпраща следващата дължима стъпка.
 *
 * Спира поредицата, ако човекът е реагирал по какъвто и да е начин: етапът е
 * мръднал напред, чули сме се с него, или има разговор/среща в картона.
 * Продажбен имейл до човек, който вече е вдигнал телефона, е по-скъп от
 * пропуснат имейл.
 */
export async function runLeadSequence(supabase: Sb): Promise<{
  checked: number;
  sent: number;
  skipped: number;
  details: Array<{ contact_id: string; step: string }>;
}> {
  const out = { checked: 0, sent: 0, skipped: 0, details: [] as Array<{ contact_id: string; step: string }> };
  if (process.env.LEAD_SEQUENCE_ENABLED === "false") return out;

  const epoch = new Date(SEQUENCE_EPOCH).toISOString();
  const oldest = new Date(Date.now() - MAX_AGE_DAYS * 86400_000).toISOString();
  const floor = epoch > oldest ? epoch : oldest;

  const { data: rows } = await supabase
    .from("contacts")
    .select("id, full_name, email, stage, source, created_at, last_heard_from_at")
    .in("source", ["meta_lead", "website_form"])
    .in("stage", ["lead", "contacted"])
    .not("email", "is", null)
    .gte("created_at", floor)
    .order("created_at", { ascending: true })
    .limit(200);

  const contacts = (rows ?? []) as SeqContact[];
  if (contacts.length === 0) return out;

  // Кой вече е говорил с нас — при него поредицата спира.
  const ids = contacts.map((c) => c.id);
  const { data: touches } = await supabase
    .from("contact_activities")
    .select("contact_id")
    .in("contact_id", ids)
    .in("activity_type", ["call", "meeting"]);
  const talked = new Set((touches ?? []).map((t) => t.contact_id));

  const now = Date.now();
  for (const c of contacts) {
    if (out.sent >= MAX_PER_RUN) break;
    out.checked++;

    if (c.last_heard_from_at || talked.has(c.id) || !c.email) {
      out.skipped++;
      continue;
    }

    const ageDays = (now - new Date(c.created_at).getTime()) / 86400_000;
    // Последната стъпка, чийто срок е настъпил.
    const due = [...LEAD_SEQUENCE].reverse().find((s) => ageDays >= s.afterDays);
    if (!due) {
      out.skipped++;
      continue;
    }

    const res = await sendSequenceStep({
      supabase,
      contactId: c.id,
      to: c.email,
      fullName: c.full_name,
      step: due,
    });
    if (res.sent) {
      out.sent++;
      out.details.push({ contact_id: c.id, step: due.key });
    } else {
      out.skipped++;
    }
  }

  return out;
}
