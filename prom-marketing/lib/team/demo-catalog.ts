/* ---------------------------------------------------------------------------
   „Демо“ в /ekip — всичко, което клоузърът показва на среща, на едно място
   (04.11.2026, срещата с Георги: „тук не се отваря нищо… имаш ли други
   демота“ → Ивайло: „ще ти ги вкарам всичките в лентата“).

   Правилата:
   • Тук влиза само безопасно за показване: измислени данни (Палубата,
     JARVIS, гласовото демо, браншовите демота), публични страници на сайта
     и видеа, които клиентът е одобрил или вече са на сайта.
   • Портфолиото е само с видеа, в които AI е потвърден в метаданните на
     самия файл (EU AI Act чл. 50) — ред `ai` казва какво точно е AI.
   • Цени тук няма — те са в /ekip/ceni.
--------------------------------------------------------------------------- */

import { VERTICALS, VERTICAL_ORDER } from "@/app/demo/verticals";
import { VIDEA as NASHI_VIDEA } from "@/lib/site/uspehi";

export interface DemoLink {
  href: string;
  title: string;
  text: string;
  /** кога да го пуснеш — едно изречение за клоузъра */
  when?: string;
  badge?: string;
}

export interface DemoSection {
  id: string;
  title: string;
  sub: string;
  links: DemoLink[];
}

/** Пакетът на /pregled с ключ demo-… — нищо не се записва и не се праща (lib/pregled/types.ts isDemoKey). */
export const DEMO_PREGLED_HREF = "/pregled/demo-video-bcec2c87f58f3743";

/** Ели вдига и записва среща. До пренасочването на 0876 447 159 е на този номер. */
export const ELI_PHONE_DISPLAY = "+1 509 351 1914";
export const ELI_PHONE_TEL = "+15093511914";

export const AKADEMIA_KURS = {
  title: "AI видео реклами, които спират палеца",
  lessons: [
    "Офертата преди картинката",
    "Реалността в първите 6 секунди",
    "Глас, а не брошура",
    "Сцени с Veo",
    "Чист български говор",
    "Субтитри и безопасни зони",
    "Разнообразие",
    "Проверка преди пускане",
  ],
  href: "https://akademia.promarketing.pw/stalbichka",
};

export const DEMO_SECTIONS: DemoSection[] = [
  {
    id: "sistema",
    title: "🧠 Системата — с измислени данни",
    sub: "Фирмата в демото е измислена, затова можеш спокойно да споделиш екрана.",
    links: [
      {
        href: "/admin/deck",
        title: "Командната палуба",
        text: "Целият бизнес на един екран: лийдове, срещи, пари и задачи.",
        when: "Започни с нея на всяка среща за CRM.",
        badge: "⭐ първо това",
      },
      {
        href: "/admin/jarvis",
        title: "JARVIS",
        text: "AI асистентът на фирмата. Питаш го „какво стана днес“ и той ти казва.",
        when: "За собственик, който иска да знае всичко, без да рови.",
      },
      {
        href: "/admin/demo-glas",
        title: "Гласово демо · автосервиз",
        text: "Говориш с AI рецепцията на измислен автосервиз.",
        when: "Когато човекът иска сам да чуе гласов агент.",
      },
      {
        href: "/prezentacia/demo",
        title: "AI CRM · Командният център",
        text: "Презентацията на системата: какво поема и какво печели собственикът.",
        when: "Когато искаш да покажеш цялата картина за 3 минути.",
      },
      {
        href: "/demo",
        title: "ProMarketing OS · 16 AI агента",
        text: "Голямото демо: всички агенти, които работят едновременно.",
        when: "За по-голяма фирма с екип.",
      },
    ],
  },
  {
    id: "bransh",
    title: "🏭 Демо по бранш — от сайта",
    sub: "Избери бранша на човека. Натиска „пусни автоматизациите“ и гледа как работи неговият бизнес.",
    links: VERTICAL_ORDER.map((v) => ({ href: `/demo/${v}`, title: VERTICALS[v].name, text: VERTICALS[v].card })),
  },
  {
    id: "glas",
    title: "📞 AI гласов агент — на живо",
    sub: "Най-силното демо е, когато клиентът сам чуе агента.",
    links: [
      {
        href: `tel:${ELI_PHONE_TEL}`,
        title: `Ели · ${ELI_PHONE_DISPLAY}`,
        text: "Ели вдига и записва среща. Звъни от твоя телефон на високоговорител, докато клиентът слуша.",
        when: "Международен разговор, плаща се по плана ти. Тестовата среща влиза в календара, после я откажи.",
        badge: "звънни",
      },
      {
        href: "/glas",
        title: "Гласов агент в браузъра",
        text: "Клиентът говори с агента направо от сайта, без телефон и без такси.",
        when: "Прати му линка, докато сте на срещата.",
      },
      {
        href: "/jarvis",
        title: "JARVIS · публичната страница",
        text: "Какво прави AI асистентът. Тази можеш да пратиш на клиента след срещата.",
      },
    ],
  },
  {
    id: "video",
    title: "🎬 Видеата — как работим с клиента",
    sub: "Правим видеата, клиентът ги гледа на една страница, одобрява с един бутон и пише какво да сменим.",
    links: [
      {
        href: DEMO_PREGLED_HREF,
        title: "Страницата за одобрение · демо",
        text: "Точно това получава клиентът: гледа, натиска „Одобрявам“ или „Не този“ и оставя бележка.",
        when: "Демо е: бутоните работят, но нищо не се записва и не стига до никого.",
        badge: "⭐ покажи го",
      },
      {
        href: "/uspehi",
        title: "Успехи и зад кадър",
        text: "Нашите числа от CRM-а, нашите видеа и кадри от срещите.",
        when: "Когато човекът се съмнява дали работи.",
      },
    ],
  },
];

export interface PortfolioVideo {
  src: string;
  poster: string;
  title: string;
  /** кой е клиентът / бранш */
  who: string;
  /** какво точно е AI — от метаданните на файла */
  ai: string;
}

/**
 * Клиентски видеа: одобрени от клиента в /pregled или вече на началната
 * страница. AI е проверен в метаданните на файла (TripAway, Homers) или е
 * обявен на сайта (Alinée, Сигма — lib/seo/home-content.ts).
 */
const KLIENTSKI: PortfolioVideo[] = [
  { src: "/videa/tripaway-s1-t04.mp4", poster: "/videa/tripaway-s1-t04.jpg", title: "Най-красивият риф на 3 часа от София", who: "Туристическа агенция", ai: "AI глас" },
  { src: "/videa/tripaway-s1-a01.mp4", poster: "/videa/tripaway-s1-a01.jpg", title: "Шарм ел-Шейх · All Inclusive · за твоя бюджет", who: "Туристическа агенция · реклама", ai: "AI глас" },
  { src: "/videa/tripaway-s1-n01.mp4", poster: "/videa/tripaway-s1-n01.jpg", title: "Нова година 2027 в Шарм", who: "Туристическа агенция · оферта", ai: "AI глас" },
  { src: "/videa/homers-m3-mechta.mp4", poster: "/videa/homers-m3-mechta.jpg", title: "Не инвестиция — ДОМ", who: "Строителна фирма", ai: "AI глас" },
  { src: "/videa/homers-m3-k22.mp4", poster: "/videa/homers-m3-k22.jpg", title: "Къщата за 20 секунди", who: "Строителна фирма", ai: "AI глас" },
  { src: "/videa/homers-m3-p20.mp4", poster: "/videa/homers-m3-p20.jpg", title: "Преди и след", who: "Строителна фирма · обектът", ai: "AI глас" },
  { src: "/videa/homers-m3-at1.mp4", poster: "/videa/homers-m3-at1.jpg", title: "Само 3 парцела", who: "Строителна фирма · нов проект", ai: "AI глас" },
  { src: "/videa/alinee-ai-videa.mp4", poster: "/videa/alinee-ai-videa.jpg", title: "AI реклама за парфюмерия", who: "Онлайн магазин", ai: "AI видео" },
  { src: "/videa/sigma-kasko-lizing.mp4", poster: "/videa/sigma-kasko-lizing.jpg", title: "Каско и лизинг", who: "Застрахователен брокер", ai: "AI видео" },
];

export const PORTFOLIO: PortfolioVideo[] = [
  ...KLIENTSKI,
  ...NASHI_VIDEA.map((v) => ({
    src: `/videa/${v.slug}.mp4`,
    poster: `/videa/${v.slug}.jpg`,
    title: v.title,
    who: `ProMarketing · ${v.scene}`,
    ai: v.ai ?? "AI глас",
  })),
];

/** Трите правила от срещата на 04.11 — над шпаргалката, защото решават срещата. */
export const PRAVILA_0411 = [
  "Всички, които решават, са на срещата. „Кой още решава с теб? Да го включим и него.“ Чуеш ли „ще говоря с партньора“, веднага предлагаш общ разговор с дата.",
  "5–20 минути преди срещата пращаш линка и звъниш. Не дойде ли, записваш нов час още същия ден.",
  "3 обаждания без отговор и спираш. Времето отива при следващия.",
];
