import { OFFERS } from "@/lib/webinar/config";

/**
 * Продуктите, които могат да се купят през /api/checkout.
 * Цените идват от lib/webinar/config.ts — тук само се мапват към
 * checkout варианти (пълна цена / уебинар цена / ъпгрейд).
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
    cancelPath: "/webinar/oferta",
  },
  "trading-mentorship": {
    name: "Трейдинг Агент · Менторство 1-на-1 · 4 месеца",
    description:
      "16 лични сесии: твоята стратегия → правила → бектест → демо → изпълнение. Изграждаш собствен трейдинг агент.",
    priceEur: 2000,
    successPath: "/kurs/uspeh?stage=mentorship",
    cancelPath: "/trading",
  },
} as const;

export type CheckoutProductId = keyof typeof CHECKOUT_PRODUCTS;

export function isCheckoutProductId(v: string): v is CheckoutProductId {
  return v in CHECKOUT_PRODUCTS;
}
