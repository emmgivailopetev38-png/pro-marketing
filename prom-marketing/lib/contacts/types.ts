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

// Sales follow-up status — the "where are we on the last touch" state, distinct
// from the pipeline `stage`. Kept in sync with the DB CHECK constraint in
// 20260604120000_crm_hermes_backend.sql.
export const FOLLOWUP_STATUSES = [
  "sent_email",
  "sent_presentation",
  "sent_offer",
  "sent_proforma",
  "needs_call",
  "called_waiting_feedback",
  "interested",
  "not_interested",
  "ready_to_close",
] as const;

export type FollowupStatus = (typeof FOLLOWUP_STATUSES)[number];

export const FOLLOWUP_STATUS_LABEL: Record<FollowupStatus, string> = {
  sent_email: "Изпратен имейл",
  sent_presentation: "Изпратена презентация",
  sent_offer: "Изпратена оферта",
  sent_proforma: "Изпратена проформа",
  needs_call: "Да се обади",
  called_waiting_feedback: "Чака обратна връзка",
  interested: "Заинтересован",
  not_interested: "Незаинтересован",
  ready_to_close: "Готов за затваряне",
};

export const FOLLOWUP_STATUS_COLOR: Record<FollowupStatus, string> = {
  sent_email: "#a78bfa",
  sent_presentation: "#ec4899",
  sent_offer: "#facc15",
  sent_proforma: "#f59e0b",
  needs_call: "#00d4ff",
  called_waiting_feedback: "#fb923c",
  interested: "#22c55e",
  not_interested: "#64748b",
  ready_to_close: "#10b981",
};

export const ACTIVITY_LABEL: Record<string, string> = {
  meta_lead: "Meta lead",
  website_form: "Форма от сайта",
  booking: "Cal.com среща",
  booking_voice: "Час през гласовия агент",
  voice_web_session: "Отвори гласовия агент",
  voice_call: "Разговор с гласовия агент",
  email_sent: "Изпратен имейл",
  email_received: "Получен имейл",
  call: "Телефонен разговор",
  meeting: "Среща на живо",
  note: "Бележка",
  presentation_sent: "Изпратена презентация",
  offer_sent: "Изпратена оферта",
  offer_ready: "Готова оферта · НЕ Е ИЗПРАТЕНА",
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
  booking_voice: "📅",
  voice_web_session: "🎧",
  voice_call: "🎙️",
  email_sent: "✉️",
  email_received: "📨",
  call: "📞",
  meeting: "🤝",
  note: "📝",
  presentation_sent: "🎯",
  offer_sent: "💎",
  offer_ready: "⏳",
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
  followup_status: FollowupStatus | null;
  last_heard_from_at: string | null;
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
