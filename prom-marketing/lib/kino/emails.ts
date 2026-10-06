/**
 * Писмата на залата. Без "server-only" нарочно — текстовете се четат от тест.
 *
 * Тонът (CLAUDE.md на Ивайло): топло и уверено, през ползата за човека, всяко
 * писмо води към следваща стъпка. Без извинения за писмото, без „да не те
 * безпокоя“, без натиск и без фалшиви броячи. Кратки живи изречения, на „ти“.
 */
import { escapeHtml } from "@/lib/email/escape";
import { KINO } from "./config";
import type { premiereLabels } from "./time";

export interface KinoEmailCtx {
  name: string;
  links: { ticket: string; short: string; hall: string; ics: string };
  labels: ReturnType<typeof premiereLabels>;
  /** потокът: „в понеделник, 19 октомври“ */
  cohort?: { startOnDay: string } | null;
  /** гледал ли е филма (писмото след края е различно) */
  entered?: boolean;
  seat?: { hall: number; row: number; seat: number } | null;
  viberUrl?: string | null;
  unsubscribeUrl?: string;
}

export interface KinoEmail {
  subject: string;
  html: string;
  text: string;
}

const C = {
  ink: "#0d1221",
  soft: "#4a5568",
  violet: "#7c3aed",
  cyan: "#0891b2",
  line: "#e6e8f0",
};

function button(href: string, label: string, color = C.violet): string {
  return `<p style="margin:22px 0;"><a href="${href}" style="display:inline-block;background:${color};color:#ffffff;font-weight:bold;padding:13px 26px;border-radius:999px;text-decoration:none;">${escapeHtml(label)}</a></p>`;
}

function layout(ctx: KinoEmailCtx, inner: string): string {
  const unsub = ctx.unsubscribeUrl
    ? `<p style="margin:26px 0 0;font-size:12px;color:#8a93a6;">Не искаш напомняния за прожекцията? <a href="${ctx.unsubscribeUrl}" style="color:#8a93a6;">Спри писмата</a>.</p>`
    : "";
  return `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${C.ink};max-width:560px;">
<p style="margin:0 0 18px;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:${C.violet};font-weight:bold;">${escapeHtml(KINO.title)} · онлайн премиера</p>
${inner}
<p style="margin-top:26px;">${escapeHtml(KINO.host.name)}<br/><span style="color:${C.soft};">${escapeHtml(KINO.host.role)}</span></p>
${unsub}
</div>`;
}

function ticketBlock(ctx: KinoEmailCtx): string {
  const seat = ctx.seat ? `ЗАЛА ${ctx.seat.hall} · РЕД ${ctx.seat.row} · МЯСТО ${ctx.seat.seat}` : "ЗАЛА 1";
  return `<div style="margin:20px 0;padding:18px 20px;border-radius:14px;background:#0b0b1e;color:#f5f7ff;">
<p style="margin:0;font-size:12px;letter-spacing:2px;color:#22d3ee;font-weight:bold;">${seat}</p>
<p style="margin:6px 0 0;font-size:20px;font-weight:bold;letter-spacing:4px;">${escapeHtml(KINO.title)}</p>
<p style="margin:4px 0 0;color:#c4c9e0;">${escapeHtml(ctx.labels.day)} · ${escapeHtml(ctx.labels.time)} · онлайн</p>
</div>`;
}

const sign = (s: string) => `${s}\n\n${KINO.host.name}\n${KINO.host.role}`;

/** Веднага след записването. */
export function ticketEmail(ctx: KinoEmailCtx): KinoEmail {
  const n = escapeHtml(ctx.name);
  const viber = ctx.viberUrl
    ? `<p>📲 В <a href="${ctx.viberUrl}">Кино клуба във Viber</a> ще получиш трите трейлъра и напомняне преди прожекцията.</p>`
    : "";
  return {
    subject: `🎟️ Билетът ти за „${KINO.title}“ · ${ctx.labels.short}`,
    html: layout(
      ctx,
      `<p>Здравей, ${n}!</p>
<p>Радвам се, че идваш. Мястото ти в залата е запазено:</p>
${ticketBlock(ctx)}
<p>Филмът е около 50 минути — накрая отговарям на въпросите, които хората ми задават най-често. Прожекцията е <strong>само веднъж, без запис</strong> — затова си запази вечерта. В билета ще намериш линка към залата, календара и Кино клуба.</p>
${button(ctx.links.ticket, "Отвори билета си")}
<p>📅 <a href="${ctx.links.ics}">Добави прожекцията в календара</a> — за да не се разминем.</p>
${viber}
<p>Вземи си пуканки. 🍿</p>`,
    ),
    text: sign(
      `Здравей, ${ctx.name}!\n\nРадвам се, че идваш. Мястото ти в залата е запазено: ${KINO.title} · ${ctx.labels.day} · ${ctx.labels.time} · онлайн, само веднъж (без запис).\n\nБилетът ти (линкът към залата, календарът, Кино клубът): ${ctx.links.ticket}\nДобави в календара: ${ctx.links.ics}${ctx.viberUrl ? `\nКино клубът във Viber: ${ctx.viberUrl}` : ""}\n\nВземи си пуканки.`,
    ),
  };
}

function trailerEmail(ctx: KinoEmailCtx, i: 1 | 2, title: string, lead: string, inDays: string): KinoEmail {
  const url = `${ctx.links.ticket}#trailer-${i}`;
  return {
    subject: `🎬 Трейлър ${i}: „${title}“ · премиерата е ${inDays}`,
    html: layout(
      ctx,
      `<p>Здравей, ${escapeHtml(ctx.name)}!</p>
<p>${lead}</p>
${button(url, `Пусни трейлър ${i}`)}
<p>Премиерата е ${escapeHtml(ctx.labels.onDay)}, в ${escapeHtml(ctx.labels.time)}. Мястото ти те чака.</p>`,
    ),
    text: sign(`Здравей, ${ctx.name}!\n\n${lead}\n\nТрейлър ${i}: ${url}\n\nПремиерата е ${ctx.labels.onDay}, в ${ctx.labels.time}.`),
  };
}

export function trailer1Email(ctx: KinoEmailCtx): KinoEmail {
  return trailerEmail(
    ctx,
    1,
    "Възможността",
    "Ето първия поглед към филма — баба Цонка, ресторантът в 23:00 и един робот, който играе хоро. Всичко, което ще видиш, вече се случва. Тук. Сега.",
    "след 5 дни",
  );
}

export function trailer2Email(ctx: KinoEmailCtx): KinoEmail {
  return trailerEmail(
    ctx,
    2,
    "Как изглежда, когато го имаш",
    "Един ден от живота на Мария — от 06:30 до вечерта. Същата работа, същият бизнес. Само че някой друг вдига телефона.",
    "след 3 дни",
  );
}

export function tomorrowEmail(ctx: KinoEmailCtx): KinoEmail {
  const url = `${ctx.links.ticket}#trailer-3`;
  return {
    subject: `Утре в ${ctx.labels.time} · „${KINO.title}“ (+ зад кулисите)`,
    html: layout(
      ctx,
      `<p>Здравей, ${escapeHtml(ctx.name)}!</p>
<p><strong>Утре в ${escapeHtml(ctx.labels.time)}</strong> гасим светлините. Филм за изкуствения интелект и българския бизнес — около 50 минути, с въпросите накрая. Само веднъж, без запис.</p>
<p>Докато чакаш — третият трейлър: как направих целия филм с AI. Сам. Дори гласът.</p>
${button(url, "Виж зад кулисите")}
<p>Приготви си 50 минути, звук и нещо за писане. Линкът към залата е в билета ти, а утре в ${escapeHtml(ctx.labels.doorsTime)} ще ти го пратя и тук.</p>`,
    ),
    text: sign(
      `Здравей, ${ctx.name}!\n\nУтре в ${ctx.labels.time} гасим светлините. Около 50 минути филм, с въпросите накрая. Само веднъж, без запис.\n\nТрейлър 3 (зад кулисите): ${url}\n\nЛинкът към залата е в билета ти: ${ctx.links.ticket}`,
    ),
  };
}

export function doorsEmail(ctx: KinoEmailCtx): KinoEmail {
  return {
    subject: `🍿 След 15 минути гасим светлините — твоят линк към залата`,
    html: layout(
      ctx,
      `<p>Здравей, ${escapeHtml(ctx.name)}!</p>
<p>Залата е отворена. Точно в ${escapeHtml(ctx.labels.time)} започваме — всички гледаме една и съща минута, като в истинско кино.</p>
${button(ctx.links.hall, "Влез в залата")}
<p>Пусни звука — гласът е половината филм. Въпросите си пиши под филма — ще ги обсъдим на срещата после.</p>`,
    ),
    text: sign(
      `Здравей, ${ctx.name}!\n\nЗалата е отворена. Точно в ${ctx.labels.time} започваме.\n\nВлез: ${ctx.links.hall}\n\nПусни звука. Въпросите си пиши под филма — ще ги обсъдим на срещата после.`,
    ),
  };
}

export function missingEmail(ctx: KinoEmailCtx): KinoEmail {
  return {
    subject: `Филмът върви — най-важното е напред`,
    html: layout(
      ctx,
      `<p>Здравей, ${escapeHtml(ctx.name)}!</p>
<p>„${escapeHtml(KINO.title)}“ върви от половин час, а мястото ти е свободно. Най-важното е напред — частта, в която показвам какво можеш да направиш още тази вечер.</p>
${button(ctx.links.hall, "Влез сега")}
<p>Влизаш в текущата минута. Прожекцията е само тази вечер — записи няма.</p>`,
    ),
    text: sign(
      `Здравей, ${ctx.name}!\n\nФилмът върви от половин час. Най-важното е напред.\n\nВлез сега: ${ctx.links.hall}\n\nПрожекцията е само тази вечер — записи няма.`,
    ),
  };
}

/** След края: поканата и срокът. Повторение няма — затова писмото води към поканата. */
export function afterEmail(ctx: KinoEmailCtx): KinoEmail {
  const close = `${ctx.labels.closeDay}, ${ctx.labels.closeTime}`;
  const start = ctx.cohort ? ` Потокът започва ${ctx.cohort.startOnDay}.` : "";
  const lead = ctx.entered
    ? `Благодаря ти, че беше в залата. Трите начина да продължим заедно те чакат там — поканата остава отворена до <strong>${escapeHtml(close)}</strong>.${escapeHtml(start)}`
    : `Прожекцията беше само веднъж, без запис — но поканата от края на филма остава отворена до <strong>${escapeHtml(close)}</strong>.${escapeHtml(start)}`;
  return {
    subject: ctx.entered ? `Поканата от „${KINO.title}“ · отворена до ${close}` : `„${KINO.title}“ мина — поканата е отворена до ${close}`,
    html: layout(
      ctx,
      `<p>Здравей, ${escapeHtml(ctx.name)}!</p>
<p>${lead}</p>
${button(ctx.links.hall, "Към поканата")}
<p>Искаш първо да поговорим? Там е и календарът — кратка заявка, избираш час, 20 минути.</p>`,
    ),
    text: sign(
      `Здравей, ${ctx.name}!\n\n${ctx.entered ? "Благодаря ти, че беше в залата." : "Прожекцията беше само веднъж, без запис."} Поканата от края на филма е отворена до ${close}.${start}\n\nКъм поканата: ${ctx.links.hall}\n\nИскаш първо да поговорим? Там е и календарът.`,
    ),
  };
}

export function last3hEmail(ctx: KinoEmailCtx): KinoEmail {
  return {
    subject: `Записването затваря в полунощ · последните 3 часа`,
    html: layout(
      ctx,
      `<p>Здравей, ${escapeHtml(ctx.name)}!</p>
<p>В ${escapeHtml(ctx.labels.closeTime)} записването в потока затваря. Трите бутона от края на филма са в залата — имаш още три часа.</p>
${button(ctx.links.hall, "Към поканата")}
<p>Искаш първо да поговорим? Там е календарът — кратка заявка, избираш час, 20 минути, без ангажимент.</p>`,
    ),
    text: sign(
      `Здравей, ${ctx.name}!\n\nВ ${ctx.labels.closeTime} записването в потока затваря — имаш още три часа.\n\nКъм поканата: ${ctx.links.hall}`,
    ),
  };
}

/** След плащане на потока (изцяло или първа вноска). */
export function welcomeEmail(args: {
  name: string;
  planLine: string;
  calUrl: string;
  programName?: string;
  /** „в понеделник, 19 октомври“ */
  cohortStart?: string | null;
}): KinoEmail {
  const program = args.programName ?? KINO.program.name;
  return {
    subject: `🎉 Добре дошъл в ${program}`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${C.ink};max-width:560px;">
<p>Здравей, ${escapeHtml(args.name)}!</p>
<p>Добре дошъл! Радвам се, че ще снимаме „Част втора“ заедно. Плащането мина: <strong>${escapeHtml(args.planLine)}</strong>.</p>
<p><strong>Какво следва:</strong></p>
<ol style="padding-left:20px;margin:0 0 16px;">
<li>До 24 часа получаваш покана за Академията на този имейл.</li>
<li>Запази си първия разговор с мен — там започваме „AI картата на бизнеса ти“.</li>
<li>${args.cohortStart ? `Потокът ти започва ${escapeHtml(args.cohortStart)} — д` : "Д"}атата на първата жива среща ще ти я пратя в отделно писмо.</li>
</ol>
${button(args.calUrl, "Избери час за първия разговор")}
<p>Касовата бележка от Stripe идва отделно. Въпрос? Отговори на това писмо — пише го човек.</p>
<p style="margin-top:26px;">${escapeHtml(KINO.host.name)}<br/><span style="color:${C.soft};">${escapeHtml(KINO.host.role)}</span></p>
</div>`,
    text: sign(
      `Здравей, ${args.name}!\n\nДобре дошъл! Плащането мина: ${args.planLine}.\n\nКакво следва:\n1. До 24 часа получаваш покана за Академията на този имейл.\n2. Запази си първия разговор с мен: ${args.calUrl}\n3. ${args.cohortStart ? `Потокът ти започва ${args.cohortStart}. ` : ""}Датата на първата жива среща идва в отделно писмо.\n\nВъпрос? Отговори на това писмо.`,
    ),
  };
}

/**
 * След капарото: часът за срещата (пон–чт) и личният линк „доплати“ —
 * капарото е приспаднато там автоматично.
 */
export function depositEmail(args: {
  name: string;
  amountLine: string;
  calUrl: string;
  payUrl: string | null;
  /** „в понеделник, 19 октомври“ */
  cohortStart?: string | null;
}): KinoEmail {
  const where = args.cohortStart ? `мястото ти в потока, който започва ${args.cohortStart}, е запазено` : "мястото ти в потока е запазено";
  return {
    subject: `🔒 Мястото ти е запазено — избери час за срещата`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:${C.ink};max-width:560px;">
<p>Здравей, ${escapeHtml(args.name)}!</p>
<p>Капарото мина (${escapeHtml(args.amountLine)}) — ${escapeHtml(where)}. Приспада се изцяло от цената.</p>
${button(args.calUrl, "Избери час за срещата")}
<p>На срещата ще видим заедно откъде да започнеш и как потокът ще работи за твоя бизнес.</p>
${args.payUrl ? `<p><strong>Доплащането</strong> е на твоята лична страница — капарото вече е приспаднато там: <a href="${args.payUrl}">доплати тук</a>. Можеш по време на срещата или след нея.</p>` : ""}
<p style="margin-top:26px;">${escapeHtml(KINO.host.name)}<br/><span style="color:${C.soft};">${escapeHtml(KINO.host.role)}</span></p>
</div>`,
    text: sign(
      `Здравей, ${args.name}!\n\nКапарото мина (${args.amountLine}) — ${where}. Приспада се изцяло.\n\nИзбери час за срещата: ${args.calUrl}${args.payUrl ? `\n\nДоплащане (капарото е приспаднато): ${args.payUrl}` : ""}`,
    ),
  };
}

export type FlowEmailId = "trailer1" | "trailer2" | "tomorrow" | "doors" | "missing" | "after" | "last3h";

export function flowEmail(stageId: string, ctx: KinoEmailCtx): KinoEmail | null {
  switch (stageId) {
    case "trailer1":
      return trailer1Email(ctx);
    case "trailer2":
      return trailer2Email(ctx);
    case "tomorrow":
      return tomorrowEmail(ctx);
    case "doors":
      return doorsEmail(ctx);
    case "missing":
      return missingEmail(ctx);
    case "after":
      return afterEmail(ctx);
    case "last3h":
      return last3hEmail(ctx);
    default:
      return null;
  }
}
