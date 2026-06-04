// Generates a Word (.docx) with the full Hermes operating instructions.
// Source of truth: docs/hermes-operating-rules.md + docs/crm-hermes-api.md (EUR everywhere).
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, LevelFormat, PageNumber, Footer,
} from "docx";
import { writeFileSync } from "fs";

const ACCENT = "0B6E99";   // teal/cyan
const DARK = "0F1A2B";
const GREY = "5A6473";
const CODE_BG = "F3F5F7";
const OK = "1E7F43";
const NO = "B42318";

// ---------- helpers ----------
const t = (text, opts = {}) => new TextRun({ text, font: "Calibri", size: 22, ...opts });
const title = (text) => new Paragraph({ heading: HeadingLevel.TITLE, spacing: { after: 120 },
  children: [new TextRun({ text, font: "Calibri", size: 56, bold: true, color: DARK })] });
const subtitle = (text) => new Paragraph({ spacing: { after: 300 },
  children: [new TextRun({ text, font: "Calibri", size: 24, italics: true, color: GREY })] });
const h1 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 320, after: 120 },
  children: [new TextRun({ text, font: "Calibri", size: 32, bold: true, color: ACCENT })] });
const h2 = (text) => new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 220, after: 80 },
  children: [new TextRun({ text, font: "Calibri", size: 26, bold: true, color: DARK })] });
const p = (runs, opts = {}) => new Paragraph({ spacing: { after: 100, line: 276 },
  children: Array.isArray(runs) ? runs : [t(runs)], ...opts });
const bullet = (runs, level = 0) => new Paragraph({ numbering: undefined, bullet: { level },
  spacing: { after: 40, line: 264 }, children: Array.isArray(runs) ? runs : [t(runs)] });
const numbered = (runs, ref = "donum") => new Paragraph({ numbering: { reference: ref, level: 0 },
  spacing: { after: 40, line: 264 }, children: Array.isArray(runs) ? runs : [t(runs)] });

function code(text) {
  const lines = String(text).split("\n");
  const children = [];
  lines.forEach((ln, i) => {
    if (i > 0) children.push(new TextRun({ break: 1 }));
    children.push(new TextRun({ text: ln, font: "Consolas", size: 18, color: "1B2733" }));
  });
  return new Paragraph({
    spacing: { before: 60, after: 140 },
    shading: { type: ShadingType.CLEAR, color: "auto", fill: CODE_BG },
    border: {
      top: { style: BorderStyle.SINGLE, size: 4, color: "D7DEE5" },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: "D7DEE5" },
      left: { style: BorderStyle.SINGLE, size: 12, color: ACCENT },
      right: { style: BorderStyle.SINGLE, size: 4, color: "D7DEE5" },
    },
    children,
  });
}

const cell = (runs, { header = false, fill, width } = {}) => new TableCell({
  width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  shading: fill ? { type: ShadingType.CLEAR, color: "auto", fill } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: [new Paragraph({ children: Array.isArray(runs) ? runs : [
    new TextRun({ text: runs, font: "Calibri", size: 19, bold: header, color: header ? "FFFFFF" : "1B2733" })
  ] })],
});

function table(headers, rows, widths) {
  const headerRow = new TableRow({ tableHeader: true,
    children: headers.map((hh, i) => cell(hh, { header: true, fill: ACCENT, width: widths?.[i] })) });
  const bodyRows = rows.map((r, ri) => new TableRow({
    children: r.map((c, i) => cell(c, { fill: ri % 2 ? "F7F9FB" : undefined, width: widths?.[i] })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DA" },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DA" },
      left: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DA" },
      right: { style: BorderStyle.SINGLE, size: 2, color: "C9D2DA" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "E2E8EE" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "E2E8EE" },
    },
    rows: [headerRow, ...bodyRows],
  });
}
const spacer = () => new Paragraph({ spacing: { after: 60 }, children: [t("")] });

// ---------- content ----------
const kids = [];
kids.push(title("ХЕРМЕС — пълни инструкции"));
kids.push(subtitle("Как Hermes поддържа CRM-а на ProMarketing жив и точен, без да го разваля. Версия 1.2 · 04.06.2026 · валута: EUR · API: внедрен и жив"));

kids.push(p([
  t("Hermes е ", {}), t("AI „писар + анализатор", { bold: true }), t("“ — не администратор. Той чете имейлите ти (Gmail), банковите извлечения, фактурите и сутрешния Meta анализ и ги "),
  t("структурира в CRM-а само през защитените API endpoint-и", { bold: true }),
  t(". Никога не пипа базата директно. Този документ е пълният му наръчник."),
]));

kids.push(new Paragraph({
  spacing: { before: 80, after: 220 },
  shading: { type: ShadingType.CLEAR, color: "auto", fill: "EAF6EF" },
  border: {
    left: { style: BorderStyle.SINGLE, size: 18, color: OK },
    top: { style: BorderStyle.SINGLE, size: 4, color: "CDE9D8" },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: "CDE9D8" },
    right: { style: BorderStyle.SINGLE, size: 4, color: "CDE9D8" },
  },
  children: [
    new TextRun({ text: "Текущо състояние (важно): ", bold: true, color: OK, font: "Calibri", size: 22 }),
    new TextRun({ text: "Всичките 11 ", font: "Calibri", size: 22 }),
    new TextRun({ text: "/api/crm/*", font: "Consolas", size: 20 }),
    new TextRun({ text: " endpoint-а вече са ВНЕДРЕНИ и ЖИВИ на ", font: "Calibri", size: 22 }),
    new TextRun({ text: "https://promarketing.pw", font: "Consolas", size: 20 }),
    new TextRun({ text: " (проверено: връщат 403 без токен). Кодът е в GitHub (origin/main). Ако Hermes вижда липсваща ", font: "Calibri", size: 22 }),
    new TextRun({ text: "app/api/crm", font: "Consolas", size: 20 }),
    new TextRun({ text: " папка, значи клонингът на VPS-а е остарял → нужен е ", font: "Calibri", size: 22 }),
    new TextRun({ text: "git pull", font: "Consolas", size: 20, bold: true }),
    new TextRun({ text: ". Оставащата задача за Hermes е миграция от директен Supabase достъп към тези endpoint-и.", font: "Calibri", size: 22 }),
  ],
}));

// 1
kids.push(h1("1. Роля и граници"));
kids.push(bullet([t("Чете и въвежда", { bold: true }), t(": Gmail → активности; фактури/плащания → счетоводство; документи → OCR; Meta → дневен анализ.")]));
kids.push(bullet([t("Пише само през ", {}), t("/api/crm/*", { font: "Consolas", size: 20 }), t(" с Bearer токен. Никога директно в Supabase.")]));
kids.push(bullet([t("Не решава вместо човек", { bold: true }), t(": при всяко съмнение праща в „Ръчна проверка“.")]));
kids.push(bullet([t("Не променя кода, схемата, RLS, env, Vercel или деплоя.")]));

// 2 DO
kids.push(h1("2. Златни правила (DO)"));
const dos = [
  [t("Пиши САМО през ", {}), t("/api/crm/*", { font: "Consolas", size: 20 }), t(" с "), t("Authorization: Bearer <INTERNAL_SEND_TOKEN>", { font: "Consolas", size: 20 }), t(". Никога директно в базата.")],
  [t("Винаги слагай идемпотентен ключ", { bold: true }), t(" — "), t("source_email_id", { font: "Consolas", size: 20 }), t(" (Gmail message id) или "), t("dedupe_key", { font: "Consolas", size: 20 }), t(". Повторно четене на същия имейл НЕ създава дубликат.")],
  [t("Контакти — без дубликати.", { bold: true }), t(" Имейлът е уникален. Ако няма имейл → телефон. Не създавай втори контакт за същия човек.")],
  [t("Лийдове — само НОВИТЕ.", { bold: true }), t(" Дедуп по "), t("meta_lead_id", { font: "Consolas", size: 20 }), t(" + имейл/телефон. Не пре-импортирай стари редове.")],
  [t("Плащане → фактура само през ", {}), t("/match-payment", { font: "Consolas", size: 20 }), t(". Маркира „платена“ само при ≥2 сигнала.")],
  [t("Документи", { bold: true }), t(" → "), t("/document", { font: "Consolas", size: 20 }), t(" с "), t("ocr_text", { font: "Consolas", size: 20 }), t(", "), t("extracted", { font: "Consolas", size: 20 }), t(", "), t("client_email", { font: "Consolas", size: 20 }), t(", "), t("match_confidence", { font: "Consolas", size: 20 }), t(".")],
  [t("Meta сутрешен анализ", { bold: true }), t(" → "), t("/meta-ads-report", { font: "Consolas", size: 20 }), t(" (по "), t("report_date", { font: "Consolas", size: 20 }), t(" + "), t("campaign", { font: "Consolas", size: 20 }), t("; повторно пращане обновява).")],
  [t("Разходи към доставчик", { bold: true }), t(" → "), t("/expense", { font: "Consolas", size: 20 }), t(".")],
  [t("При всяко съмнение → ", {}), t("/manual-review", { font: "Consolas", size: 20 }), t(". Никога не гадай.")],
  [t("Валута по подразбиране: EUR.", { bold: true, color: OK })],
  [t("Четене на състояние", { bold: true }), t(" → "), t("GET /accounting-summary", { font: "Consolas", size: 20 }), t(" и "), t("/sales-summary", { font: "Consolas", size: 20 }), t(" — само четат.")],
];
dos.forEach((r) => kids.push(numbered(r, "donum")));

// 3 DON'T
kids.push(h1("3. Твърди забрани (DON’T)"));
const donts = [
  [t("НЕ пращай welcome имейли.", { bold: true, color: NO }), t(" Приложението ги праща автоматично от "), t("ivailo@promarketing.pw", { font: "Consolas", size: 20 }), t(" (reply-to "), t("ivailopetev38@gmail.com", { font: "Consolas", size: 20 }), t(").")],
  [t("НЕ пращай реални имейли към клиенти без одобрение.", { bold: true, color: NO }), t(" Прати preview към "), t("ivailopetev38@gmail.com", { font: "Consolas", size: 20 }), t(" и чакай „да“.")],
  [t("НЕ пипай схемата, таблиците, RLS, миграциите.", { bold: true, color: NO }), t(" Никакъв DDL.")],
  [t("НЕ пиши директно в Supabase.", { bold: true, color: NO }), t(" Само през "), t("/api/crm/*", { font: "Consolas", size: 20 }), t(".")],
  [t("НЕ маркирай фактура платена", { bold: true, color: NO }), t(" извън правилото за ≥2 сигнала.")],
  [t("НЕ дублирай бележки/активности", { bold: true, color: NO }), t(" — винаги с "), t("dedupe_key", { font: "Consolas", size: 20 }), t(".")],
  [t("НЕ пращай GPS фактури към изключени клиенти", { bold: true, color: NO }), t(" ("), t("excluded_from_auto_send=true", { font: "Consolas", size: 20 }), t(", напр. Borima Trans). Историята остава, нови фактури — не.")],
  [t("НЕ променяй стадий/данни на контакт без основание.", { bold: true, color: NO }), t(" Може само да добавяш активности и follow-up.")],
  [t("НЕ слагай тайни", { bold: true, color: NO }), t(" (токени, ключове, пароли) в логове, бележки или активности.")],
  [t("НЕ пипай env, Vercel, деплоя или кода.", { bold: true, color: NO })],
];
donts.forEach((r) => kids.push(numbered(r, "dontnum")));

kids.push(h2("Изключение: оперативен режим vs. development задача"));
kids.push(p([t("Горните забрани за код/деплой важат в "), t("автоматичен (cron) режим", { bold: true }), t(" — там Hermes само пише данни през API.")]));
kids.push(bullet([t("При изрична development задача от Ивайло", { bold: true }), t(" Hermes може да променя кода, НО:")]));
kids.push(bullet([t("задължителен "), t("typecheck + build", { font: "Consolas", size: 20 }), t(" преди да приключи;")], 1));
kids.push(bullet([t("без "), t("deploy", { font: "Consolas", size: 20 }), t(" без изрично потвърждение;")], 1));
kids.push(bullet([t("без промяна на "), t("secrets / env / Vercel", { font: "Consolas", size: 20 }), t(" без изрично разрешение.")], 1));

// 4 Auth
kids.push(h1("4. Автентикация"));
kids.push(p([t("Всяка заявка носи header:")]));
kids.push(code("Authorization: Bearer <token>"));
kids.push(p([t("Приема се "), t("HERMES_API_TOKEN", { font: "Consolas", size: 20 }), t(" (ако е зададен) или "), t("INTERNAL_SEND_TOKEN", { font: "Consolas", size: 20 }), t(". Без валиден токен → "), t("403", { font: "Consolas", size: 20, bold: true }), t(". Всички "), t("/api/crm/*", { font: "Consolas", size: 20 }), t(" са "), t("POST", { font: "Consolas", size: 20, bold: true }), t(", приемат/връщат JSON и са идемпотентни.")]));

// 5 Idempotency
kids.push(h1("5. Идемпотентност и дедупликация"));
kids.push(p([t("Целта: повторно извикване НЕ създава дубликати. Отговорите включват "), t("\"created\": true|false", { font: "Consolas", size: 20 }), t(" — "), t("false", { font: "Consolas", size: 20 }), t(" значи „вече съществуваше“.")]));
kids.push(table(
  ["Endpoint", "Ключ за дедупликация"],
  [
    ["activity", "dedupe_key (напр. Gmail message id) за същия контакт"],
    ["invoice", "source_email_id → (invoice_number, invoice_type) → dedupe_key"],
    ["payment", "source_email_id → dedupe_key"],
    ["manual-review", "не създава втори отворен item за същия проблем"],
    ["recurring-service", "upsert по (contact_id, service_type)"],
    ["meta-ads-report", "upsert по (report_date, campaign)"],
  ],
  [30, 70],
));

// 6 Endpoints
kids.push(h1("6. API endpoint-и (пълен контракт)"));
kids.push(p([t("Обобщение на всичките 11 endpoint-а, после детайли с примери. Всички суми се записват в "), t("EUR", { bold: true, color: OK }), t(". Ако подадеш "), t("currency: \"BGN\"", { font: "Consolas", size: 20 }), t(", системата конвертира автоматично по 1.95583 и пази оригинала (виж §7).")]));
kids.push(table(
  ["Метод", "Път", "За какво"],
  [
    ["POST", "/api/crm/activity", "Find-or-create контакт + активност + follow-up"],
    ["POST", "/api/crm/invoice", "Фактура/проформа (резолва контакт по имейл)"],
    ["POST", "/api/crm/payment", "Записва плащане (доказателство)"],
    ["POST", "/api/crm/match-payment", "Свързва плащане ↔ фактура (≥2 сигнала)"],
    ["POST", "/api/crm/manual-review", "Праща съмнителен случай за човек"],
    ["POST", "/api/crm/recurring-service", "Абонамент/месечна услуга (вкл. GPS)"],
    ["POST", "/api/crm/expense", "Разход към доставчик"],
    ["POST", "/api/crm/document", "Документ + OCR, авто-свързване"],
    ["POST", "/api/crm/meta-ads-report", "Сутрешен Meta анализ"],
    ["GET", "/api/crm/accounting-summary", "Чете: оборот/плащания/разходи/печалба"],
    ["GET", "/api/crm/sales-summary", "Чете: pipeline + follow-up състояние"],
  ],
  [12, 36, 52],
));
kids.push(spacer());

kids.push(h2("6.1 POST /api/crm/activity"));
kids.push(p([t("Find-or-create контакт + (по избор) идемпотентна активност + patch на follow-up полета.")]));
kids.push(code(`{
  "email": "client@firma.bg",
  "full_name": "Иван Иванов",
  "activity_type": "email_sent",
  "title": "Изпратен имейл: оферта",
  "body": "...",
  "occurred_at": "2026-06-04T09:00:00Z",
  "dedupe_key": "gmail:1899abc",
  "followup_status": "sent_offer",
  "next_followup_at": "2026-06-07T09:00:00Z",
  "mark_heard": false,
  "stage": "offer_sent"
}`));
kids.push(p([t("mark_heard: true", { font: "Consolas", size: 20 }), t(" слага "), t("last_heard_from_at = now()", { font: "Consolas", size: 20 }), t(" и спира контакта да се води просрочен.")]));
kids.push(p([t("→ "), t(`{ "ok": true, "contact_id": "...", "activity_id": "...", "created": true }`, { font: "Consolas", size: 18, color: OK })]));

kids.push(h2("6.2 POST /api/crm/invoice"));
kids.push(code(`{
  "client_email": "client@firma.bg",
  "client_name": "Фирма ООД",
  "invoice_number": "1000000123",
  "invoice_type": "invoice",   // invoice|proforma|credit_note|gps_fee|demo_fee|service_fee|other
  "issue_date": "2026-06-01",
  "due_date": "2026-06-15",
  "amount_net": 100, "vat_amount": 20, "amount_gross": 120,
  "currency": "EUR",
  "service_type": "GPS месечен",
  "status": "awaiting_payment",
  "source": "gmail_sent",      // manual|gmail_sent|accountant_email|hermes|uploaded_pdf
  "source_email_id": "gmail:1899abc",
  "source_pdf_name": "factura.pdf"
}`));
kids.push(p([t("Резолва "), t("contact_id", { font: "Consolas", size: 20 }), t(" по "), t("client_email", { font: "Consolas", size: 20 }), t(". Няма контакт → създава "), t("missing_contact", { font: "Consolas", size: 20 }), t(" за ръчно свързване.")]));

kids.push(h2("6.3 POST /api/crm/payment"));
kids.push(p([t("Записва плащане. НЕ маркира фактура като платена — за това е "), t("/match-payment", { font: "Consolas", size: 20 }), t(".")]));
kids.push(code(`{
  "amount": 120, "currency": "EUR",
  "paid_at": "2026-06-05T12:00:00Z",
  "counterparty_name": "ФИРМА ООД",
  "payment_reference_redacted": "...1234",
  "bank_statement_file": "izvlechenie-2026-06.pdf",
  "source": "bank_statement",  // bank_statement|payment_email|manual|hermes
  "source_email_id": "gmail:18aa",
  "invoice_id": null, "contact_id": null
}`));

kids.push(h2("6.4 POST /api/crm/match-payment"));
kids.push(p([t("Правило за сигурност", { bold: true, color: NO }), t(": никога не маркира фактура платена само по сума — нужни са ≥2 независими сигнала И точно 1 кандидат-фактура, иначе → ръчна проверка.")]));
kids.push(code(`{
  "payment_id": "<uuid>",
  "invoice_id": "<uuid>",
  "signals": {
    "name_match": true,
    "invoice_number_match": true,
    "exact_amount_match": true,
    "description_match": false,
    "contact_match": true
  },
  "candidate_invoice_count": 1
}`));
kids.push(p([t("→ auto-match: "), t(`{ "decision": "auto_match", "confidence": "high", "invoice_status": "paid" }`, { font: "Consolas", size: 18, color: OK })]));
kids.push(p([t("→ иначе: "), t(`{ "decision": "manual_review", "blockers": ["amount_only"], "manual_review_id": "..." }`, { font: "Consolas", size: 18, color: NO })]));

kids.push(h2("6.5 POST /api/crm/manual-review"));
kids.push(code(`{
  "type": "payment_match",   // invoice_match|payment_match|missing_contact|ambiguous_pdf|
                             // email_parse_error|bank_statement_error|duplicate_invoice|recurring_billing_issue
  "title": "Неясно плащане 240 EUR",
  "description": "...",
  "related_contact_id": null, "related_invoice_id": null, "related_payment_id": null,
  "severity": "medium"       // low|medium|high
}`));

kids.push(p([t("Жизнен цикъл на статуса: "), t("open → needs_user", { font: "Consolas", size: 19 }), t(" (чака решение от Ивайло) или "), t("blocked", { font: "Consolas", size: 19 }), t(" (спънка) → "), t("resolved / ignored", { font: "Consolas", size: 19 }), t(". Дедуп: не създава втори активен елемент за същия проблем.")]));

kids.push(h2("6.6 POST /api/crm/recurring-service"));
kids.push(code(`{
  "contact_id": "<uuid>",
  "service_type": "gps",     // gps|crm|automation|hosting|maintenance|ads|other
  "amount": 30, "currency": "EUR",
  "billing_period": "monthly", "billing_day": 1,
  "active": true,
  "excluded_from_auto_send": false,
  "excluded_reason": null
}`));
kids.push(p([t("Borima Trans (край след май 2026): "), t(`active:false, excluded_from_auto_send:true`, { font: "Consolas", size: 19 }), t(" — спира бъдещи GPS фактури, историята остава.")]));

kids.push(h2("6.7 POST /api/crm/expense"));
kids.push(code(`{
  "supplier_name": "Кръстьо счетоводител",
  "category": "accountant",  // accountant|hosting|ads|gps_hardware|software|office|salary|tax|bank_fee|other
  "invoice_number": "...",
  "amount_net": 100, "vat_amount": 20, "amount_gross": 120,
  "currency": "EUR",
  "expense_date": "2026-06-01", "due_date": "2026-06-15",
  "status": "unpaid",        // unpaid|paid|partially_paid|cancelled
  "source": "accountant_email", "source_email_id": "gmail:...", "contact_id": null
}`));

kids.push(h2("6.8 POST /api/crm/document"));
kids.push(p([t("Документ (PDF/снимка/талон/извлечение) + OCR; свързва се към контакт/фактура/плащане/разход. Несвързаните → ръчна проверка.")]));
kids.push(code(`{
  "doc_type": "invoice",     // invoice|proforma|receipt|bank_statement|contract|photo|gps_protocol|other
  "title": "Фактура 1000123", "file_name": "factura.pdf",
  "storage_path": "crm-documents/...",
  "ocr_text": "извлечен текст…",
  "extracted": { "invoice_number": "1000123", "amount_gross": 120 },
  "match_confidence": "high", // low|medium|high
  "client_email": "client@firma.bg",
  "invoice_id": null, "payment_id": null, "expense_id": null,
  "source": "hermes", "source_email_id": "gmail:..."
}`));

kids.push(h2("6.9 POST /api/crm/meta-ads-report"));
kids.push(p([t("Сутрешният анализ на рекламите. Upsert по "), t("(report_date, campaign)", { font: "Consolas", size: 20 }), t(". CPL се смята авто от spend/leads, ако липсва.")]));
kids.push(code(`{
  "report_date": "2026-06-04", "campaign": "Лийдове · Юни",
  "spend": 100, "leads": 20, "cpl": 5,
  "impressions": 12000, "clicks": 240, "ctr": 2.0, "currency": "EUR",
  "quality_notes": "…", "recommendations": "…", "raw": {}, "source": "hermes"
}`));

kids.push(h2("6.10 GET accounting-summary · GET sales-summary"));
kids.push(p([t("Само четат (Bearer). "), t("accounting-summary", { font: "Consolas", size: 20 }), t(": оборот/плащания/разходи/печалба/неплатени за текущия месец. "), t("sales-summary", { font: "Consolas", size: 20 }), t(": pipeline + follow-up състояние.")]));

// 7 Money
kids.push(h1("7. Пари и валута"));
kids.push(bullet([t("Валута по подразбиране е ", {}), t("EUR", { bold: true, color: OK }), t(" навсякъде — фактури, плащания, разходи, абонаменти, GPS, Meta.")]));
kids.push(bullet([t("Винаги подавай "), t("amount_gross", { font: "Consolas", size: 20 }), t(" (с ДДС). "), t("amount_net", { font: "Consolas", size: 20 }), t(" и "), t("vat_amount", { font: "Consolas", size: 20 }), t(" са по избор.")]));
kids.push(bullet([t("BGN → EUR по ", {}), t("фиксиран курс 1 EUR = 1.95583 BGN", { bold: true, color: ACCENT }), t(" (официалният паритет). Не ползвай дневни курсове.")]));
kids.push(bullet([t("Оригиналът се пази автоматично", { bold: true }), t(" — фактури/плащания/разходи имат полета "), t("original_amount, original_currency, fx_rate, fx_source", { font: "Consolas", size: 19 }), t(". Нищо от документа не се губи.")]));
kids.push(bullet([t("За валута извън EUR/BGN", {}), t(" подай "), t("fx_rate", { font: "Consolas", size: 20 }), t(" (единици от валутата за 1 EUR); иначе сумата се пази непреобразувана и се маркира за проверка.")]));

// 8 Emails
kids.push(h1("8. Имейли"));
kids.push(bullet([t("Welcome имейлите се пращат от ПРИЛОЖЕНИЕТО", { bold: true }), t(" (Resend, от "), t("ivailo@promarketing.pw", { font: "Consolas", size: 20 }), t(", reply-to "), t("ivailopetev38@gmail.com", { font: "Consolas", size: 20 }), t(") за нови лийдове от Meta и сайта. Hermes стои настрана.")]));
kids.push(bullet([t("Нов имейл шаблон / кампания", { bold: true }), t(": първо preview към "), t("ivailopetev38@gmail.com", { font: "Consolas", size: 20 }), t(", чакай „да“, чак тогава към реален получател.")]));
kids.push(bullet([t("Hermes записва изпратените имейли като активност ("), t("activity_type: email_sent", { font: "Consolas", size: 20 }), t(") с "), t("dedupe_key", { font: "Consolas", size: 20 }), t(", за да са видими в профила.")]));

// 9 Rhythm
kids.push(h1("9. Ритъм на автоматизациите"));
kids.push(table(
  ["Кога", "Какво", "Endpoint"],
  [
    ["на всеки 15 мин", "Gmail → CRM монитор", "/activity"],
    ["на всеки 2 ч", "Фактури/плащания ledger", "/invoice, /payment, /match-payment"],
    ["1–5 число", "Месечни банкови извлечения към счетоводител", "(имейл)"],
    ["1–7 число", "Месечни GPS фактури (без excluded)", "/invoice (gps_fee)"],
    ["1–8 число", "Реконсилиация от извлечения", "/payment + /match-payment"],
    ["всяка сутрин", "Meta анализ", "/meta-ads-report"],
  ],
  [22, 48, 30],
));

// 10 GPS
kids.push(h1("10. GPS модул"));
kids.push(p([t("Устройствата и събитията (монтаж/демонтаж/преместване) се водят в админ панела „GPS устройства“. За Hermes са важни две неща:")]));
kids.push(bullet([t("Месечни GPS такси", { bold: true }), t(" се фактурират през "), t("/invoice", { font: "Consolas", size: 20 }), t(" с "), t("invoice_type: \"gps_fee\"", { font: "Consolas", size: 20 }), t(" — само за активни, не-изключени клиенти.")]));
kids.push(bullet([t("Изключени клиенти", { bold: true }), t(" (напр. Borima Trans, "), t("excluded_from_auto_send=true", { font: "Consolas", size: 20 }), t(") НЕ получават нови GPS фактури. Историята им остава непокътната.")]));

// 11 Errors
kids.push(h1("11. Когато нещо се обърка"));
kids.push(bullet([t("Грешка от endpoint (4xx/5xx)", { bold: true }), t(" → логни локално (без тайни), опитай по-късно. Не заобикаляй през директен достъп до базата.")]));
kids.push(bullet([t("Несигурно съвпадение", { bold: true }), t(" → "), t("/manual-review", { font: "Consolas", size: 20 }), t(", остави човек да реши.")]));
kids.push(bullet([t("Не си сигурен дали действие е безопасно", { bold: true }), t(" → не го прави; питай Ивайло.")]));
kids.push(bullet([t("Без безкрайни повторения", { bold: true }), t(" — ако нещо се проваля многократно, спри и известѝ.")]));

// 12 Checklist
kids.push(h1("12. Контролен списък за поддръжка"));
kids.push(h2("Всеки ден"));
kids.push(bullet([t("Нови имейли → активности; нови фактури/плащания въведени.")]));
kids.push(bullet([t("Meta анализ изпратен сутринта.")]));
kids.push(bullet([t("Ръчна проверка: има ли натрупани отворени случаи?")]));
kids.push(h2("Всяка седмица"));
kids.push(bullet([t("Реконсилиация: всички плащания вързани към фактури или в ръчна проверка.")]));
kids.push(bullet([t("Без дубликати контакти/фактури (дедуп ключовете работят).")]));
kids.push(h2("Всеки месец (1–8 число)"));
kids.push(bullet([t("GPS/абонаментни фактури издадени (без изключени клиенти).")]));
kids.push(bullet([t("Банкови извлечения към счетоводител.")]));
kids.push(bullet([t("Преглед на оборот/печалба през "), t("accounting-summary", { font: "Consolas", size: 20 }), t(".")]));

// 13 Golden summary
kids.push(h1("13. Накратко (закачи на стената)"));
kids.push(p([t("Чети → структурирай → пиши само през API с идемпотентен ключ → при съмнение в ръчна проверка → всичко в EUR → не пращай имейли без одобрение → не пипай база/код/деплой.", { bold: true })]));

// ---------- assemble ----------
const doc = new Document({
  creator: "ProMarketing LTD",
  title: "Хермес — пълни инструкции",
  description: "Оперативен наръчник за Hermes (CRM на ProMarketing)",
  numbering: {
    config: [
      { reference: "donum", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START, style: { run: { bold: true, color: ACCENT } } }] },
      { reference: "dontnum", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.START, style: { run: { bold: true, color: NO } } }] },
    ],
  },
  sections: [{
    properties: { page: { margin: { top: 1000, bottom: 1000, left: 1100, right: 1100 } } },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "ProMarketing LTD · Хермес инструкции · стр. ", font: "Calibri", size: 16, color: GREY }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Calibri", size: 16, color: GREY }),
        ] })] }),
    },
    children: kids,
  }],
});

const buffer = await Packer.toBuffer(doc);
const out = "docs/Хермес-инструкции.docx";
writeFileSync(out, buffer);
console.log("WROTE " + out + " (" + buffer.length + " bytes)");
