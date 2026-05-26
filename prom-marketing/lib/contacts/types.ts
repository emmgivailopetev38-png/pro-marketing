export const CONTACT_STAGES = [
  "lead",
  "contacted",
  "discovery",
  "presentation_sent",
  "offer_sent",
  "negotiating",
  "won",
  "lost",
] as const;

export type ContactStage = (typeof CONTACT_STAGES)[number];

export const STAGE_LABEL: Record<ContactStage, string> = {
  lead: "Lead",
  contacted: "В контакт",
  discovery: "Discovery",
  presentation_sent: "Презентация",
  offer_sent: "Изпратена оферта",
  negotiating: "Преговори",
  won: "Спечелен",
  lost: "Загубен",
};

export const STAGE_COLOR: Record<ContactStage, string> = {
  lead: "#7da8cc",
  contacted: "#a78bfa",
  discovery: "#00d4ff",
  presentation_sent: "#ec4899",
  offer_sent: "#facc15",
  negotiating: "#fb923c",
  won: "#22c55e",
  lost: "#64748b",
};

export const ACTIVITY_LABEL: Record<string, string> = {
  meta_lead: "Meta lead",
  website_form: "Форма от сайта",
  booking: "Cal.com среща",
  email_sent: "Изпратен имейл",
  email_received: "Получен имейл",
  call: "Телефонен разговор",
  meeting: "Среща на живо",
  note: "Бележка",
  presentation_sent: "Изпратена презентация",
  offer_sent: "Изпратена оферта",
  contract_sent: "Изпратен договор",
  contract_signed: "Подписан договор",
  payment_received: "Получено плащане",
  work_started: "Старт на работа",
  work_completed: "Завършена работа",
  stage_change: "Промяна на статус",
};

export const ACTIVITY_ICON: Record<string, string> = {
  meta_lead: "📥",
  website_form: "🌐",
  booking: "📅",
  email_sent: "✉️",
  email_received: "📨",
  call: "📞",
  meeting: "🤝",
  note: "📝",
  presentation_sent: "🎯",
  offer_sent: "💎",
  contract_sent: "📜",
  contract_signed: "✍️",
  payment_received: "💰",
  work_started: "🚀",
  work_completed: "✅",
  stage_change: "🔄",
};

export interface ContactRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  stage: ContactStage;
  source: string;
  source_ref: string | null;
  notes: string | null;
  deal_value_eur: number | null;
  next_followup_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityRow {
  id: string;
  contact_id: string;
  activity_type: string;
  title: string;
  body: string | null;
  occurred_at: string;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}
