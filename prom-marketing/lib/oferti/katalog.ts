/**
 * Каталогът на офертите (06.11.2026) — модулите, от които се сглобява всяка оферта,
 * и примерните шаблони. Текстовете тук са КЪМ КЛИЕНТА (отиват в PDF-а и на
 * /oferta/<код>), затова без вътрешни бележки. Цените идват от стълбата
 * (components/admin/skript/pricing-data.ts); когато модул няма цена (маркетинг,
 * автоматизация по мярка, сайт), тя се дава от Ивайло за конкретния човек.
 */
import { LEVELS, DOWNSELL } from "@/components/admin/skript/pricing-data";

export type OfferUnit = "еднократно" | "/мес";
export type VatMode = "incl" | "excl" | "none";
export type GreetingForm = "ti" | "vie";
export type SellerKey = "georgi" | "ivailo";
export type ModuleGroup = "programa" | "sistema" | "softuer" | "uslugi" | "custom";

export interface Installment {
  term: string;
  monthly: number;
}

export interface OfferModule {
  key: string;
  group: ModuleGroup;
  title: string;
  subtitle: string;
  bullets: string[];
  outcome?: string;
  not_included?: string[];
  price: number | null;
  unit: OfferUnit;
  setup_price?: number;
  setup_label?: string;
  installments?: Installment[];
  /** цената се дава от Ивайло за конкретния човек — без нея офертата не се прави */
  needs_price?: boolean;
  tint: string;
  badge?: string;
  /** за продавача и асистента — НЕ отива към клиента */
  za_prodavacha?: string;
}

/** Ред в офертата — снимка на модула към момента на създаване + поправките за човека. */
export interface OfferItem {
  key: string;
  title: string;
  subtitle?: string;
  bullets: string[];
  outcome?: string;
  not_included?: string[];
  price: number | null;
  unit: OfferUnit;
  setup_price?: number | null;
  setup_label?: string;
  installments?: Installment[];
  qty?: number;
  note?: string;
  tint?: string;
}

export interface OfferContent {
  greeting: GreetingForm;
  seller: SellerKey;
  client_name?: string;
  client_company?: string;
  /** уводът — ако липсва, се сглобява от шаблона */
  intro?: string;
  /** „Ти каза, че…“ — какво е казал човекът на срещата */
  pain?: string;
  /** какво получава накратко — една мисъл */
  outcome?: string;
  next_steps: string[];
  terms: string[];
  ps?: string;
}

export interface OfferTemplate {
  key: string;
  name: string;
  description: string;
  items: OfferItem[];
  content: Partial<OfferContent>;
  vat_mode: VatMode;
  sort_order: number;
  active: boolean;
}

export interface Seller {
  key: SellerKey;
  name: string;
  first: string;
  role: string;
  phone: string;
  phone_raw: string;
  email: string;
  team_member_id: string | null;
}

export const SELLERS: Record<SellerKey, Seller> = {
  georgi: {
    key: "georgi",
    name: "Георги Мандаджиев",
    first: "Георги",
    role: "екипът на Ивайло Петев · ProMarketing",
    phone: "+359 884 062 065",
    phone_raw: "+359884062065",
    email: "george.mandadzhiev@gmail.com",
    team_member_id: "fe84af72-1344-4331-9730-445fc096b87c",
  },
  ivailo: {
    key: "ivailo",
    name: "Ивайло Петев",
    first: "Ивайло",
    role: "основател · ProMarketing",
    phone: "+359 877 399 963",
    phone_raw: "+359877399963",
    email: "emmgivailopetev38@gmail.com",
    team_member_id: null,
  },
};

export const IVAILO_EMAIL = SELLERS.ivailo.email;
export const SITE = "https://promarketing.pw";
export const VAT_MODE_LABEL: Record<VatMode, string> = {
  incl: "Всички цени са с включен ДДС.",
  excl: "Цените са без ДДС — ДДС 20 % се начислява на фактурата.",
  none: "",
};

const eur = (s: string): number => Number(s.replace(/[^\d]/g, "")) || 0;
const level = (numeral: "I" | "II" | "III") => LEVELS.find((l) => l.numeral === numeral)!;
const inst = (numeral: "I" | "II" | "III"): Installment[] =>
  level(numeral).installments.map((i) => ({ term: i.term, monthly: eur(i.monthly) }));

export const MODULES: OfferModule[] = [
  {
    key: "nivo-0",
    group: "programa",
    title: `Ниво 0 · ${DOWNSELL.name}`,
    subtitle: "Курсът и машината — учиш в свое темпо, 12 месеца",
    price: eur(DOWNSELL.price),
    unit: "еднократно",
    tint: "#64748b",
    bullets: [
      "12 месеца достъп до Академията — всички записани обучения, стъпка по стъпка",
      "Petev.ai за 12 месеца — AI-ят, с който сам си правиш CRM-а и автоматизациите",
      "2 групови срещи на месец с Ивайло — въпроси, отговори и разбор на твоите случаи",
      "Общността — хората, които строят същото като теб",
    ],
    outcome: "Своя CRM и първите автоматизации — направени от теб, в твоето темпо.",
    installments: [{ term: "12 мес.", monthly: 187 }],
    za_prodavacha: "Даунселът от 3 900 — „искам курса, не срещи“. Георги може до 2 500 €.",
  },
  {
    key: "nivo-1",
    group: "programa",
    title: `Ниво I · ${level("I").name}`,
    subtitle: "4 месеца — научаваш се и го правиш по време на програмата",
    price: eur(level("I").price),
    unit: "еднократно",
    tint: "#06b6d4",
    bullets: [
      "4 месеца · 2 групови живи обучения на седмица + 1 лична среща с Ивайло на месец",
      "Академията (всички записани обучения) + Petev.ai — най-високият план, включен за 4-те месеца",
      "Онбординг: обаждане от Ивайло до 2 часа след влизането + личен план за твоя бизнес",
      "След 4-те месеца продължаваш с Petev.ai по план, който избираш",
    ],
    outcome:
      "CRM + автоматичен follow-up на всяко запитване (съобщения, имейли, телефон) + 3 свои процеса, които вървят без теб.",
    installments: inst("I"),
    za_prodavacha: "Само обучение + автоматизации — за този, на когото маркетингът (още) не трябва.",
  },
  {
    key: "nivo-2",
    group: "programa",
    title: `Ниво II · ${level("II").name}`,
    subtitle: "Маркетинг, продажби и SEO с AI — привличаш клиенти и растеш",
    price: eur(level("II").price),
    unit: "еднократно",
    tint: "#f0c87a",
    badge: "най-избираната",
    bullets: [
      "Всичко от Ниво I: 4 месеца живи обучения, Академията, Petev.ai, онбординг и личен план",
      "Маркетинг с AI: реклами, социални мрежи, съдържание и фунии, които сами водят клиенти",
      "Продажби и SEO с AI — курсът по SEO е вътре",
      "2 лични срещи с Ивайло на месец + личен план за приходи",
    ],
    outcome: "Машина за клиенти: реклама + съдържание + follow-up, които вървят сами — построена от теб.",
    installments: inst("II"),
    za_prodavacha: "ОСНОВНАТА оферта — „не пускам реклами и нямам клиенти“.",
  },
  {
    key: "nivo-3",
    group: "programa",
    title: `Ниво III · ${level("III").name}`,
    subtitle: "Ивайло строи с теб — лична среща всяка седмица, само 5 места",
    price: eur(level("III").price),
    unit: "еднократно",
    tint: "#a855f7",
    badge: "5 места",
    bullets: [
      "Всичко от Ниво II",
      "Лична среща с Ивайло всяка седмица — 16 за 4-те месеца, строим на екран заедно",
      "Директен Viber с Ивайло + приоритет при всичко",
      "Само 5 места наведнъж",
    ],
    outcome: "Работеща машина за клиенти и първите клиенти от нея — построени заедно с Ивайло.",
    installments: inst("III"),
    za_prodavacha: "Ъпселът след Ниво II — за този, който вече иска повече Ивайло.",
  },
  {
    key: "komanden",
    group: "sistema",
    title: "Команден център · правим го ние",
    subtitle: "Цялата система — построена и поддържана от нас, 1 година поддръжка включена",
    price: 7900,
    unit: "еднократно",
    tint: "#a855f7",
    bullets: [
      "CRM + сайт + автоматизации — 8+ процеса: от запитването до фактурата, автоматичен follow-up",
      "Маркетинг: реклама и съдържание, които водят клиенти",
      "Ели — гласов AI агент: звъни до минути на всеки нов лийд, букира срещи, напомня",
      "Обучение на екипа ти по AI — за да не зависиш от нас",
      "1 година поддръжка и подобрения — включени",
    ],
    not_included: [
      "Абонаментите за AI инструментите (ChatGPT / Claude) — на твое име",
      "Рекламният бюджет — плаща се директно към Meta / Google",
    ],
    outcome: "Всичко на едно място — CRM, сайт, реклама, гласов агент и обучен екип. Една цена, една година без грижи.",
    za_prodavacha: "Една оферта, без месечна такса в началото. Поддръжката (180–280 €/мес) се договаря на 10-ия месец.",
  },
  {
    key: "eli",
    group: "softuer",
    title: "Ели · гласов AI агент",
    subtitle: "Звъни до минути на всеки нов лийд, букира срещи и напомня",
    price: 300,
    unit: "/мес",
    setup_price: 500,
    setup_label: "внедряване: скриптът, гласът и настройката",
    tint: "#06b6d4",
    bullets: [
      "Звъни на всеки нов лийд до минути — от сайта, рекламата или формата",
      "Букира срещи направо в календара ти и праща потвърждение",
      "Напомня преди срещата и звъни пак на неявилите се",
      "300 минути разговори на месец включени, после 0,40 €/мин",
    ],
    outcome: "Нито едно запитване без обаждане — и срещи в календара, без ти да звъниш.",
  },
  {
    key: "petevai",
    group: "softuer",
    title: "Petev.ai",
    subtitle: "CRM + автоматизации + обученията — машината, с която работиш сам",
    price: 199,
    unit: "/мес",
    tint: "#06b6d4",
    bullets: [
      "CRM за клиентите и запитванията",
      "AI, който ти строи автоматизациите",
      "Всички записани обучения на Академията",
      "Без ангажимент за срещи — надграждаш, когато си готов",
    ],
    outcome: "Системата ти работи от първия ден.",
    za_prodavacha: "Входът и продължението. Вноските се приспадат при влизане в обучението до 90 дни.",
  },
  {
    key: "petevai-ekip",
    group: "softuer",
    title: "Petev.ai · екип",
    subtitle: "За фирма с екип — всички вътре, в една система",
    price: 399,
    unit: "/мес",
    tint: "#06b6d4",
    bullets: ["До 5 потребители", "Общ CRM и общи автоматизации", "Приоритетна поддръжка"],
    outcome: "Целият екип в една система — без прехвърляне на информация между хора.",
  },
  {
    key: "marketing",
    group: "uslugi",
    title: "Маркетинг с AI · реклама и съдържание",
    subtitle: "Реклама, която води клиенти, и съдържание, което върви само",
    price: null,
    unit: "/мес",
    needs_price: true,
    tint: "#f0c87a",
    bullets: [
      "Реклама в Meta / Google за действие — запитвания, обаждания, поръчки (бюджетът е отделно)",
      "Съдържание за мрежите: видеа, снимки, текстове — одобрени от теб преди публикуване",
      "Автоматичен follow-up на всяко запитване",
      "Месечен отчет с числата: цена на запитване, срещи, продажби",
    ],
    not_included: ["Рекламният бюджет — плаща се директно към Meta / Google"],
    outcome: "Клиенти всеки месец — от реклама и съдържание, които вървят без теб.",
    za_prodavacha: "Цената е за конкретния човек — дава я Ивайло. Без цена от него модулът не влиза в оферта.",
  },
  {
    key: "avtomatizacia",
    group: "uslugi",
    title: "AI автоматизация по мярка",
    subtitle: "Конкретен процес в бизнеса ти — построен от нас и обяснен на екипа",
    price: null,
    unit: "еднократно",
    needs_price: true,
    tint: "#06b6d4",
    bullets: [
      "Разглеждаме процеса заедно и го описваме стъпка по стъпка",
      "Строим автоматизацията и я тестваме с истински случаи",
      "Обучаваме хората, които ще я ползват",
      "Поддръжка на договореното — включена",
    ],
    outcome: "Процесът върви сам — без ръчна работа и без грешки.",
    za_prodavacha: "Цената — от Ивайло, според процеса.",
  },
  {
    key: "sait",
    group: "uslugi",
    title: "Сайт, който води клиенти",
    subtitle: "Бърз, ясен, с форма и проследяване — свързан с CRM-а",
    price: null,
    unit: "еднократно",
    needs_price: true,
    tint: "#06b6d4",
    bullets: [
      "Структура и текстове, написани за клиента, не за нас",
      "Форма за запитване с телефон + автоматичен отговор до минути",
      "Проследяване (Meta Pixel, Google) — виждаш откъде идват хората",
      "Свързан с CRM-а: всяко запитване става картон",
    ],
    outcome: "Сайт, който не просто „го има“, а носи запитвания.",
    za_prodavacha: "Цената — от Ивайло.",
  },
  {
    key: "custom",
    group: "custom",
    title: "Друго (по мярка)",
    subtitle: "",
    price: null,
    unit: "еднократно",
    needs_price: true,
    tint: "#64748b",
    bullets: [],
    za_prodavacha: "Свободен ред: заглавие, точки и цена се дават изцяло — цената от Ивайло.",
  },
];

export const MODULE_BY_KEY: Record<string, OfferModule> = Object.fromEntries(MODULES.map((m) => [m.key, m]));

export const GROUP_LABEL: Record<ModuleGroup, string> = {
  programa: "Програмата · научаваш се",
  sistema: "Системата · правим го ние",
  softuer: "Софтуерът · Petev.ai и Ели",
  uslugi: "Услуги · по мярка",
  custom: "Друго",
};

/* ------------------------------------------------------------------ */
/* Примерните оферти (шаблоните). Текстовете приемат {име}, {фирма},      */
/* {продавач}, {дата} — попълват се за човека.                           */
/* ------------------------------------------------------------------ */

const STEPS_PROGRAMA = [
  "Казваш „да“ — по телефона, във Viber или с отговор на този имейл.",
  "Обаждане от Ивайло до 2 часа — личен план и първите стъпки за твоя бизнес.",
  "Същия ден получаваш достъп до Академията и Petev.ai и започваш.",
  "Живите обучения вървят всяка седмица — ти строиш, ние сме до теб.",
];
const TERMS_PROGRAMA = [
  "Плащане наведнъж или на вноски през TBI Bank — одобрение онлайн за минути, без посещение в банка.",
  "Депозит 200 € пази мястото и се връща напълно, ако банката не одобри вноските.",
  "Petev.ai (най-високият план) е включен за 4-те месеца на програмата; после продължаваш по план, който избираш.",
  "Офертата е валидна до {дата}.",
];
const STEPS_SISTEMA = [
  "Казваш „да“ и плащаме първата половина.",
  "Среща за старт: описваме процесите, достъпите и приоритетите — до 1 час.",
  "Строим на етапи и ти показваме всяка готова част — одобряваш, преди да тръгне.",
  "Предаване + обучение на екипа ти. От този ден тече 1-годишната поддръжка.",
];
const TERMS_SISTEMA = [
  "50 % при старт, 50 % при предаване на работещата система.",
  "1 година поддръжка и подобрения са включени; след това се договаря месечна поддръжка.",
  "Абонаментите за AI инструментите и рекламният бюджет са на твое име и не влизат в цената.",
  "Офертата е валидна до {дата}.",
];
const STEPS_ELI = [
  "Казваш „да“ и ни даваш 20 минути — скриптът, гласът и кога да звъни.",
  "Настройваме Ели и я свързваме с формата, сайта или рекламата ти.",
  "Тестваме заедно с истински обаждания и поправяме тона до твоето „това е то“.",
  "Ели тръгва — ти получаваш само записите и срещите в календара.",
];
const TERMS_ELI = [
  "Внедряването е еднократно; абонаментът започва от първия работен ден на Ели.",
  "300 минути разговори на месец са включени; над тях — 0,40 €/мин.",
  "Без обвързване — спираш с 1 месец предизвестие.",
  "Офертата е валидна до {дата}.",
];
const STEPS_USLUGI = [
  "Казваш „да“ — по телефона, във Viber или с отговор на този имейл.",
  "Среща за старт: цели, достъпи и първите неща, които тръгват — до 1 час.",
  "Показваме ти всяко нещо, преди да тръгне. Нищо не излиза без твоето одобрение.",
  "Всеки месец — кратък отчет с числата и какво правим следващия месец.",
];
const TERMS_USLUGI = [
  "Месечните услуги се плащат в началото на месеца; еднократните — 50 % при старт, 50 % при предаване.",
  "Рекламният бюджет и абонаментите за инструментите са на твое име и не влизат в цената.",
  "Офертата е валидна до {дата}.",
];

const item = (key: string, o: Partial<OfferItem> = {}): OfferItem => {
  const m = MODULE_BY_KEY[key];
  return {
    key: m.key,
    title: m.title,
    subtitle: m.subtitle,
    bullets: [...m.bullets],
    outcome: m.outcome,
    not_included: m.not_included ? [...m.not_included] : undefined,
    price: m.price,
    unit: m.unit,
    setup_price: m.setup_price ?? null,
    setup_label: m.setup_label,
    installments: m.installments ? m.installments.map((i) => ({ ...i })) : undefined,
    qty: 1,
    tint: m.tint,
    ...o,
  };
};

export const DEFAULT_TEMPLATES: OfferTemplate[] = [
  {
    key: "programa-2",
    name: "Програмата · Ниво II „Пари с AI“ (основната)",
    description: "За собственика без достатъчно клиенти — маркетинг, продажби и SEO с AI. Това предлагаме на повечето хора.",
    items: [item("nivo-2")],
    content: {
      greeting: "ti",
      intro: "Благодаря за разговора с {продавач}. Ето какво предлагаме за {фирма} — накратко, както говорихме.",
      outcome: "След 4 месеца имаш реклама, която върви сама, и система, която затваря — построени от теб, с нас до теб.",
      next_steps: STEPS_PROGRAMA,
      terms: TERMS_PROGRAMA,
    },
    vat_mode: "incl",
    sort_order: 1,
    active: true,
  },
  {
    key: "programa-1",
    name: "Програмата · Ниво I „AI автоматизация на бизнеса“",
    description: "Само обучение + автоматизации — за този, който иска да спести време и пари от екип и изпълнители.",
    items: [item("nivo-1")],
    content: {
      greeting: "ti",
      intro: "Благодаря за разговора с {продавач}. Ето какво предлагаме за {фирма} — накратко, както говорихме.",
      outcome: "След 4 месеца процесите, които сега ти взимат часове, ги прави машината — и ти знаеш как да я смениш.",
      next_steps: STEPS_PROGRAMA,
      terms: TERMS_PROGRAMA,
    },
    vat_mode: "incl",
    sort_order: 2,
    active: true,
  },
  {
    key: "programa-3",
    name: "Програмата · Ниво III „Едно на едно с Ивайло“",
    description: "Най-бързият път — лична среща с Ивайло всяка седмица. Ъпселът за този, който иска най-много внимание.",
    items: [item("nivo-3")],
    content: {
      greeting: "ti",
      intro: "Благодаря за разговора с {продавач}. Ето какво предлагаме за {фирма} — накратко, както говорихме.",
      outcome: "Най-скъпото е да го правиш сам цяла година. Тук го правим заедно за 4 месеца.",
      next_steps: STEPS_PROGRAMA,
      terms: TERMS_PROGRAMA,
    },
    vat_mode: "incl",
    sort_order: 3,
    active: true,
  },
  {
    key: "samoobuchenie",
    name: "Ниво 0 · Самообучение",
    description: "„Искам курса, не срещи“ — видеата + Petev.ai за година + 2 групови срещи на месец.",
    items: [item("nivo-0")],
    content: {
      greeting: "ti",
      intro: "Благодаря за разговора с {продавач}. Ето варианта, за който говорихме — курсът и машината, в твоето темпо.",
      outcome: "Само софтуерът струва толкова за година. Тук е той, плюс целия курс и две срещи на месец, където питаш каквото искаш.",
      next_steps: [
        "Казваш „да“ — по телефона, във Viber или с отговор на този имейл.",
        "Същия ден получаваш достъп до Академията и Petev.ai.",
        "Гледаш в свое темпо; два пъти в месеца сме заедно на живо за твоите въпроси.",
      ],
      terms: [
        "Плащане наведнъж или на 12 вноски през TBI Bank (≈ 187 €/мес).",
        "Достъпът е за 12 месеца от деня на плащането.",
        "Офертата е валидна до {дата}.",
      ],
    },
    vat_mode: "incl",
    sort_order: 4,
    active: true,
  },
  {
    key: "komanden",
    name: "Команден център · правим го ние",
    description: "„Нямам време да уча — направете ми го“. Цялата система, построена от нас, с 1 година поддръжка.",
    items: [item("komanden")],
    content: {
      greeting: "ti",
      intro: "Благодаря за разговора с {продавач}. Ето какво предлагаме за {фирма}: строим всичко ние и го поддържаме една година.",
      outcome: "Всичко на едно място — CRM, сайт, реклама, гласов агент и обучен екип. Една цена, една година без грижи.",
      next_steps: STEPS_SISTEMA,
      terms: TERMS_SISTEMA,
    },
    vat_mode: "incl",
    sort_order: 5,
    active: true,
  },
  {
    key: "eli",
    name: "Само Ели · гласов AI агент",
    description: "Частична оферта: гласовият агент, който звъни до минути на всеки нов лийд и букира срещи.",
    items: [item("eli")],
    content: {
      greeting: "ti",
      intro: "Благодаря за разговора с {продавач}. Ето как Ели поема обажданията за {фирма}.",
      outcome: "Нито едно запитване без обаждане — и срещи в календара, без ти да звъниш.",
      next_steps: STEPS_ELI,
      terms: TERMS_ELI,
    },
    vat_mode: "incl",
    sort_order: 6,
    active: true,
  },
  {
    key: "marketing",
    name: "Само маркетинг · реклама и съдържание",
    description: "Частична оферта: реклама за действие + съдържание за мрежите. Цената се дава от Ивайло за конкретния човек.",
    items: [item("marketing")],
    content: {
      greeting: "ti",
      intro: "Благодаря за разговора с {продавач}. Ето какво предлагаме за {фирма}, за да идват клиенти всеки месец.",
      outcome: "Клиенти всеки месец — от реклама и съдържание, които вървят без теб.",
      next_steps: STEPS_USLUGI,
      terms: TERMS_USLUGI,
    },
    vat_mode: "incl",
    sort_order: 7,
    active: true,
  },
  {
    key: "programa-2-eli",
    name: "Програмата Ниво II + Ели",
    description: "Основната оферта + гласовият агент, който звъни на лийдовете, докато човекът учи.",
    items: [item("nivo-2"), item("eli")],
    content: {
      greeting: "ti",
      intro: "Благодаря за разговора с {продавач}. Ето какво предлагаме за {фирма} — програмата, с която строиш машината за клиенти, и Ели, която звъни на всеки лийд от първия ден.",
      outcome: "След 4 месеца имаш реклама, която върви сама, система, която затваря, и гласов агент, който не пропуска запитване.",
      next_steps: STEPS_PROGRAMA,
      terms: [...TERMS_PROGRAMA.slice(0, 3), TERMS_ELI[1], TERMS_ELI[2], "Офертата е валидна до {дата}."],
    },
    vat_mode: "incl",
    sort_order: 8,
    active: true,
  },
];

/** Стъпки/условия по подразбиране според най-тежкия модул — за оферта без шаблон. */
export function defaultStepsFor(items: Pick<OfferItem, "key">[]): { next_steps: string[]; terms: string[] } {
  const keys = new Set(items.map((i) => i.key));
  if ([...keys].some((k) => k.startsWith("nivo-"))) return { next_steps: STEPS_PROGRAMA, terms: TERMS_PROGRAMA };
  if (keys.has("komanden")) return { next_steps: STEPS_SISTEMA, terms: TERMS_SISTEMA };
  if (keys.has("eli") && keys.size === 1) return { next_steps: STEPS_ELI, terms: TERMS_ELI };
  return { next_steps: STEPS_USLUGI, terms: TERMS_USLUGI };
}
