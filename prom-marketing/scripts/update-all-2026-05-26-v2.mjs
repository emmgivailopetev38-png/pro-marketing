#!/usr/bin/env node
// Обновявам CRM с всички бележки от XLS таблиците + следващи стъпки.

const TOKEN = "d57f2e068ec50e6ebccc5e98dbf9a9189a2fbaa238b22354036250334a57872e";
const HOST = "https://promarketing.pw";

async function post(body) {
  const r = await fetch(`${HOST}/api/admin/contacts`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "log_activity", ...body }),
  });
  return r.json();
}

// 2026-05-26 е вторник; следващ понеделник = 2026-06-01; утре = 2026-05-27
const TOMORROW = "2026-05-27T10:00:00Z";
const MONDAY = "2026-06-01T10:00:00Z";

const updates = [
  // ROSEN KOSTADINOV — Golden Key, агенция недвижими имоти
  {
    email: "office@goldenkeybg.com",
    full_name: "Росен Костадинов",
    company: "Golden Key (агенция за недвижими имоти)",
    stage: "discovery",
    next_followup_at: TOMORROW,
    notes: "[2026-05-26] Golden Key — агенция за недвижими имоти. УТРЕ 27.05 в 10:00 онлайн среща (Viber + имейл). Иска пълна автоматизация: лийдове, разпределение, нива в CRM (custom), AI CRM, чат с брокери, HR форми за набиране на персонал, промотиране на обяви и опит, свързване на всички социални мрежи + поддръжка.",
    activity_type: "meeting",
    title: "📅 УТРЕ 27.05 в 10:00 — онлайн среща (Viber + имейл)",
    body_text: "Първи лид-формуляр: 'Не вдига' (24.05). Сега има уговорена среща УТРЕ в 10:00 ч. за пълна презентация. Очаква: тотална автоматизация (лийдове → разпределение → нива → CRM), AI CRM, чат за брокери, форми за HR/набиране на персонал, промотиране на обяви, свързване на всички социални мрежи, поддръжка. Иска СИ САМ да създава нива в CRM-а.",
  },
  // EMIL ATANASOV — климатици, понеделник
  {
    email: "atanasov@atanasovclima.bg",
    full_name: "Емил Атанасов",
    company: "Атанасов Клима",
    stage: "discovery",
    next_followup_at: MONDAY,
    notes: "[2026-05-26] Atanasov Clima (климатици). Договорено ПОНЕДЕЛНИК 01.06 — разговор на дълго и широко. ВКАРАЙ В ГУГЪЛ КАЛЕНДАРА.",
    activity_type: "call",
    title: "📅 ПОНЕДЕЛНИК 01.06 — да му се обадя",
    body_text: "От лид-формуляра (25.05): 'Да му се обадя следващата седмица в понеделник да си поговорим на дълго и на широко, сложи ми го в гугъл календар'. Климатична компания.",
  },
  // ПЕТЪР ГОРАНОВ — иска пълна информация
  {
    email: "pgoranov2233@gmail.com",
    full_name: "Петър Горанов",
    stage: "contacted",
    notes: "[2026-05-26] Иска пълна информация за нашите услуги.",
    activity_type: "note",
    title: "Заявка: пълна информация за услугите",
    body_text: "От лид-формуляра (25.05): 'Пълна информация за нашите услуги'. Подготвя се общ имейл с детайли.",
  },
  // ПЛАМЕН ДРАГНЕВ — Plasico, иска презентация след разговор
  {
    email: "plamen@plasico.com",
    full_name: "Пламен Драгнев",
    company: "Plasico",
    stage: "contacted",
    notes: "[2026-05-26] Plasico. Иска първо да осмисли какви процеси може да се оптимизират — после ще му пратим презентация по случай разговора.",
    activity_type: "note",
    title: "Първо разговор → после персонална презентация",
    body_text: "От лид-формуляра (25.05): 'Иска да осмисли какви процеси може да се оптимизират, искам да му изпратим презентация по случай разговора ни'. Структура: 1) поговорете 2) сглобявам персонална презентация спрямо неговите нужди.",
  },
  // ХАСАН — изключен телефон, имейлът вече е пуснат
  {
    email: "xasirosi.eu@gmail.com",
    activity_type: "note",
    title: "Бележка от лид-формуляра: 'Изключен или извънобхват'",
    body_text: "Телефонът беше изключен/извън обхват при опит за връзка. Изпратен имейл с информация за услугите ни (вж. email_sent активността).",
  },
  // МОМЧИЛ СОКОЛОВ — не отговаря
  {
    email: "sokolovmomcil9@gmail.com",
    full_name: "Момчил Соколов",
    stage: "lead",
    notes: "[2026-05-26] Не отговаря на тел.",
    activity_type: "call",
    title: "Звъня — не отговаря",
    body_text: "От лид-формуляра (24.05): 'Не отговаря'. Пробвам пак или пращам имейл.",
  },
  // MIROSLAV CHELESTINOV — не вдига
  {
    email: "mchelestinov@gmail.com",
    full_name: "Мирослав Челестинов",
    stage: "lead",
    notes: "[2026-05-26] Не вдига телефона.",
    activity_type: "call",
    title: "Звъня — не вдига",
    body_text: "От лид-формуляра (24.05): 'Не Вдига'. Пробвам пак или пращам имейл.",
  },
];

for (const u of updates) {
  const r = await post(u);
  console.log(`${u.email.padEnd(35)} →`, r.ok ? "✅" : "❌", r);
}
