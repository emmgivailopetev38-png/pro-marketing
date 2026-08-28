/* =====================================================================
   Централен източник на истината за SEO.

   Всичко, което Google, Bing и AI търсачките четат за фирмата, тръгва
   оттук — име, NAP (име/адрес/телефон), ключови думи по клъстери,
   картата на страниците. Едно място за промяна, нула разминавания.

   ⚠️ NAP последователност: адресът тук ТРЯБВА да съвпада буква по буква
   с Google Business Profile, Facebook страницата и фактурите. Разминаване
   в адреса е най-честата причина локалният бизнес да не се класира.
   ===================================================================== */

export const SITE_URL = "https://promarketing.pw";

/** Юридически и контактни данни — влизат в JSON-LD и в подписа на сайта. */
export const ORG = {
  legalName: "Про Маркетинг ЕООД",
  name: "ProMarketing",
  alternateName: ["Pro Marketing LTD", "ProMarketing LTD", "Про Маркетинг"],
  vatId: "BG207223552",
  taxId: "207223552",
  foundingDate: "2024",
  email: "emmgivailopetev38@gmail.com",
  phone: "+359877399963",
  phoneDisplay: "0877 399 963",
  /** Оперативен адрес — Пловдив. Потвърден на 27.08.2026. */
  city: "Пловдив",
  region: "Пловдив",
  country: "BG",
  /**
   * ⚠️ Улица, пощенски код и координати НАРОЧНО липсват.
   *
   * Публикуването на измислен адрес в структурираните данни е по-лошо от
   * липсващ адрес: Google сверява адреса с Google Business Profile и с
   * останалите места, където фирмата се среща, а разминаването сваля
   * доверието към целия локален профил.
   *
   * Попълва се с ТОЧНИЯ адрес в мига, в който профилът в Google Business
   * Profile бъде потвърден — и трябва да съвпада с него буква по буква.
   */
  street: null as string | null,
  postalCode: null as string | null,
  geo: null as { lat: number; lng: number } | null,
  founder: {
    name: "Ивайло Петев",
    jobTitle: "Основател и AI консултант",
    sameAs: [
      "https://www.instagram.com/ivailopetev28",
      "https://www.youtube.com/@promarketingbg",
    ],
  },
  sameAs: [
    "https://www.instagram.com/ivailopetev28",
    "https://www.youtube.com/@promarketingbg",
  ],
  /** Райони, които обслужваме. Пловдив е първи — там е физическото присъствие. */
  areaServed: ["Пловдив", "София", "Варна", "Бургас", "Стара Загора", "България"],
} as const;

/* ---------------------------------------------------------------------
   КЛЮЧОВИ ДУМИ — по клъстери, не на едро.

   Числата идват от два независими източника (27.08.2026):
   1. Google Keyword Planner през Катя Георгиева — „бизнес автоматизация"
      и „виртуален асистент" дават по 10–100 търсения/месец при НИСКА
      конкуренция.
   2. Google Autocomplete (bg/BG), 863 заявки → 903 предложения.

   ⚠️ Капанът: самата дума „автоматизация" на български е окупирана от
   логопедия („автоматизация на звук р") и портални врати. Никога не се
   таргетира сама — винаги с „бизнес", „процеси" или „AI".
   --------------------------------------------------------------------- */

export const KW = {
  core: [
    "AI автоматизация",
    "бизнес автоматизация",
    "автоматизация на бизнес процеси",
    "автоматизация с изкуствен интелект",
    "AI автоматизация за бизнес",
  ],
  agents: [
    "AI агенти",
    "AI агент",
    "AI асистент",
    "виртуален асистент",
    "виртуален асистент цени",
    "AI агент за продажби",
  ],
  chatbot: [
    "чатбот за сайт",
    "AI чатбот",
    "чатбот на български",
    "чатбот с изкуствен интелект",
    "чат бот за Messenger",
  ],
  crm: [
    "CRM система",
    "CRM система България",
    "CRM система цена",
    "AI CRM",
    "автоматизация на продажби",
  ],
  voice: [
    "гласов AI агент",
    "AI глас на български",
    "AI рецепционист",
    "гласов асистент на български",
    "AI за телефонни обаждания",
  ],
  local: [
    "AI автоматизация Пловдив",
    "маркетинг агенция Пловдив",
    "дигитална агенция Пловдив",
    "автоматизация Пловдив",
    "AI Пловдив",
  ],
  vertical: [
    "AI за счетоводство",
    "автоматизация на счетоводството",
    "AI за малък бизнес",
    "AI за онлайн магазин",
    "AI за транспортна фирма",
  ],
  marketing: [
    "AI маркетинг",
    "AI реклами",
    "AI видео реклама",
    "маркетинг агенция",
    "дигитална маркетинг агенция",
  ],
  /** Английски — за международните запитвания. Не се крият никъде;
      живеят на /en и в структурираните данни. */
  en: [
    "AI automation agency Bulgaria",
    "AI agents for business",
    "custom AI CRM",
    "AI voice agent Bulgarian",
    "business process automation Bulgaria",
  ],
} as const;

export const ALL_KEYWORDS: string[] = [
  ...KW.core,
  ...KW.agents,
  ...KW.chatbot,
  ...KW.crm,
  ...KW.voice,
  ...KW.local,
  ...KW.vertical,
  ...KW.marketing,
];

/* ---------------------------------------------------------------------
   Карта на публичните страници → влиза в sitemap.xml.
   `priority` не е желание, а йерархия: началната е 1.0, стълбовете
   0.9, поддържащите под тях.
   --------------------------------------------------------------------- */

export type SitemapEntry = {
  path: string;
  priority: number;
  changeFrequency: "daily" | "weekly" | "monthly" | "yearly";
};

/** Стълбовете — страниците, които трябва да се класират. */
export const PILLAR_PAGES: SitemapEntry[] = [
  { path: "/ai-avtomatizacia", priority: 0.95, changeFrequency: "weekly" },
  { path: "/ai-agenti", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ai-chatbot", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ai-crm", priority: 0.9, changeFrequency: "weekly" },
  { path: "/glasov-ai-agent", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ai-marketing", priority: 0.9, changeFrequency: "weekly" },
  { path: "/ai-avtomatizacia-plovdiv", priority: 0.85, changeFrequency: "monthly" },
];

/** Съществуващите страници, които носят стойност за търсенето. */
export const SUPPORTING_PAGES: SitemapEntry[] = [
  { path: "/demo", priority: 0.8, changeFrequency: "monthly" },
  { path: "/automation-audit", priority: 0.8, changeFrequency: "monthly" },
  { path: "/ai-reshenia", priority: 0.8, changeFrequency: "weekly" },
  { path: "/kurs", priority: 0.7, changeFrequency: "monthly" },
  { path: "/mentor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/jarvis", priority: 0.7, changeFrequency: "monthly" },
  { path: "/plan", priority: 0.6, changeFrequency: "monthly" },
  { path: "/partneri", priority: 0.6, changeFrequency: "monthly" },
  { path: "/model", priority: 0.6, changeFrequency: "monthly" },
  { path: "/strategii", priority: 0.6, changeFrequency: "monthly" },
  { path: "/booking", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/schetovodstvo", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/transport", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/shop", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/proizvodstvo", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/reciklirane", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/ohrana", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/dokumenti", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/b2b", priority: 0.6, changeFrequency: "monthly" },
  { path: "/demo/influencer", priority: 0.6, changeFrequency: "monthly" },
  { path: "/en", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
  { path: "/cookies", priority: 0.2, changeFrequency: "yearly" },
  { path: "/usloviya-kursove", priority: 0.2, changeFrequency: "yearly" },
];

/* ---------------------------------------------------------------------
   Пътища, които НИКОГА не влизат в индекса.

   Клиентските оферти и презентации са тънко, персонално съдържание —
   индексирани, те само разреждат авторитета на домейна и излагат
   имената на клиенти. Админът и API-то нямат работа в търсачка.
   --------------------------------------------------------------------- */
export const PRIVATE_PREFIXES = [
  "/admin",
  "/api",
  "/oferta",
  "/prezentacia",
  "/pitch",
  "/webinar",
  "/trading",
  "/ai-trading",
  "/v2",
  "/kurs/uspeh",
] as const;

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

/** Абсолютен адрес — canonical, OG и JSON-LD винаги искат пълен URL. */
export function abs(path = "/"): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
