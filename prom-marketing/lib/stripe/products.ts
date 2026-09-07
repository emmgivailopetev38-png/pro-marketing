import { OFFERS } from "@/lib/webinar/config";

/**
 * Продуктите, които могат да се купят през /api/checkout и през линка за
 * плащане, който гласовият агент праща (/plati/<token>).
 *
 * Цените на курса и менторството идват от lib/webinar/config.ts. Цените на
 * услугите са от ценоразписа от 27.08.2026 (components/admin/skript/pricing-data.ts)
 * и се държат на едно място — тук. Гласовият агент НЕ избира сума: избира
 * идентификатор от `VOICE_PAY_PRODUCTS`, а сумата идва оттук.
 */
export const CHECKOUT_PRODUCTS = {
  course: {
    name: OFFERS.course.name,
    description: OFFERS.course.tagline,
    priceEur: OFFERS.course.priceEur,
    successPath: "/kurs/uspeh",
    cancelPath: "/kurs",
  },
  "course-webinar": {
    name: `${OFFERS.course.name} · Уебинар оферта`,
    description: `${OFFERS.course.tagline} Специална цена за участници в обучението.`,
    priceEur: OFFERS.course.webinarPriceEur,
    successPath: "/kurs/uspeh",
    cancelPath: "/kurs",
  },
  mentorship: {
    name: OFFERS.mentorship.name,
    description: OFFERS.mentorship.tagline,
    priceEur: OFFERS.mentorship.priceEur,
    successPath: "/kurs/uspeh?stage=mentorship",
    cancelPath: "/mentor",
  },
  "mentorship-upgrade": {
    name: `${OFFERS.mentorship.name} · Ъпгрейд от курса`,
    description: "Кредит от курса — доплащаш разликата до менторската програма.",
    priceEur: OFFERS.mentorship.upgradePriceEur,
    successPath: "/kurs/uspeh?stage=mentorship",
    cancelPath: "/kurs/uspeh",
  },
  "mentorship-webinar": {
    name: `${OFFERS.mentorship.name} · Уебинар оферта −30%`,
    description:
      "Пълното ниво за участници в обучението: курсът + 16 лични 1-на-1 сесии. Специална цена, валидна 48 часа след уебинара.",
    priceEur: OFFERS.mentorship.webinarPriceEur,
    successPath: "/kurs/uspeh?stage=mentorship",
    cancelPath: "/kurs",
  },
  "trading-mentorship": {
    name: "Трейдинг Агент · Менторство 1-на-1 · 4 месеца",
    description:
      "16 лични сесии: твоята стратегия → правила → бектест → демо → изпълнение. Изграждаш собствен трейдинг агент.",
    priceEur: 2000,
    successPath: "/kurs/uspeh?stage=mentorship",
    cancelPath: "/trading",
  },

  /* ── Услугите, които гласовият агент може да затвори с линк ─────────────
     Сумите са крайни за плащане с карта. Абонаментът (290/490/890 €/мес) не
     минава оттук — започва от месеца на пускането и се фактурира от CRM-а. */
  "glas-vnedryavane": {
    name: "Гласов AI агент · внедряване",
    description:
      "Агент с ваш сценарий и глас, свързан с телефона и системата ви, тестван върху реални разговори. Абонаментът за минутите и поддръжката започва от месеца на пускането.",
    priceEur: 2400,
    successPath: "/plati/uspeh?p=glas",
    cancelPath: "/glas",
  },
  "glas-vnedryavane-70": {
    name: "Гласов AI агент · внедряване · първа вноска (70%)",
    description:
      "Първата вноска, с която започва работата по вашия агент. Останалите 30% се плащат при предаване на работещия агент.",
    priceEur: 1680,
    successPath: "/plati/uspeh?p=glas",
    cancelPath: "/glas",
  },
  "avtomatizacia-proces": {
    name: "AI автоматизация · един процес",
    description:
      "Един процес, изграден и предаден работещ до 7 работни дни, с обучение как се ползва и 30 дни гаранция.",
    priceEur: 1900,
    successPath: "/plati/uspeh?p=avtomatizacia",
    cancelPath: "/ai-avtomatizacia",
  },
  "crm-vnedryavane": {
    name: "CRM и автоматичен follow-up · внедряване",
    description:
      "CRM с вашите етапи, автоматичен follow-up, който пази причината за отлагане, импорт на контактите и обучение на екипа.",
    priceEur: 2900,
    successPath: "/plati/uspeh?p=crm",
    cancelPath: "/ai-crm",
  },
} as const;

export type CheckoutProductId = keyof typeof CHECKOUT_PRODUCTS;

export function isCheckoutProductId(v: string): v is CheckoutProductId {
  return v in CHECKOUT_PRODUCTS;
}

/**
 * Само тези може да поиска гласовият агент. Списъкът е нарочно къс: агентът
 * продава едно нещо докрай, а останалото е за срещата. Курсовете и
 * менторството не са тук — те си имат страници и бутони.
 */
export const VOICE_PAY_PRODUCTS = [
  "glas-vnedryavane",
  "glas-vnedryavane-70",
  "avtomatizacia-proces",
  "crm-vnedryavane",
] as const satisfies readonly CheckoutProductId[];

export type VoicePayProductId = (typeof VOICE_PAY_PRODUCTS)[number];

export function isVoicePayProductId(v: string): v is VoicePayProductId {
  return (VOICE_PAY_PRODUCTS as readonly string[]).includes(v);
}
