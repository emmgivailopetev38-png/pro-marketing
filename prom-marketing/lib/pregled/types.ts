/**
 * Страницата за одобрение на видеа (/pregled/<ключ>).
 *
 * Един ред в client_reviews = един пакет клипове за един клиент. Самите
 * клипове са описани в items (jsonb), затова нов пакет за друг клиент е
 * нов ред в базата, не нов код.
 */

export type Verdict = "approved" | "rejected";

export interface ReviewItem {
  /** Кодът на сцената, напр. Ш01 или В03 — така се говори за клипа. */
  code: string;
  /** Кратко име: „Един метър“, „Чекмеджето“. */
  name: string;
  /** Репликата дословно; null при ням клип. */
  line: string | null;
  /** Какво се чува при ням клип: „Без глас, само кухненски шум“. */
  sound?: string | null;
  /** Какво се вижда и за какво е клипът — две-три изречения. */
  about: string;
  /** Път до файла под /public, напр. /videa/shokolad-sh01.mp4 */
  video: string;
  poster: string;
  tags?: string[];
}

export interface ReviewRow {
  id: string;
  key: string;
  contact_id: string | null;
  client_name: string | null;
  title: string;
  intro: string | null;
  items: ReviewItem[];
  view_count: number;
  last_seen_at: string | null;
  submit_count: number;
  submitted_at: string | null;
}

export interface AnswerRow {
  item_code: string;
  verdict: Verdict | null;
  comment: string | null;
  updated_at: string;
}

export interface AnswerInput {
  code: string;
  verdict: Verdict | null;
  comment: string;
}

/** Ключът е само малки латински букви, цифри и тирета — нищо друго не стига до базата. */
export const KEY_PATTERN = /^[a-z0-9][a-z0-9-]{7,79}$/;

export function isValidKey(key: string): boolean {
  return KEY_PATTERN.test(key);
}
