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
} as const;

export type CheckoutProductId = keyof typeof CHECKOUT_PRODUCTS;

export function isCheckoutProductId(v: string): v is CheckoutProductId {
  return v in CHECKOUT_PRODUCTS;
}
