/**
 * Общата обвивка на автоматичните имейли — подпис, шел, линкове, име.
 *
 * Изнесено от `lead-sequence.ts`, за да го ползва и топлата поредица
 * (`warm-sequence.ts`). Файлът НЕ е "server-only" нарочно: така текстовете
 * на писмата могат да се четат от тест и от скрипта за преглед, без да
 * дърпат Supabase и Resend.
 */

export const SITE = "https://www.promarketing.pw";
export const YT = "https://www.youtube.com/@promarketingbg";
export const PHONE = "+359 877 399 963";

/**
 * Гласовият агент на началната страница, отворен направо от писмото.
 *
 * `?glas=1` кара бутона в героя да се отвори още при зареждане — човекът
 * натиска линка в имейла, попълва три полета и говори. Агентът му записва
 * час в календара на Ивайло, докато е на линията. Това е най-късият път от
 * „чета имейл" до „имам среща" и затова стои във всеки подпис.
 */
export const VOICE_URL = `${SITE}/?glas=1`;

/**
 * Браншовите демота (`app/demo/<slug>`), подредени така, както лийдовете ни идват:
 * първо фирмите и производството, магазинът и личният бранд накрая.
 *
 * Държи се тук, а не се внася от `app/demo/vertical-demo.tsx`, защото онзи файл е
 * "use client" React компонент — внасянето му в имейл модула дърпа цялото демо в
 * сървърния бъндъл. Ако се добави нов бранш там, добавя се и един ред тук.
 */
export const VERTICAL_DEMOS: { slug: string; label: string; line: string }[] = [
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

/** Първо име, за да звучи като писано на ръка, а не като циркуляр. */
export function firstName(full: string | null | undefined): string | null {
  const n = (full ?? "").trim().split(/\s+/)[0];
  if (!n || n.length < 2 || /^[^\p{L}]/u.test(n)) return null;
  return n;
}

/**
 * Контекст за построяване на един имейл от поредицата.
 *
 * `stage` и `followupStatus` избират пътеката — човек с оферта на масата
 * получава други писма от човек, с когото само сме се чули.
 * `source` казва откъде е дошъл лийдът: който е говорил с гласовия агент,
 * получава първо писмо, което тръгва от този разговор.
 * `unsubscribeUrl` идва отвън, защото се подписва с ключ от сървъра.
 */
export interface BuildCtx {
  contactId?: string;
  stage?: string;
  followupStatus?: string | null;
  source?: string;
  unsubscribeUrl?: string;
}

/**
 * Личен линк към демото.
 *
 * Демото е публична страница и стои в менюто на сайта — ключът не го крие,
 * а прави линка НЕГОВ: в аналитиката се вижда кой лийд е влизал, така че
 * следващият разговор започва от конкретното, а не отначало. Затова и в
 * текста не се обещава, че никой друг няма достъп.
 */
export function demoLink(ctx?: BuildCtx): string {
  const k = (ctx?.contactId ?? "").split("-")[0];
  return k ? `${SITE}/demo?k=${k}` : `${SITE}/demo`;
}

/**
 * Подписът под всеки имейл.
 *
 * Носи ВСИЧКИ начини да се стигне до Ивайло, защото най-скъпият момент е онзи,
 * в който човекът иска да се обади, а трябва да търси телефона някъде назад.
 * Отговорът на самия имейл е сложен най-отгоре — той е най-лесното нещо.
 */
export function signature(ctx?: BuildCtx): string {
  return `<div style="margin:26px 0 0;padding-top:18px;border-top:1px solid #e3e8e5">
<p style="margin:0 0 10px"><strong style="color:#1d2320">Ивайло Петев</strong> · Pro Marketing LTD</p>
<p style="margin:0 0 6px;color:#31413a">Искаш да се чуем веднага? <strong>Просто отговори на този имейл</strong> — идва право при мен и чета всичко лично.</p>
<p style="margin:0 0 6px;color:#31413a">Или ми звънни: <a href="tel:+359877399963" style="color:#0b6b4a;font-weight:600">${PHONE}</a></p>
<p style="margin:0 0 6px;color:#31413a">Или <a href="${VOICE_URL}" style="color:#0b6b4a;font-weight:600">говори с гласовия ни агент</a> — вдига веднага, по всяко време, и ти записва час в календара ми, докато сте на линията.</p>
<p style="margin:10px 0 0;color:#4a5651;font-size:14px">
<a href="${SITE}" style="color:#0b6b4a">promarketing.pw</a> ·
<a href="${SITE}/demo" style="color:#0b6b4a">живото демо</a> ·
<a href="${SITE}/booking" style="color:#0b6b4a">запази 20 минути</a> ·
<a href="${SITE}/automation-audit" style="color:#0b6b4a">безплатен AI одит</a> ·
<a href="${YT}" style="color:#0b6b4a">YouTube</a>
</p>${
    ctx?.unsubscribeUrl
      ? `
<p style="margin:14px 0 0;color:#8d9691;font-size:12px">Не искаш повече писма от мен? <a href="${ctx.unsubscribeUrl}" style="color:#8d9691;text-decoration:underline">спри ги с един клик</a> — нищо не се променя между нас.</p>`
      : ""
  }</div>`;
}

/** Същият подпис, но за текстовата версия. */
export function signatureText(ctx?: BuildCtx): string {
  return `—
Ивайло Петев · Pro Marketing LTD

Искаш да се чуем веднага? Просто отговори на този имейл — идва право при мен и чета всичко лично.
Или ми звънни: ${PHONE}
Или говори с гласовия ни агент — вдига веднага и ти записва час в календара ми: ${VOICE_URL}

Сайт: ${SITE}
Живо демо: ${SITE}/demo
Запази 20 минути: ${SITE}/booking
Безплатен AI одит: ${SITE}/automation-audit
YouTube: ${YT}${ctx?.unsubscribeUrl ? `\n\nНе искаш повече писма? Спри ги оттук: ${ctx.unsubscribeUrl}` : ""}`;
}

/** Обратна съвместимост за старата поредица, която ползва константа. */
export const SIGNATURE_TEXT = signatureText();

export function shell(bodyHtml: string, ctx?: BuildCtx): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1d2320;max-width:580px">
${bodyHtml}
${signature(ctx)}
</div>`;
}

/** Зелен бутон — единственото действие на писмото. */
export function cta(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${href}" style="display:inline-block;background:#0b6b4a;color:#fff;padding:14px 28px;border-radius:7px;text-decoration:none;font-weight:600;font-size:16px">${label}</a></p>`;
}

/** Открояване на едно изречение — сметка, въпрос, находка. */
export function callout(html: string): string {
  return `<p style="margin:18px 0;padding:15px 19px;background:#f2f7f4;border-left:3px solid #0b6b4a;border-radius:0 6px 6px 0">${html}</p>`;
}

export interface SequenceStep {
  /** Стабилен ключ — по него се пази идемпотентността. */
  key: string;
  /** Дни след началната точка на поредицата. 0 = веднага. */
  afterDays: number;
  subject: string;
  build: (name: string | null, ctx?: BuildCtx) => { html: string; text: string };
  /** Различна тема за човек с оферта на масата. */
  subjectFor?: (stage: string | undefined) => string;
  /**
   * Минимум дни след последното НАШЕ писмо, преди това да тръгне.
   * Без стойност важи общата седмица. Писмата след оферта вървят по-начесто —
   * там мълчанието от седмица струва сделка.
   */
  gapDays?: number;
  /** Каква валута носи писмото — за прегледа и за отчета, не за логиката. */
  kind?: "СТОЙНОСТ" | "КЛИЕНТ" | "ДЕМО" | "ИЗХОД" | "СЛЕД РАЗГОВОРА" | "СЛЕД ПРЕЗЕНТАЦИЯТА" | "СЛЕД ОФЕРТАТА" | "ПЪРВО";
  /**
   * Писмото се прескача за този човек — без да се брои за изпратено.
   * Човек с оферта на масата няма нужда да му предлагаме демо: той вече го е видял.
   */
  skipFor?: (ctx: BuildCtx) => boolean;
}
