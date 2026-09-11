/**
 * Колко топъл е един контакт — по това какво е направил ТОЙ, не какво сме
 * пратили ние.
 *
 * Досега опашката се подреждаше по `next_followup_at`, тоест по календар.
 * Календарът казва „обещал си да звъннеш", но не казва „този вдигна ръка".
 * Затова 157 контакта стояха недокоснати: те нямат обещание, значи не са
 * просрочени, значи не изплуват никъде.
 *
 * Тук се брои другото: човекът отворил ли е нещо, отговорил ли е, говорил ли
 * е с агента. Всеки такъв сигнал носи точки, които затихват с времето —
 * отворена оферта отпреди три месеца не е топлина, а спомен.
 *
 * Без "server-only" нарочно: същите правила трябват и на крона (сутрешния
 * списък), и на опашката в /admin, и на тестовете.
 */

import { dayKey, TZ } from "./followup";

// ─────────────────────────────────────────────────────────────────────────
// Сигналите
// ─────────────────────────────────────────────────────────────────────────

/**
 * Точки за действие, което човекът е направил САМ.
 *
 * Нашите докосвания (`email_sent`, `offer_sent`, `presentation_sent`) не са
 * тук нарочно — те не казват нищо за интереса му. `call` и `meeting` също не
 * са: те се броят от `followupState` и човек с проведена среща вече е излязъл
 * от тази опашка.
 */
export const SIGNAL_POINTS: Record<string, number> = {
  booking: 12,
  booking_voice: 12,
  email_received: 10,
  voice_call: 8,
  offer_viewed: 7,
  zatopli_view: 5,
  voice_web_session: 4,
  website_form: 3,
  meta_lead: 2,
};

export const SIGNAL_LABEL: Record<string, string> = {
  booking: `записа си час`,
  booking_voice: `записа си час през агента`,
  email_received: `отговори на имейл`,
  voice_call: `говори с гласовия агент`,
  offer_viewed: `отвори офертата`,
  zatopli_view: `отвори личния линк`,
  voice_web_session: `отвори гласовия агент`,
  website_form: `попълни форма на сайта`,
  meta_lead: `остави данни в реклама`,
};

/** Типовете, които изобщо си струва да четем от базата. */
export const SIGNAL_TYPES = Object.keys(SIGNAL_POINTS);

// ─────────────────────────────────────────────────────────────────────────
// Затихването
// ─────────────────────────────────────────────────────────────────────────

/**
 * Тежестта на сигнал на възраст `days` дни.
 *
 * Стъпаловидно, не експоненциално: прагът трябва да се чете от човек и да се
 * обяснява с едно изречение („до седмица брои пълно, след два месеца почти
 * не брои"). Никога не пада до нула — старият сигнал все пак е по-добър от
 * никакъв, когато подреждаме сто души.
 */
export function decayFor(days: number): number {
  if (days <= 3) return 1;
  if (days <= 7) return 0.8;
  if (days <= 14) return 0.6;
  if (days <= 30) return 0.4;
  if (days <= 60) return 0.2;
  return 0.1;
}

/** Цели дни между два момента, по календарен ден в София. */
export function daysBetween(from: string | Date, to: string | Date = new Date(), tz: string = TZ): number {
  const a = new Date(`${dayKey(from, tz)}T00:00:00Z`).getTime();
  const b = new Date(`${dayKey(to, tz)}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

// ─────────────────────────────────────────────────────────────────────────
// Резултатът
// ─────────────────────────────────────────────────────────────────────────

export interface WarmthSignal {
  activity_type: string;
  occurred_at: string;
}

export interface WarmthReason {
  /** Какво е направил — готово за показване. */
  label: string;
  /** Точките СЛЕД затихването, закръглени до десетица. */
  points: number;
  occurred_at: string;
  days_ago: number;
}

/**
 * Лентите, в които пада човекът.
 *
 * `hot` е за звънене днес — той вече е вдигнал ръка и съобщението само ще
 * забави разговора. `warm` е за съобщение с личен линк. `cold` и `untouched`
 * се различават по едно: студеният е получил нещо от нас, недокоснатият —
 * нищо. Второто е наша грешка, не негов отказ.
 */
export type WarmthBand = "hot" | "warm" | "cold" | "untouched";

export const BAND_LABEL: Record<WarmthBand, string> = {
  hot: `Звънни днес`,
  warm: `Затопли`,
  cold: `Нов повод`,
  untouched: `Недокоснат`,
};

export const BAND_COLOR: Record<WarmthBand, string> = {
  hot: "#22c55e",
  warm: "#facc15",
  cold: "#7da8cc",
  untouched: "#fb923c",
};

/** Прагът, над който човек отива директно за обаждане. */
export const HOT_THRESHOLD = 7;
/** Прагът, над който изобщо има някаква топлина. */
export const WARM_THRESHOLD = 2;

export interface WarmthResult {
  score: number;
  band: WarmthBand;
  reasons: WarmthReason[];
  /** Последният сигнал от човека — `null`, ако никога не е реагирал. */
  last_signal_at: string | null;
}

/**
 * Смята топлината на един контакт от неговите активности.
 *
 * `touched` казва дали изобщо сме го докосвали (имейл, обаждане, каквото и да
 * е). Разделя `cold` от `untouched` — двете искат различно съобщение и
 * различен ред в опашката.
 */
export function warmthOf(
  signals: WarmthSignal[],
  opts: { touched: boolean; now?: Date | string } = { touched: true }
): WarmthResult {
  const now = opts.now ?? new Date();
  const reasons: WarmthReason[] = [];
  let score = 0;
  let last: string | null = null;

  for (const s of signals) {
    const base = SIGNAL_POINTS[s.activity_type];
    if (base === undefined) continue;

    const days = daysBetween(s.occurred_at, now);
    const points = Math.round(base * decayFor(days) * 10) / 10;
    score += points;
    reasons.push({
      label: SIGNAL_LABEL[s.activity_type] ?? s.activity_type,
      points,
      occurred_at: s.occurred_at,
      days_ago: days,
    });
    if (!last || new Date(s.occurred_at) > new Date(last)) last = s.occurred_at;
  }

  reasons.sort((a, b) => b.points - a.points || +new Date(b.occurred_at) - +new Date(a.occurred_at));
  score = Math.round(score * 10) / 10;

  let band: WarmthBand;
  if (score >= HOT_THRESHOLD) band = "hot";
  else if (score >= WARM_THRESHOLD) band = "warm";
  else if (opts.touched) band = "cold";
  else band = "untouched";

  return { score, band, reasons, last_signal_at: last };
}

/**
 * Редът в опашката.
 *
 * Първо лентата (топлите се звънят, преди да са изстинали), после точките, и
 * чак накрая давността на сигнала. Недокоснатите изпреварват студените при
 * равни точки: на тях дължим първото докосване, а не поредното.
 */
const BAND_ORDER: Record<WarmthBand, number> = { hot: 0, warm: 1, untouched: 2, cold: 3 };

export function compareWarmth(a: WarmthResult, b: WarmthResult): number {
  const byBand = BAND_ORDER[a.band] - BAND_ORDER[b.band];
  if (byBand !== 0) return byBand;
  if (b.score !== a.score) return b.score - a.score;
  const at = a.last_signal_at ? +new Date(a.last_signal_at) : 0;
  const bt = b.last_signal_at ? +new Date(b.last_signal_at) : 0;
  return bt - at;
}
