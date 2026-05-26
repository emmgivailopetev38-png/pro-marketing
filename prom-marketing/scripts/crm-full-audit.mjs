#!/usr/bin/env node
// Пълен CRM audit — обновява всеки активен клиент с актуално състояние,
// линкове към материали (PDF/web) и подробни бележки от целия чат.

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

const updates = [
  // === OFFER_SENT — оферти/договори изпратени ===

  // 1. Васил Бедров (Evolto) — оферта + договор v2 след юрист
  {
    email: "sales@solartechnology.bg",
    full_name: "Васил Бедров",
    company: "Evolto (Solar Technology)",
    stage: "offer_sent",
    notes: "EVOLTO — слънчева енергия. Дискавъри 25.05. ПРЕГЛЕД ОТ ЮРИСТ ✅. Договор + оферта v2 (с корекции) изпратени на 26.05 (Resend ID: 4d340316). Чакаме потвърждение/подпис. МАТЕРИАЛИ: /oferta/evolto · PDF Оферта: /api/oferta/evolto/pdf · PDF Договор: /api/oferta/evolto/contract. Цена: 2 000 € без ДДС, 50/50.",
    activity_type: "contract_sent",
    title: "📋 Материали v2 (юрист ✅) — линкове",
    body_text: "Web: https://promarketing.pw/oferta/evolto\nPDF Оферта: https://promarketing.pw/api/oferta/evolto/pdf\nPDF Договор: https://promarketing.pw/api/oferta/evolto/contract\n\nЦена: 2000€ без ДДС · 50/50 плащане · 30-60 дни срок според проекта",
  },

  // 2. Едуард Сахакян — оферта изпратена
  {
    email: "esahakyan7171@gmail.com",
    full_name: "Едуард Сахакян",
    stage: "offer_sent",
    notes: "ЕДУАРД — 3 нива оферта (Ателие за съдържание 2000€ / Автоматизация+ботове 1700€ / Финансова автоматизация 1445€). МАТЕРИАЛИ: /oferta/eduard",
    activity_type: "offer_sent",
    title: "📋 Оферта — 3 нива, web линк",
    body_text: "Web: https://promarketing.pw/oferta/eduard\n\n3 пакета: 2000€ → 1700€ → 1445€ (намаление 15% всяко ниво).",
  },

  // 3. Synergy Consult — оферта
  {
    email: "office@synergyconsult.eu",
    full_name: "Synergy Consult",
    company: "Synergy Consult",
    stage: "offer_sent",
    notes: "SYNERGY CONSULT — оферта изпратена. Чакаме отговор.",
    activity_type: "note",
    title: "💎 Оферта изпратена — чакаме отговор",
    body_text: "След последното изпращане — без отговор. Може да се пусне follow-up имейл.",
  },

  // 4. Zornica Razpopova — оферта
  {
    email: "z.razpopova@gmail.com",
    full_name: "Zornica Razpopova",
    stage: "offer_sent",
    notes: "ZORNICA — оферта изпратена. Чакаме отговор.",
    activity_type: "note",
    title: "💎 Оферта изпратена — чакаме отговор",
    body_text: "След последното изпращане — без отговор. Може да се пусне follow-up имейл.",
  },

  // === DISCOVERY — активни преговори ===

  // 5. Krasimira Yotova — персонална оферта
  {
    email: "office.yotova@gmail.com",
    full_name: "Красимира Йотова",
    stage: "discovery",
    next_followup_at: "2026-05-28T08:00:00Z",
    notes: "КРАСИМИРА ЙОТОВА — персонализирана оферта на /oferta/krasimira. Follow-up разговор предстои. МАТЕРИАЛИ: /oferta/krasimira",
    activity_type: "note",
    title: "💎 Персонална оферта — web линк",
    body_text: "Web: https://promarketing.pw/oferta/krasimira",
  },

  // 6. Росен Костадинов (Golden Key) — утре среща
  {
    email: "office@goldenkeybg.com",
    full_name: "Росен Костадинов",
    company: "Golden Key (агенция за недвижими имоти)",
    stage: "discovery",
    next_followup_at: "2026-05-27T07:00:00Z",
    notes: "GOLDEN KEY — агенция за имоти. УТРЕ 27.05 в 10:00 онлайн среща (Viber + имейл). Иска тотална автоматизация: лийдове, разпределение, custom нива в CRM, AI CRM, чат за брокери, HR форми, промотиране, всички социални мрежи + поддръжка. МАТЕРИАЛИ: /oferta/golden-key · PDF: /api/oferta/golden-key/pdf",
    activity_type: "meeting",
    title: "📋 Презентация готова — линкове за срещата",
    body_text: "Web: https://promarketing.pw/oferta/golden-key\nPDF: https://promarketing.pw/api/oferta/golden-key/pdf\n\n9 модула: 1) лийдове авто-прием 2) разпределение 3) custom нива 4) AI CRM 5) чат брокери 6) HR 7) промотиране 8) соц.мрежи 9) поддръжка",
  },

  // 7. Емил Атанасов — понеделник
  {
    email: "atanasov@atanasovclima.bg",
    full_name: "Емил Атанасов",
    company: "Атанасов Клима",
    stage: "discovery",
    next_followup_at: "2026-06-01T08:00:00Z",
    notes: "АТАНАСОВ КЛИМА — климатична компания. ПОНЕДЕЛНИК 01.06 разговор на дълго и широко. КАЛЕНДАР: впиши ръчно в Google Calendar.",
    activity_type: "call",
    title: "📅 ПОНЕДЕЛНИК 01.06 — разговор на дълго",
    body_text: "От лид-формуляра: 'да си поговорим на дълго и на широко, сложи ми го в гугъл календар'. Climate бранш.",
  },

  // 8. Теодор Лозев — персонална презентация
  {
    email: "lozevteodor@gmail.com",
    full_name: "Теодор Лозев",
    company: "Строителство",
    stage: "discovery",
    notes: "ТЕОДОР ЛОЗЕВ — строителство, готов клиент. Има склад, КСС, счетоводство. Иска dashboard с най-новите функционалности. ИЗПРАТЕН: персонална презентация (26.05, Resend ID: 270ac10a) с PDF. МАТЕРИАЛИ: /oferta/teodor · PDF: /api/oferta/teodor/pdf",
    activity_type: "email_sent",
    title: "📋 Презентация изпратена — web + PDF",
    body_text: "Web: https://promarketing.pw/oferta/teodor\nPDF: https://promarketing.pw/api/oferta/teodor/pdf\n\nReply-to: ivailopetev38@gmail.com. Чакаме отговор и резервация на разговор.",
  },

  // === CONTACTED — пуснат имейл/комуникация ===

  // 9. Станислава Михайлова — юрист (не клиент)
  {
    email: "stanislavamihaylova@abv.bg",
    full_name: "Станислава Михайлова",
    company: "Юрист — преглед на договори",
    stage: "contacted",
    notes: "ЮРИСТ — НЕ КЛИЕНТ. Преглежда договори за коректност (Evolto v1 → v2 след нейните корекции 26.05). Отговор: чакаме одобрение/корекции по v2. Не маркирай като клиент.",
    activity_type: "note",
    title: "⚖️ Юрист — преглежда Evolto v2",
    body_text: "Не е клиент. Изпратени два пъти PDF-и за преглед: v1 (24.05) → корекции → v2 (26.05, Resend ID: 4d340316). Чакаме потвърждение.",
  },

  // 10. Хасан Ерол Хасан — generic AI услуги имейл
  {
    email: "xasirosi.eu@gmail.com",
    full_name: "Хасан Ерол Хасан",
    stage: "contacted",
    notes: "ХАСАН — generic AI услуги имейл изпратен 26.05 (Resend ID: 4b53960e). Цени от 500 €. Reply-to: ivailopetev38@gmail.com. Бележка от форма: 'Изключен или извън обхват' (телефонът).",
    activity_type: "note",
    title: "📧 Generic AI пакет — имейл изпратен",
    body_text: "Resend ID: 4b53960e-d565-4924-9213-56069d446716\nЧакаме отговор. Цени стартиращи от 500 € (без ДДС).",
  },

  // 11. Петър Горанов — иска пълна информация
  {
    email: "pgoranov2233@gmail.com",
    full_name: "Петър Горанов",
    stage: "contacted",
    notes: "ПЕТЪР ГОРАНОВ — поиска 'пълна информация за нашите услуги'. ЧАКА да му се изпрати имейл с детайли. Подготвен batch generic AI имейл, но НЕ ИЗПРАТЕН още.",
    activity_type: "note",
    title: "📨 За изпращане — generic AI услуги имейл",
    body_text: "От лид-формуляра: 'Пълна информация за нашите услуги'. Имейлът е подготвен но чака одобрение.",
  },

  // 12. Пламен Драгнев (Plasico) — първо разговор, после персонална
  {
    email: "plamen@plasico.com",
    full_name: "Пламен Драгнев",
    company: "Plasico",
    stage: "contacted",
    notes: "ПЛАМЕН ДРАГНЕВ (PLASICO) — иска ПЪРВО да осмисли какви процеси да оптимизира, после да му пратим презентация СПЕЦИАЛНО за разговора им. Структура: 1) телефонен разговор/среща 2) персонална презентация след това.",
    activity_type: "note",
    title: "📞 Първо разговор → после персонална презентация",
    body_text: "Plasico е голяма IT компания в Пловдив. Подходът тук е НЕ generic пакет, а персонализирана презентация след разговор за конкретните им процеси.",
  },

  // === LEAD — нови, без комуникация ===

  // 13. Момчил Соколов — не отговаря
  {
    email: "sokolovmomcil9@gmail.com",
    full_name: "Момчил Соколов",
    stage: "lead",
    notes: "МОМЧИЛ СОКОЛОВ — не отговаря на тел. (бележка 24.05). Опитай пак или прати имейл.",
  },

  // 14. Мирослав Челестинов — не вдига
  {
    email: "mchelestinov@gmail.com",
    full_name: "Мирослав Челестинов",
    stage: "lead",
    notes: "МИРОСЛАВ ЧЕЛЕСТИНОВ — не вдига телефона (бележка 24.05). Опитай пак или прати имейл.",
  },
];

for (const u of updates) {
  const r = await post(u);
  console.log(`${u.email.padEnd(36)} →`, r.ok ? "✅" : "❌");
}
console.log("\n✅ CRM audit завършен — всички активни контакти обновени.");
