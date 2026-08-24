import "server-only";
import { sendEmail } from "./resend";
import { escapeHtml } from "./escape";
import type { createServiceClient } from "@/lib/supabase/service";

type Sb = ReturnType<typeof createServiceClient>;

const SITE = "https://www.promarketing.pw";
const YT = "https://www.youtube.com/@promarketingbg";
const PHONE = "+359 877 399 963";

/**
 * Браншовите демота (`app/demo/<slug>`), подредени така, както лийдовете ни идват:
 * първо фирмите и производството, магазинът и личният бранд накрая.
 *
 * Държи се тук, а не се внася от `app/demo/vertical-demo.tsx`, защото онзи файл е
 * "use client" React компонент — внасянето му в имейл модула дърпа цялото демо в
 * сървърния бъндъл. Ако се добави нов бранш там, добавя се и един ред тук.
 */
const VERTICAL_DEMOS: { slug: string; label: string; line: string }[] = [
  { slug: "b2b", label: "B2B и фирми", line: "CRM, оферти, фактури и проекти, свързани в едно" },
  { slug: "proizvodstvo", label: "Производство и цех", line: "поръчки, машини, склад и качество в реално време" },
  { slug: "transport", label: "Транспорт и логистика", line: "курсове, шофьори и документи на едно място" },
  { slug: "schetovodstvo", label: "Счетоводство", line: "фактури, ДДС, банка и заплати вървят по график" },
  { slug: "dokumenti", label: "Документи и архив", line: "сканираш веднъж, а системата подрежда и напомня" },
  { slug: "ohrana", label: "Видеонаблюдение и охрана", line: "камери, достъп и аларми на едно табло" },
  { slug: "reciklirane", label: "Рециклиране и отпадъци", line: "всяка партида проследима от контейнера до везната" },
  { slug: "shop", label: "Онлайн магазин", line: "реклами, поръчки и отговори без да висиш на телефона" },
  { slug: "influencer", label: "Инфлуенсър и личен бранд", line: "съдържанието се пише и пуска, докато ти твориш" },
];


function replyTo(): string {
  return process.env.EMAIL_REPLY_TO || "emmgivailopetev38@gmail.com";
}

/** Първо име, за да звучи като писано на ръка, а не като циркуляр. */
function firstName(full: string | null | undefined): string | null {
  const n = (full ?? "").trim().split(/\s+/)[0];
  if (!n || n.length < 2 || /^[^\p{L}]/u.test(n)) return null;
  return n;
}

/**
 * Подписът под всеки имейл.
 *
 * Носи ВСИЧКИ начини да се стигне до Ивайло, защото най-скъпият момент е онзи,
 * в който човекът иска да се обади, а трябва да търси телефона някъде назад.
 * Отговорът на самия имейл е сложен най-отгоре — той е най-лесното нещо.
 */
function signature(): string {
  return `<div style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e3e8e5">
<p style="margin:0 0 10px"><strong style="color:#1d2320">Ивайло Петев</strong> · Pro Marketing LTD</p>
<p style="margin:0 0 6px;color:#31413a">Искаш да се чуем веднага? <strong>Просто отговори на този имейл</strong> — идва право при мен и чета всичко лично.</p>
<p style="margin:0 0 6px;color:#31413a">Или ми звънни: <a href="tel:+359877399963" style="color:#0b6b4a;font-weight:600">${PHONE}</a></p>
<p style="margin:10px 0 0;color:#4a5651;font-size:14px">
<a href="${SITE}" style="color:#0b6b4a">promarketing.pw</a> ·
<a href="${SITE}/demo" style="color:#0b6b4a">живото демо</a> ·
<a href="${SITE}/booking" style="color:#0b6b4a">запази 20 минути</a> ·
<a href="${SITE}/automation-audit" style="color:#0b6b4a">безплатен AI одит</a> ·
<a href="${YT}" style="color:#0b6b4a">YouTube</a>
</p></div>`;
}

/** Същият подпис, но за текстовата версия. */
const SIGNATURE_TEXT = `—
Ивайло Петев · Pro Marketing LTD

Искаш да се чуем веднага? Просто отговори на този имейл — идва право при мен и чета всичко лично.
Или ми звънни: ${PHONE}

Сайт: ${SITE}
Живо демо: ${SITE}/demo
Запази 20 минути: ${SITE}/booking
Безплатен AI одит: ${SITE}/automation-audit
YouTube: ${YT}`;

function shell(bodyHtml: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1d2320;max-width:580px">
${bodyHtml}
${signature()}
</div>`;
}

/**
 * Контекст за построяване на един имейл от поредицата.
 */
export interface BuildCtx {
  contactId?: string;
}

/**
 * Личен линк към демото.
 *
 * Демото е публична страница и стои в менюто на сайта — ключът не го крие,
 * а прави линка НЕГОВ: в аналитиката се вижда кой лийд е влизал, така че
 * следващият разговор започва от конкретното, а не отначало. Затова и в
 * текста не се обещава, че никой друг няма достъп.
 */
function demoLink(ctx?: BuildCtx): string {
  const k = (ctx?.contactId ?? "").split("-")[0];
  return k ? `${SITE}/demo?k=${k}` : `${SITE}/demo`;
}

export interface SequenceStep {
  /** Стабилен ключ — по него се пази идемпотентността. */
  key: string;
  /** Дни след влизането на лийда. 0 = веднага. */
  afterDays: number;
  subject: string;
  build: (name: string | null, ctx?: BuildCtx) => { html: string; text: string };
}

/**
 * Продажбена последователност за лийд от реклама.
 *
 * Тонът е по правилото на Ивайло: така, както приятел ти показва нещо готино,
 * без напрежение и без официалщина. Никакво „гоня", никакви извинения, че
 * пишем, никакво самопринизяване. Всеки имейл води към услуга с конкретна
 * следваща стъпка и носи всички контакти — човекът никога не трябва да търси
 * как да се свърже.
 */
export const LEAD_SEQUENCE: SequenceStep[] = [
  {
    key: "s1_lichno",
    afterDays: 0,
    subject: "Ето ти демотата — включително за твоя бранш",
    build: (name, ctx) => {
      const hi = name ? `Здравей, ${escapeHtml(name)},` : "Здравей,";
      const hiT = name ? `Здравей, ${name},` : "Здравей,";
      const demo = demoLink(ctx);
      const rows = VERTICAL_DEMOS.map(
        (d) =>
          `<li style="margin-bottom:9px"><a href="${SITE}/demo/${d.slug}" style="color:#0b6b4a;font-weight:600">${d.label}</a> <span style="color:#4a5651">— ${d.line}</span></li>`
      ).join("\n");
      const rowsText = VERTICAL_DEMOS.map(
        (d) => `• ${d.label} — ${d.line}\n  ${SITE}/demo/${d.slug}`
      ).join("\n");
      return {
        html: shell(`<p>${hi}</p>
<p>Видях, че остави телефона си на рекламата ни. Радвам се — и вместо да ти пиша три страници какво правим, ще ти го покажа.</p>
<p>Всичко се отваря от браузъра. Нищо не се инсталира, нищо не се попълва — просто влизаш и си играеш.</p>
<p><strong>Започни от голямото:</strong> цялата система на едно място, с 16 агента, които работят едновременно — хващат запитванията, отговарят, сглобяват офертите и фактурите, пускат рекламите и съдържанието, а ти управляваш всичко с глас.</p>
<p style="margin:22px 0"><a href="${demo}" style="display:inline-block;background:#0b6b4a;color:#fff;padding:14px 28px;border-radius:7px;text-decoration:none;font-weight:600;font-size:16px">Отвори голямото демо →</a></p>
<p style="color:#4a5651;margin-top:-8px;font-size:14px">Линкът е твой — по него виждам, че си влизал, и като се чуем, започваме от конкретното вместо отначало.</p>
<p style="margin-top:24px"><strong>А ако искаш направо твоето:</strong> направихме отделно демо за девет бранша. Отвори онова, което ти е най-близо:</p>
<ul style="padding-left:20px;margin:14px 0">
${rows}
</ul>
<p>Разгледай ги спокойно, няма бързане. И като видиш нещо, което ти е точно по темата — кажи ми и говорим само по него.</p>`),
        text: `${hiT}

Видях, че остави телефона си на рекламата ни. Радвам се — и вместо да ти пиша три страници какво правим, ще ти го покажа.

Всичко се отваря от браузъра. Нищо не се инсталира, нищо не се попълва — просто влизаш и си играеш.

ЗАПОЧНИ ОТ ГОЛЯМОТО: цялата система на едно място, с 16 агента, които работят едновременно — хващат запитванията, отговарят, сглобяват офертите и фактурите, пускат рекламите и съдържанието, а ти управляваш всичко с глас.

${demo}

Линкът е твой — по него виждам, че си влизал, и като се чуем, започваме от конкретното вместо отначало.

А АКО ИСКАШ НАПРАВО ТВОЕТО: направихме отделно демо за девет бранша. Отвори онова, което ти е най-близо:

${rowsText}

Разгледай ги спокойно, няма бързане. И като видиш нещо, което ти е точно по темата — кажи ми и говорим само по него.

${SIGNATURE_TEXT}`,
      };
    },
  },
  {
    key: "s2_glas",
    afterDays: 2,
    subject: "Чуй как звучи, когато AI вдига телефона",
    build: (name) => {
      const hi = name ? `Здравей, ${escapeHtml(name)},` : "Здравей,";
      const hiT = name ? `Здравей, ${name},` : "Здравей,";
      return {
        html: shell(`<p>${hi}</p>
<p>Тази част изненадва всички, затова ти я разказвам отделно: гласовият агент.</p>
<p>Вдига, когато ти си зает. Звъни на клиентите за потвърждение на час или поръчка. Отговаря на въпроси и подсказва още нещо отгоре. Говори толкова близко до човешко, че повечето отсреща изобщо не усещат.</p>
<p>За студени обаждания прави същото: минава списъка, отсява кой има интерес и ти оставя само хората, които си струват. Говориш с петима готови вместо с петдесет случайни.</p>
<p>Най-хубавото е, че не е нужно да ми вярваш на думи — мога да ти го пусна на живо за две минути и сам чуваш.</p>
<p style="margin:24px 0"><a href="${SITE}/booking" style="display:inline-block;background:#0b6b4a;color:#fff;padding:14px 28px;border-radius:7px;text-decoration:none;font-weight:600;font-size:16px">Чуй го на живо →</a></p>
<p>А ако ти е по-лесно — вдигни телефона и ми звънни, или отговори тук. И двете стигат до мен.</p>`),
        text: `${hiT}

Тази част изненадва всички, затова ти я разказвам отделно: гласовият агент.

Вдига, когато ти си зает. Звъни на клиентите за потвърждение на час или поръчка. Отговаря на въпроси и подсказва още нещо отгоре. Говори толкова близко до човешко, че повечето отсреща изобщо не усещат.

За студени обаждания прави същото: минава списъка, отсява кой има интерес и ти оставя само хората, които си струват. Говориш с петима готови вместо с петдесет случайни.

Най-хубавото е, че не е нужно да ми вярваш на думи — мога да ти го пусна на живо за две минути и сам чуваш.

Чуй го на живо: ${SITE}/booking

А ако ти е по-лесно — вдигни телефона и ми звънни, или отговори тук. И двете стигат до мен.

${SIGNATURE_TEXT}`,
      };
    },
  },
  {
    key: "s3_demota",
    afterDays: 5,
    subject: "Да ти направя демо върху твоя бизнес?",
    build: (name) => {
      const hi = name ? `Здравей, ${escapeHtml(name)},` : "Здравей,";
      const hiT = name ? `Здравей, ${name},` : "Здравей,";
      return {
        html: shell(`<p>${hi}</p>
<p>Демотата, които ти пратих, са темплейти — показват как работи системата в един бранш.</p>
<p>Онова, което наистина убеждава хората, е друго: да видят своя бизнес вътре. Своите клиенти, своите оферти, своите тесни места.</p>
<p>Правя го и няма да ти струва нищо. Отговори ми с две-три изречения — с какво се занимаваш и кое ти яде най-много време — и ти сглобявам демо точно върху това. Ще видиш кое си струва да тръгне първо и кое може да чака.</p>
<p style="margin:22px 0"><a href="${SITE}/booking" style="display:inline-block;background:#0b6b4a;color:#fff;padding:14px 28px;border-radius:7px;text-decoration:none;font-weight:600;font-size:16px">Или направо си запази 20 минути →</a></p>
<p>А ако ти се гледа нещо по-спокойно междувременно: <a href="${YT}" style="color:#0b6b4a">каналът ми в YouTube</a> — там показвам как се строят тези неща отвътре.</p>`),
        text: `${hiT}

Демотата, които ти пратих, са темплейти — показват как работи системата в един бранш.

Онова, което наистина убеждава хората, е друго: да видят своя бизнес вътре. Своите клиенти, своите оферти, своите тесни места.

Правя го и няма да ти струва нищо. Отговори ми с две-три изречения — с какво се занимаваш и кое ти яде най-много време — и ти сглобявам демо точно върху това. Ще видиш кое си струва да тръгне първо и кое може да чака.

Или направо си запази 20 минути: ${SITE}/booking

А ако ти се гледа нещо по-спокойно междувременно: ${YT} — там показвам как се строят тези неща отвътре.

${SIGNATURE_TEXT}`,
      };
    },
  },
  {
    key: "s4_posledno",
    afterDays: 9,
    subject: "Оставям ти вратата отворена",
    build: (name) => {
      const hi = name ? `Здравей, ${escapeHtml(name)},` : "Здравей,";
      const hiT = name ? `Здравей, ${name},` : "Здравей,";
      return {
        html: shell(`<p>${hi}</p>
<p>Това е последното ми писмо по този повод — нататък топката е в теб и е спокойно и в двата случая.</p>
<p>Ако сега не е моментът, напълно нормално. Оставям ти двете неща, които струват най-много, и толкова:</p>
<ul style="padding-left:20px;margin:16px 0">
<li style="margin-bottom:8px"><a href="${SITE}/automation-audit" style="color:#0b6b4a"><strong>Безплатният AI одит</strong></a> — казвам ти кои процеси при теб горят пари, дори да не работим заедно</li>
<li><a href="${SITE}/booking" style="color:#0b6b4a"><strong>20 минути разговор</strong></a>, когато ти дойде времето — часът стои отворен и след месец</li>
</ul>
<p>А ако моментът е точно сега — отговори с една дума и се заемам още днес.</p>
<p style="color:#4a5651">Успех с бизнеса. Наистина.</p>`),
        text: `${hiT}

Това е последното ми писмо по този повод — нататък топката е в теб и е спокойно и в двата случая.

Ако сега не е моментът, напълно нормално. Оставям ти двете неща, които струват най-много, и толкова:

• Безплатният AI одит: ${SITE}/automation-audit — казвам ти кои процеси при теб горят пари, дори да не работим заедно
• 20 минути разговор: ${SITE}/booking — часът стои отворен и след месец

А ако моментът е точно сега — отговори с една дума и се заемам още днес.

Успех с бизнеса. Наистина.

${SIGNATURE_TEXT}`,
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

  const { html, text } = step.build(firstName(fullName), { contactId });
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
