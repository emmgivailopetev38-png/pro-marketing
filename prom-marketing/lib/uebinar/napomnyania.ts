/* ---------------------------------------------------------------------------
   Напомнянията за уебинара (имейли + Viber канала) — графикът и правилата.
   По Loom-а на Стефчо „Структура на имейли и SMS за събитие“ (25.11.2026):
     №0 „бърз въпрос“ веднага · №1 очаквания + потвърждение след 10 мин ·
     №2–№7 съдържание (защо да не пропуснеш, авторитет, проблем, бъдеще +
     истории, какво ще научиш, възражения) · №8–№11 напомняния (24 ч. преди,
     сутринта, 1 ч. преди, при началото). Viber постовете са същите 1:1 +
     едно повече 15 минути преди началото, с линка.
   SMS-ите ги праща Notifier (notifierbg.com), не този файл.

   Чист файл: без база и без мрежа — тук е само „кое кога е дължимо“, за да
   се тества. Изпращането е в app/api/cron/uebinar.
   Нищо не тръгва, докато `vklyucheni` е false (Ивайло одобрява текстовете).
--------------------------------------------------------------------------- */
import { NA_ZHIVO, calendarUrl } from "./na-zhivo";
import { IMEILI_TEKSTOVE } from "./napomnyania-tekstove";
import { splitName } from "./capi";

export const NAPOMNYANIA = {
  /** Ивайло одобри текстовете (25.11.2026, ~22:30: „добре са имейлите и SMS-те… довърши цялостната инсталация“). */
  vklyucheni: true,
  /** Часовете за писмата със съдържание (№2–№7), по едно на час, по ред за всеки човек. */
  slotove: [
    "2026-11-26T12:00:00+02:00",
    "2026-11-26T18:30:00+02:00",
    "2026-11-27T10:00:00+02:00",
    "2026-11-27T18:30:00+02:00",
    "2026-11-28T10:00:00+02:00",
    "2026-11-28T15:00:00+02:00",
  ] as readonly string[],
  /** Напомнянията с фиксиран час: [№, кога, до кога има смисъл]. */
  fiksirani: [
    [8, "2026-11-28T19:00:00+02:00", "2026-11-29T09:00:00+02:00"],
    [9, "2026-11-29T09:00:00+02:00", "2026-11-29T18:00:00+02:00"],
    [10, "2026-11-29T18:00:00+02:00", "2026-11-29T19:00:00+02:00"],
    [11, "2026-11-29T19:00:00+02:00", "2026-11-29T19:45:00+02:00"],
  ] as ReadonlyArray<readonly [number, string, string]>,
  /** Колко трае „часът“ за писмо със съдържание — после чака следващия. */
  slotMinuti: 180,
} as const;

const MIN = 60_000;
const t = (iso: string) => new Date(iso).getTime();
const START = () => t(NA_ZHIVO.dateISO);
/** Писмата със съдържание спират в неделя на обяд — оттам нататък са само напомнянията. */
const SADARZHANIE_DO = () => START() - 7 * 60 * MIN;

export const SADARZHANIE = [2, 3, 4, 5, 6, 7] as const;

export interface PratenoDosega {
  /** номерата на вече пратените писма */
  nomera: ReadonlySet<number>;
  /** кога е тръгнало последното писмо със съдържание (ms), ако има */
  poslednoSadarzhanie?: number | null;
}

/**
 * Кои писма са дължими СЕГА за човек, записал се в `zapisanIso`. Връща номерата
 * по ред; викащият праща само тях и пази, че са пратени (никога два пъти).
 *   №0 веднага (освен ако се е записал в последните 3 часа преди началото);
 *   №1 10 мин след записването, до началото;
 *   №2–№7 по едно във всеки „час“ от графика, който е поне час след записването;
 *   №8 и №9 само ако се е записал преди часа им; №10 и №11 — всеки, в прозореца им.
 */
export function dalzhimiImeili(zapisanIso: string, now: number, prateno: PratenoDosega): number[] {
  const zap = t(zapisanIso);
  const start = START();
  const out: number[] = [];
  const nyama = (n: number) => !prateno.nomera.has(n);

  if (nyama(0) && now >= zap && now < start && zap < start - 3 * 60 * MIN) out.push(0);
  if (nyama(1) && now >= zap + 10 * MIN && now < start) out.push(1);

  // Съдържанието: един „час“ = [слот, слот + slotMinuti); по едно писмо на час, по ред.
  if (now < SADARZHANIE_DO()) {
    const chas = NAPOMNYANIA.slotove
      .map(t)
      .filter((s) => s >= zap + 60 * MIN && s <= now && now < s + NAPOMNYANIA.slotMinuti * MIN)
      .pop();
    const posledno = prateno.poslednoSadarzhanie ?? null;
    if (chas !== undefined && (posledno === null || posledno < chas)) {
      const sledvashto = SADARZHANIE.find((n) => nyama(n));
      if (sledvashto !== undefined) out.push(sledvashto);
    }
  }

  for (const [n, kogaIso, doIso] of NAPOMNYANIA.fiksirani) {
    const koga = t(kogaIso);
    const doKoga = t(doIso);
    if (!nyama(n) || now < koga || now >= doKoga) continue;
    // Напомнянията за деня (№8, №9) — само за записаните преди тях; с линка (№10, №11) — за всеки.
    if ((n === 8 || n === 9) && zap >= koga) continue;
    out.push(n);
  }
  return out;
}

/** Viber постовете: №1 (закачен най-горе) веднага, №2–№7 в часовете, №8–№11 и „15 минути преди“. */
export const VIBER_POSTOVE: ReadonlyArray<{ kluch: string; n: number | null; koga: string }> = [
  { kluch: "1", n: 1, koga: "2026-11-25T00:00:00+02:00" },
  ...NAPOMNYANIA.slotove.map((koga, i) => ({ kluch: String(SADARZHANIE[i]), n: SADARZHANIE[i] as number, koga })),
  ...NAPOMNYANIA.fiksirani.map(([n, koga]) => ({ kluch: String(n), n, koga })),
  { kluch: "15min", n: null, koga: "2026-11-29T18:45:00+02:00" },
];

/** Кои постове в канала са дължими сега: в двучасов прозорец след часа им (№1 — винаги, докато не е пуснат). */
export function dalzhimiPostove(now: number, pusnati: ReadonlySet<string>): string[] {
  return VIBER_POSTOVE.filter((p) => {
    if (pusnati.has(p.kluch)) return false;
    const koga = t(p.koga);
    if (now < koga) return false;
    if (p.kluch === "1") return now < START();
    return now < koga + 120 * MIN;
  }).map((p) => p.kluch);
}

const LINKOVE: Record<string, string> = {
  "ivailopetev.com/viber": "https://ivailopetev.com/viber",
  "ivailopetev.com/vlez": "https://ivailopetev.com/vlez",
};

/** Писмото, готово за пращане: тема, текст и HTML (линковете стават линкове). */
export function sglobiImeil(n: number, fullName: string | null | undefined, otpisvane: string): { tema: string; tekst: string; html: string } {
  const def = IMEILI_TEKSTOVE.find((x) => x.n === n);
  if (!def) throw new Error(`Няма писмо №${n}`);
  const ime = splitName(fullName ?? "").firstName;
  let tekst = def.tekst.replace(/\{календар\}/g, calendarUrl());
  tekst = ime ? tekst.replace(/\{име\}/g, ime) : tekst.replace(/,? ?\{име\},?/g, ",").replace(/^Здравей,,/m, "Здравей,");
  const footer = `Получаваш това писмо, защото се записа за безплатното обучение „${NA_ZHIVO.name}“ на ivailopetev.com. Ако не искаш повече писма за него: ${otpisvane}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#1c1917;max-width:560px">${tekst
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 14px">${linkove(escapeHtml(p)).replace(/\n/g, "<br/>")}</p>`)
    .join("")}<p style="margin:24px 0 0;font-size:12px;color:#78716c">${escapeHtml(footer).replace(
    escapeHtml(otpisvane),
    `<a href="${escapeHtml(otpisvane)}" style="color:#78716c">отпиши ме</a>`
  )}</p></div>`;
  return { tema: def.tema, tekst: `${tekst}\n\n--\n${footer}`, html };
}

/** Текстът на Viber поста: писмото без „Здравей, {име},“, или „15 минути преди“. */
export function viberTekst(kluch: string): string {
  if (kluch === "15min") return "Започваме след 15 минути! Влез от тук: https://ivailopetev.com/vlez";
  const n = Number(kluch);
  const def = IMEILI_TEKSTOVE.find((x) => x.n === n);
  if (!def) throw new Error(`Няма пост ${kluch}`);
  const bez = def.tekst
    .replace(/^Здравей, \{име\},\s*/u, "")
    .replace(/\{календар\}/g, calendarUrl())
    .replace(/\n\nИвайло\s*$/u, "");
  return Object.entries(LINKOVE).reduce((s, [k, v]) => s.split(` ${k}`).join(` ${v}`), bez);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Голите адреси (ivailopetev.com/…, https://…) стават линкове. */
function linkove(s: string): string {
  return s.replace(/(https?:\/\/[^\s<]+|ivailopetev\.com\/[a-z0-9/-]+)/gi, (m) => {
    const href = m.startsWith("http") ? m : `https://${m}`;
    return `<a href="${href}" style="color:#17693a">${m}</a>`;
  });
}
