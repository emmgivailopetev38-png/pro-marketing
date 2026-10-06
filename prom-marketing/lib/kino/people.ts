/**
 * Малките чисти правила около човека от залата: телефонът, мястото на
 * билета, UTM-ите и ролята му. Без база и без браузър — ползват ги и
 * формата, и сървърът, и тестовете.
 */

// ── телефонът ───────────────────────────────────────────────────────────────

export type PhoneResult =
  | { ok: true; e164: string; bg: boolean; pretty: string }
  | { ok: false; reason: string };

/**
 * Български номер в какъвто и да е запис (0888 123 456 · +359 888… · 00359…)
 * → +359XXXXXXXXX. Чужд номер се приема само с изричен код (+44…, 0049…).
 */
export function normalizePhone(raw: string | null | undefined): PhoneResult {
  const input = (raw ?? "").trim();
  if (!input) return { ok: false, reason: "Телефонът е задължителен." };
  if (/[a-zа-я]/i.test(input)) return { ok: false, reason: "Само цифри, моля — напр. 0888 123 456." };
  let d = input.replace(/[^\d+]/g, "");
  if (d.startsWith("00")) d = `+${d.slice(2)}`;
  let national: string | null = null;
  if (d.startsWith("+359")) national = d.slice(4);
  else if (d.startsWith("359") && d.length >= 11) national = d.slice(3);
  else if (d.startsWith("0") && !d.startsWith("00")) national = d.slice(1);
  else if (!d.startsWith("+") && /^[89]\d{8}$/.test(d)) national = d;
  // „+359 0888…“ — нулата след кода е честа грешка, не друг номер.
  if (national !== null && /^0\d{8,9}$/.test(national)) national = national.slice(1);

  if (national !== null) {
    if (!/^[1-9]\d{7,8}$/.test(national)) {
      return { ok: false, reason: "Номерът изглежда непълен — напр. 0888 123 456." };
    }
    const e164 = `+359${national}`;
    return { ok: true, e164, bg: true, pretty: prettyBg(national) };
  }
  if (d.startsWith("+") && /^\+[1-9]\d{7,14}$/.test(d)) {
    return { ok: true, e164: d, bg: false, pretty: d };
  }
  return { ok: false, reason: "Въведи български номер, напр. 0888 123 456." };
}

function prettyBg(national: string): string {
  // 888123456 → 0888 123 456 · 21234567 → 02 123 4567
  if (national.length === 9) return `0${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`;
  return `0${national.slice(0, 1)} ${national.slice(1, 4)} ${national.slice(4)}`;
}

/** Мобилен ли е българският номер — SMS-ите отиват само там. */
export function isBgMobile(e164: string): boolean {
  return /^\+359(8[789]|9[89])\d{7}$/.test(e164);
}

// ── мястото на билета ───────────────────────────────────────────────────────

/**
 * „ЗАЛА 1 · РЕД 7 · МЯСТО 12“. Мястото идва от id-то на картона — едно и
 * също при всяко отваряне, без да се пази никъде. Не е „номер по ред“ и не
 * подсказва колко души са се записали (никакви фалшиви броячи).
 */
export function seatFor(contactId: string): { hall: number; row: number; seat: number } {
  let h = 0x811c9dc5;
  for (let i = 0; i < contactId.length; i++) {
    h ^= contactId.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return { hall: 1, row: 1 + (h % 12), seat: 1 + (Math.floor(h / 12) % 18) };
}

// ── ролята („Имаш ли бизнес?“) ──────────────────────────────────────────────

export const KINO_ROLES = [
  { id: "owner", label: "Собственик" },
  { id: "manager", label: "Управител" },
  { id: "starting", label: "Още не — искам да започна" },
  { id: "employee", label: "Работя за някого" },
] as const;

export type KinoRole = (typeof KINO_ROLES)[number]["id"];

export function isKinoRole(v: unknown): v is KinoRole {
  return typeof v === "string" && KINO_ROLES.some((r) => r.id === v);
}

export function roleLabel(v: string | null | undefined): string {
  return KINO_ROLES.find((r) => r.id === v)?.label ?? "—";
}

/** Собственик или управител — тях Димитър търси в ден −1. */
export function isDecisionMaker(role: string | null | undefined): boolean {
  return role === "owner" || role === "manager";
}

// ── UTM ─────────────────────────────────────────────────────────────────────

export const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;
export type KinoUtm = Partial<Record<(typeof UTM_KEYS)[number], string>>;

/** Взима UTM-ите от адреса (или от записаните при първото влизане), подрязани и без празни. */
export function pickUtm(source: URLSearchParams | Record<string, unknown> | null | undefined): KinoUtm {
  const out: KinoUtm = {};
  if (!source) return out;
  for (const k of UTM_KEYS) {
    const raw = source instanceof URLSearchParams ? source.get(k) : source[k];
    if (typeof raw === "string" && raw.trim()) out[k] = raw.trim().slice(0, 150);
  }
  return out;
}

/** Едноредово описание за картона в CRM-а: „meta / cpc / valnata-reg / video1“. */
export function utmLine(utm: KinoUtm): string | null {
  const parts = [utm.utm_source, utm.utm_medium, utm.utm_campaign, utm.utm_content].filter(Boolean);
  return parts.length ? parts.join(" / ") : null;
}

// ── калкулаторът „колко ти струва чакането“ ────────────────────────────────

export interface WaitingCost {
  clientsPerYear: number;
  yearlyEur: number;
  monthlyEur: number;
}

/**
 * Запитвания седмично × 52 × % клиенти × стойност на клиента. Груба сметка
 * по числата на човека — не обещание. Отрицателни и абсурдни стойности се
 * свиват до разумното, за да не излезе „минус 3 клиента“.
 */
export function costOfWaiting(input: { inquiriesPerWeek: number; closeRatePct: number; clientValueEur: number }): WaitingCost {
  const inquiries = Math.max(0, Math.min(10_000, Number(input.inquiriesPerWeek) || 0));
  const rate = Math.max(0, Math.min(100, Number(input.closeRatePct) || 0)) / 100;
  const value = Math.max(0, Math.min(10_000_000, Number(input.clientValueEur) || 0));
  const clientsPerYear = inquiries * 52 * rate;
  const yearlyEur = clientsPerYear * value;
  return { clientsPerYear, yearlyEur, monthlyEur: yearlyEur / 12 };
}
