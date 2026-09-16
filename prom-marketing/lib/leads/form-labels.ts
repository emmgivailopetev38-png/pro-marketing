/**
 * Отговорите от Meta лийд формите идват като кодове („o3“) в
 * meta_leads.field_data. Тук са въпросите и опциите на нашите форми, за да
 * може човекът, който звъни, да види „Строителство и ремонти · Гласов агент“,
 * а не „o4 · o3“. Ключът е името на въпроса (не id-то на формата), защото
 * една и съща форма се клонира с нови id-та, а въпросите остават.
 *
 * Източник: Graph API `/{form_id}?fields=questions` за формите
 * 3579321608891952 („Услуги по мярка“, 10.09.2026) и
 * 1383332500102053 („Пълна автоматизация за 1 ден“, 13.09.2026).
 */
import { BUSINESS_OPTIONS, type FormAnswer } from "@/lib/team/types";

interface QuestionDef {
  label: string;
  options?: Record<string, string>;
}

const QUESTIONS: Record<string, QuestionDef> = {
  "Какво_търсиш?": {
    label: "Какво търси",
    options: {
      o1: "Маркетинг и реклами — иска повече клиенти",
      o2: "AI автоматизация — иска да спести време",
      o3: "Гласов агент — да вдига телефона вместо него",
      o4: "CRM — да не се губят клиенти и оферти",
      o5: "Обучение за него самия — да се научи сам",
      o6: "Обучение за целия екип във фирмата",
      o7: "Още не знае — иска съвет",
    },
  },
  "С_какво_се_занимаваш?": {
    label: "С какво се занимава",
    options: {
      o1: "Онлайн магазин или е-търговия",
      o2: "Услуги или кабинет",
      o3: "Производство или цех",
      o4: "Строителство и ремонти",
      o5: "Счетоводство или консултации",
      o6: "Транспорт и логистика",
      o7: "Друго",
    },
  },
  biznes: {
    label: "С какво се занимава",
    options: {
      o1: "Услуги (сервиз, салон, ремонти, транспорт)",
      o2: "Търговия / магазин / онлайн магазин",
      o3: "Производство",
      o4: "Строителство / имоти",
      o5: "Консултант / обучения / финанси",
      o6: "Друго",
    },
  },
  bolka: {
    label: "Какво му яде най-много време",
    options: {
      o1: "Отговаряне на запитвания и клиенти",
      o2: "Оферти, договори, фактури",
      o3: "Реклами и социални мрежи",
      o4: "Отчети, таблици, счетоводство",
      o5: "Графици на екип, обекти, заявки",
      o6: "Всичко наведнъж — той е човекът за всичко",
    },
  },
  chasove: {
    label: "Часове седмично ръчна работа",
    options: { o1: "Под 5 часа", o2: "5–10 часа", o3: "10–20 часа", o4: "Над 20 часа" },
  },
  cel: {
    label: "Целта му за 12 месеца",
    options: {
      o1: "Повече клиенти със същия екип",
      o2: "Повече свободно време, без да падат приходите",
      o3: "Нов канал или нов пазар",
      o4: "Да мащабира и да не зависи от него",
      o5: "Още не знае — иска план",
    },
  },
  koga: {
    label: "Кога иска да започне",
    options: {
      o1: "Тази седмица",
      o2: "Този месец",
      o3: "Първо иска план и цена",
      o4: "Само разглежда засега",
    },
  },
};

/** Полета, които вече стоят в самия картон — не се показват като отговори. */
const STANDARD = new Set(["full_name", "first_name", "last_name", "phone_number", "email", "phone", "company_name", "city", "street_address", "zip_code", "country"]);

/** Кои въпроси казват „с какво се занимава“ — за предварително попълване на дейността. */
const BUSINESS_KEYS = new Set(["С_какво_се_занимаваш?", "biznes"]);

interface FieldDatum {
  name?: unknown;
  values?: unknown;
}

function asArray(v: unknown): FieldDatum[] {
  if (Array.isArray(v)) return v as FieldDatum[];
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? (parsed as FieldDatum[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Кодовете стават текст; непознат въпрос се показва както е, с подчертавките като интервали. */
export function decodeFormAnswers(fieldData: unknown): FormAnswer[] {
  const out: FormAnswer[] = [];
  for (const f of asArray(fieldData)) {
    const name = typeof f.name === "string" ? f.name : "";
    if (!name || STANDARD.has(name)) continue;
    const values = Array.isArray(f.values) ? f.values.map((x) => String(x ?? "").trim()).filter(Boolean) : [];
    if (values.length === 0) continue;
    const def = QUESTIONS[name];
    const answer = values.map((v) => def?.options?.[v] ?? v).join(", ");
    out.push({ question: def?.label ?? name.replace(/_/g, " ").replace(/\?$/, ""), answer });
  }
  return out;
}

/** Отговорът за дейността от формата, ако го има — сурово, както човекът го е избрал. */
export function businessFromForm(fieldData: unknown): string | null {
  for (const f of asArray(fieldData)) {
    const name = typeof f.name === "string" ? f.name : "";
    if (!BUSINESS_KEYS.has(name)) continue;
    const values = Array.isArray(f.values) ? f.values.map((x) => String(x ?? "").trim()).filter(Boolean) : [];
    if (!values.length) continue;
    const def = QUESTIONS[name];
    return def?.options?.[values[0]] ?? values[0];
  }
  return null;
}

/** Свежда всяко описание на дейност до една от опциите в картата. */
export function guessBusinessOption(text: string | null | undefined): (typeof BUSINESS_OPTIONS)[number] {
  const t = (text ?? "").toLowerCase();
  if (!t) return "Друго";
  // „Услуги (сервиз, салон, ремонти, транспорт)“ е опция от формата — думите в
  // скобите са примери, затова „услуги“ се гледа преди „ремонт“ и „транспорт“.
  if (/услуг|кабинет|салон|сервиз|фризьор|козмет|клиник|стомат/.test(t)) return "Услуги / кабинет / салон";
  if (/онлайн|е-търг|e-com|shop/.test(t)) return "Онлайн магазин / е-търговия";
  if (/търгов|магазин/.test(t)) return "Търговия / магазин";
  if (/строител|имот|ремонт/.test(t)) return "Строителство / имоти / ремонти";
  if (/производ|цех|фабрик/.test(t)) return "Производство / цех";
  if (/счетовод|консулт|обучени|финанс|коуч/.test(t)) return "Счетоводство / консултации / обучения";
  if (/транспорт|логист|превоз|куриер/.test(t)) return "Транспорт / логистика";
  if (/ресторант|хотел|туриз|кафе|заведени/.test(t)) return "Ресторант / хотел / туризъм";
  return "Друго";
}
