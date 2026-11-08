/**
 * /obuchenie-az — „AI обучение за екипа, платено от държавата“ (08.11.2026).
 * Проект „Специфични умения за работната сила“ на Агенцията по заетостта,
 * срок за заявления 16.11.2026, 16:00. Тук са само константите и чистите
 * помощници (без мрежа и база) — за страницата, за маршрута и за тестовете.
 */

/** Краят на приема — 16.11.2026, 16:00 по София. */
export const OBUCHENIE_AZ_DEADLINE = "2026-11-16T16:00:00+02:00";

/** Източникът на новия картон и `metadata.form_id` на заявката (виж FORM_PROFILES в lib/voice/auto-call-rules.ts). */
export const OBUCHENIE_AZ_SOURCE = "sait-obuchenie-az";
export const OBUCHENIE_AZ_CAMPAIGN = "AI обучение АЗ 2026-11";
export const OBUCHENIE_AZ_PAGE = "/obuchenie-az";

export const EMPLOYEE_OPTIONS = [
  { value: "sam", label: "Само аз" },
  { value: "s2_5", label: "2–5" },
  { value: "s6_15", label: "6–15" },
  { value: "s16", label: "Над 15" },
] as const;
export type EmployeesKey = (typeof EMPLOYEE_OPTIONS)[number]["value"];

export function employeesLabel(key: string | null | undefined): string | null {
  return EMPLOYEE_OPTIONS.find((o) => o.value === key)?.label ?? null;
}

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
export type UtmKey = (typeof UTM_KEYS)[number];
export type Utm = Partial<Record<UtmKey, string>>;

/** Само познатите ключове, подрязани, без празни. */
export function cleanUtm(raw: Record<string, unknown> | null | undefined): Utm {
  const out: Utm = {};
  if (!raw) return out;
  for (const k of UTM_KEYS) {
    const v = raw[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 200);
  }
  return out;
}

/**
 * Телефон в български формат, толерантно: „0888 123 456“, „+359 88 812 3456“,
 * „00359…“, „088-812-3456“. Връща нормализиран номер (+359… за български,
 * иначе +цифрите) или null, ако не прилича на телефон.
 */
export function normalizeBgPhone(raw: string | null | undefined): string | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  if (/[^\d\s+()./-]/.test(s)) return null;
  let d = s.replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("359")) d = d.slice(3);
  else if (d.startsWith("0")) d = d.slice(1);
  else if (s.startsWith("+")) return d.length >= 8 && d.length <= 15 ? `+${d}` : null;
  // Български: мобилни 8 цифри след 0 + 1 (87/88/89/98…), стационарни 7–9.
  if (d.length < 7 || d.length > 9) return null;
  return `+359${d}`;
}

export interface ObuchenieAzLead {
  full_name: string;
  phone: string;
  email: string | null;
  company: string | null;
  employees: string | null;
  utm: Utm;
}

/** „Служители на трудов договор: 2–5“ — влиза в бележката и в разговора на Ели. */
export function answersSummary(lead: Pick<ObuchenieAzLead, "employees">): string {
  const l = employeesLabel(lead.employees);
  return l ? `Служители на трудов договор: ${l}` : "";
}

/** Текстът на активността в картона. */
export function activityBody(lead: ObuchenieAzLead): string {
  const utm = Object.entries(lead.utm)
    .map(([k, v]) => `${k}=${v}`)
    .join(" · ");
  return [
    `Кампания: ${OBUCHENIE_AZ_CAMPAIGN}`,
    `Страница: promarketing.pw${OBUCHENIE_AZ_PAGE}`,
    `Служители на трудов договор: ${employeesLabel(lead.employees) ?? "—"}`,
    lead.company ? `Фирма: ${lead.company}` : null,
    lead.email ? `Имейл: ${lead.email}` : null,
    `UTM: ${utm || "—"}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** „До края на приема: 7 дни 19 часа“ — или null след срока. */
export function countdownText(now: Date, deadline: string = OBUCHENIE_AZ_DEADLINE): string | null {
  const left = new Date(deadline).getTime() - now.getTime();
  if (left <= 0) return null;
  const totalH = Math.floor(left / 3_600_000);
  const days = Math.floor(totalH / 24);
  const hours = totalH % 24;
  if (days === 0) {
    const mins = Math.floor((left % 3_600_000) / 60_000);
    return `До края на приема: ${hours} ${hours === 1 ? "час" : "часа"} ${mins} мин`;
  }
  return `До края на приема: ${days} ${days === 1 ? "ден" : "дни"} ${hours} ${hours === 1 ? "час" : "часа"}`;
}
