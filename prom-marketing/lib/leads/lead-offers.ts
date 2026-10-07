/**
 * Какво е поискал човекът — „оферта“ на лийда. Отговаря на въпроса, с който
 * Димитър вдига телефона: за какво звъня? Наръчникът, безплатният курс,
 * AI одитът, прегледът на рекламата, менторската програма…
 *
 * Оттук идват три неща:
 *   • значката на картата в /ekip („📘 Наръчник“, „🎓 Безплатен курс“…);
 *   • едното изречение, с което започва разговорът;
 *   • етикетът на кампанията в статистиката (/admin/konversii).
 *
 * Чист файл — без база и без "server-only", за да го ползват и картата в
 * браузъра, и тестовете.
 *
 * ЛИЙД МАГНИТ = форма, след която човекът получава материал веднага по имейл.
 * Самото писмо и формите живеят в `lib/email/lead-steps.ts` (`firstStepForForm`
 * и `variant` на първата стъпка) — тук само се превежда вариантът в значка.
 * Нов лийд магнит: форма + първо писмо с `variant` в lead-steps.ts; ако
 * вариантът е различен от ключовете в `MAGNET_BY_VARIANT` — един ред там.
 */

export type OfferKey = "narachnik" | "kurs" | "ai_odit" | "marketing" | "mentorska" | "reklama" | "sait" | "glas";

export interface OfferDef {
  /** значката на картата и в статистиката */
  label: string;
  /** лийд магнит — човекът е поискал материал и го получава веднага по имейл */
  magnet: boolean;
  /** първото изречение на разговора; „{име}“ е човекът, който звъни */
  opener: string;
}

export const LEAD_OFFERS: Record<OfferKey, OfferDef> = {
  narachnik: {
    label: "📘 Наръчник",
    magnet: true,
    opener: "Здравейте, {име} съм от Pro Marketing — обаждам се за AI наръчника, който изтеглихте. Успяхте ли да го разгледате?",
  },
  kurs: {
    label: "🎓 Безплатен курс",
    magnet: true,
    opener: "Здравейте, {име} съм от Pro Marketing — обаждам се за безплатния курс, който заявихте. Успяхте ли да го започнете?",
  },
  ai_odit: {
    label: "🔎 Безплатен AI одит",
    magnet: false,
    opener:
      "Здравейте, {име} съм от Pro Marketing — обаждам се за безплатния AI одит, който заявихте. Имате ли две минути да ви задам два въпроса за фирмата?",
  },
  marketing: {
    label: "📣 Преглед на рекламата",
    magnet: false,
    opener:
      "Здравейте, {име} съм от Pro Marketing — обаждам се за безплатния преглед на рекламата, който поискахте. Имате ли две минути?",
  },
  mentorska: {
    label: "🧭 Менторска програма",
    magnet: false,
    opener:
      "Здравейте, {име} съм от Pro Marketing — обаждам се за менторската програма, за която кандидатствахте. Имате ли две минути?",
  },
  reklama: {
    label: "📣 От реклама",
    magnet: false,
    opener: "Здравейте, {име} съм от Pro Marketing — обаждам се, защото оставихте телефона си на рекламата ни. Имате ли две минути?",
  },
  sait: {
    label: "🌐 От сайта",
    magnet: false,
    opener: "Здравейте, {име} съм от Pro Marketing — обаждам се, защото ни писахте през сайта. Имате ли две минути?",
  },
  glas: {
    label: "🎙 Гласовият агент",
    magnet: false,
    opener: "Здравейте, {име} съм от Pro Marketing — обаждам се, защото говорихте с гласовия ни агент. Имате ли две минути?",
  },
};

/**
 * Вариантът на първото писмо (`SequenceStep.variant` в lead-steps.ts) → кой
 * лийд магнит е. Курсът: ако първото му писмо е с `variant: "kurs"`, не трябва
 * нищо; с друго име — един ред тук.
 */
export const MAGNET_BY_VARIANT: Readonly<Record<string, OfferKey>> = {
  narachnik: "narachnik",
  kurs: "kurs",
};

/**
 * По името на формата или кампанията — за лийдовете отпреди тази бележка и за
 * формите, които не са лийд магнит. Първото съвпадение печели, затова
 * магнитите са отгоре: „Лийд магнит · AI наръчник“ съдържа и „AI“.
 */
const NAME_RULES: Array<[OfferKey, RegExp]> = [
  ["narachnik", /наръчник|narachnik/i],
  ["kurs", /безплатен\s+(?:ai\s+)?курс|bezplaten[-_\s]?kurs/i],
  ["ai_odit", /ai\s*одит/i],
  ["marketing", /преглед на рекламата/i],
  ["mentorska", /менторск/i],
];

export function offerFromNames(...names: Array<string | null | undefined>): OfferKey | null {
  for (const name of names) {
    const n = (name ?? "").trim();
    if (!n) continue;
    for (const [key, re] of NAME_RULES) if (re.test(n)) return key;
  }
  return null;
}

export interface OfferInput {
  /** `firstStepForForm(formId).variant` — лийд магнит по id-то на формата */
  magnetVariant?: string | null;
  formName?: string | null;
  campaignName?: string | null;
  /** contacts.source — за картоните без Meta форма */
  source?: string | null;
}

/** Какво е поискал човекът: магнитът по формата, после по имената, накрая по източника. */
export function offerFor(input: OfferInput): OfferKey | null {
  const v = input.magnetVariant ?? null;
  if (v && MAGNET_BY_VARIANT[v]) return MAGNET_BY_VARIANT[v];
  const byName = offerFromNames(input.formName, input.campaignName);
  if (byName) return byName;
  switch (input.source) {
    case "meta_lead":
      return "reklama";
    case "website_form":
      return "sait";
    case "voice_web":
    case "voice_phone":
      return "glas";
    default:
      return null;
  }
}

export function isOfferKey(v: unknown): v is OfferKey {
  return typeof v === "string" && Object.prototype.hasOwnProperty.call(LEAD_OFFERS, v);
}

export function offerLabel(key: OfferKey | null | undefined): string | null {
  return key && isOfferKey(key) ? LEAD_OFFERS[key].label : null;
}

/** Първото изречение на разговора, с името на човека, който звъни. */
export function openerFor(key: OfferKey | null | undefined, callerName: string | null | undefined): string | null {
  if (!key || !isOfferKey(key)) return null;
  const name = (callerName ?? "").trim() || "Димитър";
  return LEAD_OFFERS[key].opener.replace("{име}", name);
}
