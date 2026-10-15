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

/* ---------------------------------------------------------------------
   Социалните профили на Ивайло — ЕДИН списък за всичко: иконите в долния
   колонтитул, блокът „Последвай ме" на началната и `sameAs` в
   структурираните данни (фирмата и човекът). Нов профил се добавя само тук.

   ⚠️ Facebook: адресът по id е нарочен. Двата id-та на страницата
   (106080979260944 и 61550531045329) водят до една и съща страница, а
   id-то, а не името, оцелява при преименуването ѝ.
   ⚠️ LinkedIn НЯМА нарочно — в репото няма реален адрес на профила му, а
   измислен адрес в `sameAs` е по-лош от липсващ. Добавя се тук, щом има.
   --------------------------------------------------------------------- */
export type SocialKey = "youtube" | "instagram" | "tiktok" | "facebook";

export type SocialProfile = {
  /** Уникален ключ на плочката (React key). */
  key: string;
  /** Съвпада с ключа в `components/brands.tsx` — оттам идват иконата и цветът. */
  brand: SocialKey;
  /**
   * В чий `sameAs` влиза адресът: на човека (Ивайло), на фирмата или и двете.
   * Групата не е профил на никого — показва се, но не влиза в `sameAs`.
   */
  sameAs?: readonly ("person" | "org")[];
  label: string;
  /** Кратък ред под името на плочката: потребителското име или „Страницата ми". */
  handle: string;
  href: string;
};

export const SOCIAL_PROFILES: readonly SocialProfile[] = [
  {
    key: "youtube",
    brand: "youtube",
    label: "YouTube",
    handle: "@promarketingbg",
    href: "https://www.youtube.com/@promarketingbg",
  },
  {
    key: "instagram",
    brand: "instagram",
    label: "Instagram",
    handle: "@ivailopetev28",
    href: "https://www.instagram.com/ivailopetev28/",
  },
  {
    key: "tiktok",
    brand: "tiktok",
    label: "TikTok",
    handle: "@petevv",
    href: "https://www.tiktok.com/@petevv",
  },
  {
    key: "facebook",
    brand: "facebook",
    label: "Facebook",
    handle: "Страницата ми",
    href: "https://www.facebook.com/profile.php?id=106080979260944",
  },
  {
    key: "facebook-lichno",
    brand: "facebook",
    label: "Facebook · лично",
    handle: "Ивайло Петев",
    href: "https://www.facebook.com/profile.php?id=61557151023135",
    sameAs: ["person"],
  },
  {
    key: "ai-balgaria",
    brand: "facebook",
    label: "AI България",
    handle: "групата ми във Facebook",
    href: "https://www.facebook.com/groups/aizabiznesa",
    sameAs: [],
  },
];

/** Адресите за `sameAs` на човека или на фирмата (по подразбиране профилът е и на двамата). */
function sameAsFor(who: "person" | "org"): string[] {
  return SOCIAL_PROFILES.filter((p) => (p.sameAs ?? ["person", "org"]).includes(who)).map((p) => p.href);
}

/* ---------------------------------------------------------------------
   Petev.ai — AI платформата за фирми на Ивайло. Отделен ПРОДУКТ, не социален
   профил: нарочно НЕ е в SOCIAL_PROFILES и затова не влиза в `sameAs`.
   Показва се като обикновена връзка във футъра и под плочките на началната.
   --------------------------------------------------------------------- */
export const PETEVAI = {
  label: "Petev.ai",
  tagline: "AI платформа за фирми",
  href: "https://petevai.com",
} as const;

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
    sameAs: sameAsFor("person"),
  },
  sameAs: sameAsFor("org"),
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
  { path: "/narachnik", priority: 0.7, changeFrequency: "monthly" },
  { path: "/ai-reshenia", priority: 0.8, changeFrequency: "weekly" },
  { path: "/kurs", priority: 0.7, changeFrequency: "monthly" },
  { path: "/mentor", priority: 0.7, changeFrequency: "monthly" },
  { path: "/jarvis", priority: 0.7, changeFrequency: "monthly" },
  { path: "/robot", priority: 0.6, changeFrequency: "weekly" },
  { path: "/plan", priority: 0.6, changeFrequency: "monthly" },
  { path: "/partneri", priority: 0.6, changeFrequency: "monthly" },
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
  // Вътрешен документ за продуктовия модел (имена, маржове, план) — от 04.10.2026.
  "/model",
] as const;

export function isPrivatePath(path: string): boolean {
  return PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

/** Абсолютен адрес — canonical, OG и JSON-LD винаги искат пълен URL. */
export function abs(path = "/"): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
