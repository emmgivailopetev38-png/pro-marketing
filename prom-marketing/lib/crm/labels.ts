// Pure UI label + colour maps for the accounting entities. No zod / no DB —
// safe to import into client components without bundling validation code.

export const INVOICE_TYPE_LABEL: Record<string, string> = {
  invoice: "Фактура",
  proforma: "Проформа",
  credit_note: "Кредитно",
  gps_fee: "GPS такса",
  demo_fee: "Demo такса",
  service_fee: "Услуга",
  other: "Друго",
};

export const INVOICE_STATUS_LABEL: Record<string, string> = {
  draft: "Чернова",
  sent: "Изпратена",
  awaiting_payment: "Чака плащане",
  partially_paid: "Частично платена",
  paid: "Платена",
  overdue: "Просрочена",
  cancelled: "Анулирана",
  disputed: "Спорна",
  excluded: "Изключена",
};

export const INVOICE_STATUS_COLOR: Record<string, string> = {
  draft: "#64748b",
  sent: "#7da8cc",
  awaiting_payment: "#facc15",
  partially_paid: "#fb923c",
  paid: "#22c55e",
  overdue: "#ef4444",
  cancelled: "#64748b",
  disputed: "#ef4444",
  excluded: "#64748b",
};

export const PAYMENT_MATCH_STATUS_LABEL: Record<string, string> = {
  matched: "Засечено",
  unmatched: "Незасечено",
  ambiguous: "Неясно",
  ignored: "Игнорирано",
};

export const PAYMENT_MATCH_STATUS_COLOR: Record<string, string> = {
  matched: "#22c55e",
  unmatched: "#facc15",
  ambiguous: "#fb923c",
  ignored: "#64748b",
};

export const MANUAL_REVIEW_TYPE_LABEL: Record<string, string> = {
  invoice_match: "Засичане на фактура",
  payment_match: "Засичане на плащане",
  missing_contact: "Липсва контакт",
  ambiguous_pdf: "Неясен PDF",
  email_parse_error: "Грешка при имейл",
  bank_statement_error: "Грешка в извлечение",
  duplicate_invoice: "Дублирана фактура",
  recurring_billing_issue: "Проблем с абонамент",
};

export const SEVERITY_COLOR: Record<string, string> = {
  low: "#7da8cc",
  medium: "#facc15",
  high: "#ef4444",
};

export const DOC_TYPE_LABEL: Record<string, string> = {
  invoice: "Фактура",
  proforma: "Проформа",
  receipt: "Талон / бележка",
  bank_statement: "Банково извлечение",
  contract: "Договор",
  photo: "Снимка",
  gps_protocol: "GPS протокол",
  other: "Друго",
};

export const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  accountant: "Счетоводител",
  hosting: "Хостинг",
  ads: "Реклами",
  gps_hardware: "GPS хардуер",
  software: "Софтуер",
  office: "Офис",
  salary: "Заплати",
  tax: "Данъци",
  bank_fee: "Банкови такси",
  other: "Друго",
};

export const EXPENSE_STATUS_LABEL: Record<string, string> = {
  unpaid: "Неплатен",
  paid: "Платен",
  partially_paid: "Частично",
  cancelled: "Анулиран",
};

export const EXPENSE_STATUS_COLOR: Record<string, string> = {
  unpaid: "#facc15",
  paid: "#22c55e",
  partially_paid: "#fb923c",
  cancelled: "#64748b",
};

export const RECURRING_SERVICE_TYPE_LABEL: Record<string, string> = {
  gps: "GPS",
  crm: "CRM",
  automation: "Автоматизация",
  hosting: "Хостинг",
  maintenance: "Поддръжка",
  ads: "Реклами",
  other: "Друго",
};

/** Format an amount with its currency, Bulgarian locale. */
export function formatMoney(amount: number | null | undefined, currency = "EUR"): string {
  if (amount == null) return "—";
  return `${Number(amount).toLocaleString("bg-BG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

/** Short date (DD.MM.YYYY) or em-dash. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("bg-BG", { day: "2-digit", month: "2-digit", year: "numeric" });
}
