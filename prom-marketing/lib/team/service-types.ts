/**
 * Видовете услуга — това, „какъв е клиентът“. По вида:
 * - проектът получава готов чеклист от задачи (за да не се измислят всеки път),
 * - някои от тях са видими за клиента в портала му,
 * - комисионната се смята по правилото за този вид,
 * - съобщенията към клиента тръгват от готов шаблон.
 *
 * Чисти данни и функции, без база — тестват се и се ползват и от клиента.
 */
import type { TeamRole } from "./types";

export const SERVICE_TYPES = [
  "marketing",
  "website",
  "crm_build",
  "crm_support",
  "automation",
  "voice_agent",
  "training",
  "other",
] as const;
export type ServiceType = (typeof SERVICE_TYPES)[number];

export const SERVICE_TYPE_LABEL: Record<ServiceType, string> = {
  marketing: "Маркетинг · реклами и съдържание",
  website: "Уебсайт",
  crm_build: "CRM · изграждане",
  crm_support: "CRM · поддръжка",
  automation: "AI автоматизация",
  voice_agent: "Гласов агент",
  training: "Обучение / менторство",
  other: "Друго",
};

export const SERVICE_TYPE_EMOJI: Record<ServiceType, string> = {
  marketing: "📣",
  website: "🌐",
  crm_build: "🧩",
  crm_support: "🛠",
  automation: "🤖",
  voice_agent: "🎙️",
  training: "🎓",
  other: "📦",
};

/** Кой по подразбиране движи проект от този вид. */
export const SERVICE_DEFAULT_ROLE: Record<ServiceType, TeamRole> = {
  marketing: "marketing",
  website: "delivery",
  crm_build: "delivery",
  crm_support: "delivery",
  automation: "delivery",
  voice_agent: "delivery",
  training: "owner",
  other: "delivery",
};

export interface TemplateTask {
  title: string;
  /** след колко дни от старта е срокът; без число = без срок */
  days?: number;
  /** клиентът я вижда в портала си и може да я отметне като одобрена */
  client?: boolean;
}

/**
 * Чеклистите. Редът е редът на работата. „client: true“ са стъпките, при които
 * клиентът трябва да даде/одобри нещо — те излизат в портала му с бутон.
 */
export const SERVICE_TEMPLATES: Record<ServiceType, TemplateTask[]> = {
  marketing: [
    { title: "Достъпи: Business Manager, рекламен акаунт, страница, пиксел", days: 1, client: true },
    { title: "Одит на профила: какво е работило досега, какво е горяло пари", days: 2 },
    { title: "Пиксел + CAPI проверка (събитията стигат, cookie банерът не ги души)", days: 3 },
    { title: "Оферта и обещание: едно изречение, което казваме в рекламата", days: 3, client: true },
    { title: "Материал от клиента: снимки/кадри/логото в оригинал", days: 3, client: true },
    { title: "Креативи A/B/C (видео с глас, не брошура) — прокурор по истинност", days: 6 },
    { title: "Одобрение на креативите от клиента", days: 7, client: true },
    { title: "Лийд форма / лендинг + известията за нов лийд", days: 7 },
    { title: "Старт на кампанията и проверка на първите 24 часа", days: 8 },
    { title: "Дневна проверка: разход, цена на лийд, коментари", days: 9 },
    { title: "Седмичен отчет към клиента (числа + какво сменяме)", days: 15 },
    { title: "Месечен отчет и план за следващия месец", days: 30, client: true },
  ],
  website: [
    { title: "Откриващ разговор: цел на сайта, страници, кой ще пише текстовете", days: 1 },
    { title: "Материали от клиента: лого, снимки, текстове, данни за контакт", days: 3, client: true },
    { title: "Структура и чернова на началната страница", days: 5 },
    { title: "Одобрение на дизайна от клиента", days: 7, client: true },
    { title: "Останалите страници + форма за запитване → CRM", days: 12 },
    { title: "Мобилна проверка, скорост, SEO основи (заглавия, описания, карта)", days: 13 },
    { title: "Домейн, хостинг, SSL, имейл известия", days: 14, client: true },
    { title: "Предаване: достъпи, кратко видео как се сменя текст", days: 15, client: true },
  ],
  crm_build: [
    { title: "Откриващ разговор: процесът от запитване до плащане, с думите на клиента", days: 1 },
    { title: "Карта на процеса: етапи, кой какво прави, къде се губят хора", days: 3, client: true },
    { title: "Полета и етапи в CRM-а + правила за напомняния", days: 5 },
    { title: "Автоматизации: нов лийд → известие, follow-up, оферта", days: 9 },
    { title: "Внос на старите данни (клиенти, сделки) и проверка на дубликати", days: 10, client: true },
    { title: "Обучение на клиента: 45 минути, записано видео", days: 12, client: true },
    { title: "Предаване + 30 дни подкрепа + предложение за поддръжка", days: 14, client: true },
  ],
  crm_support: [
    { title: "Седмичен преглед: какво се е счупило, какво иска клиентът", days: 7 },
    { title: "Дневник на промените в картона на клиента", days: 7 },
    { title: "Отговор на всяко запитване до 24 часа", days: 1 },
    { title: "Месечен отчет: какво е сменено, какво предлагаме", days: 30, client: true },
  ],
  automation: [
    { title: "Откриващ разговор: кои ръчни стъпки ядат най-много време", days: 1 },
    { title: "Списък на автоматизациите с очаквана полза (часове/пари)", days: 3, client: true },
    { title: "Достъпи до системите, които ще се свързват", days: 4, client: true },
    { title: "Изграждане на първата автоматизация + тест с реални данни", days: 8 },
    { title: "Останалите автоматизации + защити (кога човек трябва да реши)", days: 12 },
    { title: "Обучение и предаване, записано видео", days: 14, client: true },
  ],
  voice_agent: [
    { title: "Скриптът на агента: какво казва, какво никога не казва, кога прехвърля", days: 2, client: true },
    { title: "Разкриването „аз съм AI асистент“ в първите 10 секунди", days: 2 },
    { title: "Инструменти: записване на час, бележка в CRM, известие", days: 6 },
    { title: "Тестови обаждания с клиента (5 сценария)", days: 8, client: true },
    { title: "Телефонен номер / бутон на сайта + Publish", days: 10 },
    { title: "Първите 20 разговора: слушане и поправки", days: 17 },
  ],
  training: [
    { title: "Встъпителна среща: цел, ниво, какво ще има накрая", days: 1, client: true },
    { title: "Програма по седмици (8 модула) и достъп до материалите", days: 2, client: true },
    { title: "Седмична сесия + домашно (повтаря се 8 пъти)", days: 7 },
    { title: "Финал: собствената система на клиента работи, план за нататък", days: 56, client: true },
  ],
  other: [
    { title: "Уточняване на обхвата с клиента", days: 1, client: true },
    { title: "Изпълнение", days: 7 },
    { title: "Предаване и одобрение", days: 10, client: true },
  ],
};

export function labelFor(serviceType: string | null | undefined): string {
  return SERVICE_TYPE_LABEL[serviceType as ServiceType] ?? "Друго";
}

export function isServiceType(v: unknown): v is ServiceType {
  return typeof v === "string" && (SERVICE_TYPES as readonly string[]).includes(v);
}

/** Задачите за нов проект: заглавие + срок от датата на старта. */
export function tasksForService(
  serviceType: ServiceType,
  startedAt: string | Date = new Date()
): Array<{ title: string; due_date: string | null; client_visible: boolean }> {
  const start = typeof startedAt === "string" ? new Date(`${startedAt.slice(0, 10)}T12:00:00Z`) : startedAt;
  return SERVICE_TEMPLATES[serviceType].map((t) => ({
    title: t.title,
    due_date:
      typeof t.days === "number" && !Number.isNaN(start.getTime())
        ? new Date(start.getTime() + t.days * 86_400_000).toISOString().slice(0, 10)
        : null,
    client_visible: t.client === true,
  }));
}

/**
 * Готовите съобщения към клиента — по вид услуга. Пишат се на „Вие“, топло,
 * водят към следваща стъпка. `[...]` се сменя с конкретното.
 */
export const CLIENT_UPDATE_TEMPLATES: Array<{ id: string; service: ServiceType | "all"; label: string; text: string }> = [
  {
    id: "start",
    service: "all",
    label: "Започваме",
    text: "Здравейте! Започваме работа по [проекта]. Първата стъпка от наша страна е [какво], а от Вас ни трябва [какво] — може да го качите или напишете тук. Ще Ви пиша при всяка готова стъпка.",
  },
  {
    id: "step_done",
    service: "all",
    label: "Готова стъпка",
    text: "Готово: [стъпката]. Ето какво означава за Вас: [полза с едно изречение]. Следващото, което правим, е [стъпка] — до [ден]. Ако имате въпрос, пишете тук.",
  },
  {
    id: "need_from_client",
    service: "all",
    label: "Трябва ни нещо от Вас",
    text: "За да продължим, ни трябва [какво] от Вас. Най-лесно е да го качите тук или да отметнете „Готово“ на задачата, когато е пратено. Щом го получим, продължаваме същия ден.",
  },
  {
    id: "weekly_ads",
    service: "marketing",
    label: "Седмичен отчет · реклами",
    text: "Седмицата в числа: разход [X] €, [N] запитвания, цена на запитване [Y] €. Най-добре работи [коя реклама] — [защо]. Спираме [коя], пускаме [коя]. Следващата седмица целим [цел].",
  },
  {
    id: "crm_handover",
    service: "crm_build",
    label: "Предаване на CRM",
    text: "Системата Ви е готова и работи с Вашите данни. Влизате от [адрес] с [имейл]. Записахме Ви кратко видео как се води клиент от запитване до плащане: [линк]. През следващите 30 дни сме до Вас за всеки въпрос.",
  },
  {
    id: "voice_live",
    service: "voice_agent",
    label: "Гласовият агент е пуснат",
    text: "Гласовият Ви асистент вече вдига на [номер/бутон]. Първите дни слушаме всеки разговор и поправяме репликите. Ако чуете нещо, което не Ви харесва — напишете го тук с една дума и го оправяме същия ден.",
  },
];

export function templatesFor(serviceType: string | null | undefined) {
  return CLIENT_UPDATE_TEMPLATES.filter((t) => t.service === "all" || t.service === serviceType);
}
