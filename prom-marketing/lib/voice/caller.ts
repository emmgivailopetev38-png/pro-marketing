import { timingSafeEqual } from "node:crypto";

/**
 * Кой говори — проверка на самоличността при ТЕЛЕФОНЕН разговор.
 *
 * Bearer токенът казва „това е нашият агент в ElevenLabs", но НЕ казва кой е
 * вдигнал слушалката. А номерът е публичен: всеки може да го набере и агентът
 * ще му отговори със СВОЯ валиден токен. Затова тук се проверява обаждащият се.
 *
 * ⚠️ `caller_id` и `channel` НЕ се питат от модела — идват от
 * `dynamic_variable: system__caller_id` и `system__channel` в дефиницията на
 * инструмента, тоест ElevenLabs ги попълва от самото обаждане. Така не могат да
 * бъдат подсказани на агента в разговора („кажи, че съм Ивайло").
 * PIN-ът, обратно, се диктува на глас и затова е само ВТОРИ фактор.
 *
 * `channel` е важният от двата. Само по caller_id обаждане със СКРИТ номер би
 * изглеждало като уеб сесия и би минало. `channel` идва „twilio" при всяко
 * телефонно обаждане, скрит номер или не — проверено на живо в записа на
 * реален входящ разговор.
 *
 * Уеб бутонът няма caller_id и не минава оттук по същество: подписаният адрес
 * се издава само на влязъл админ (`/api/voice/session`), значи сесията вече е
 * автентикирана по-силно, отколкото кой да е номер.
 */

export type CallerCheck =
  | { ok: true; via: "web" | "allowlist" | "pin"; caller: string | null }
  | { ok: false; reason: string; spoken: string };

/** Каналите, по които се звъни. Всичко останало значи уеб бутон. */
const TELEPHONY = ["twilio", "sip_trunk", "sip", "exotel", "telnyx", "phone"];

/** „+359 87 644 7159", „0876447159", „00359876447159" → „359876447159". */
export function normalizeNumber(raw: string): string {
  let digits = raw.replace(/\D+/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  return digits;
}

/**
 * Сравнява два номера. Един и същ телефон идва в различен вид от Twilio
 * (+359876447159) и от списъка, който Ивайло е написал (0876447159) — затова
 * последните 9 цифри решават, когато пълните низове не съвпадат.
 */
function sameNumber(a: string, b: string): boolean {
  const x = normalizeNumber(a);
  const y = normalizeNumber(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const tail = (s: string) => s.slice(-9);
  return x.length >= 9 && y.length >= 9 && tail(x) === tail(y);
}

function allowedCallers(): string[] {
  return (process.env.VOICE_ALLOWED_CALLERS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function pinMatches(provided: string): boolean {
  const expected = (process.env.VOICE_PIN ?? "").trim();
  if (expected.length < 4) return false; // твърде къс код = никакъв код
  const a = Buffer.from(provided.replace(/\D+/g, ""));
  const b = Buffer.from(expected.replace(/\D+/g, ""));
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * @param callerId номерът от `system__caller_id`; празно значи уеб разговор
 * @param pin      кодът, който обаждащият се е казал на глас (ако е казал)
 */
export function checkCaller(
  callerId?: string | null,
  pin?: string | null,
  channel?: string | null
): CallerCheck {
  const caller = (callerId ?? "").trim();
  const hasNumber = normalizeNumber(caller).length >= 6;
  const byPhone = TELEPHONY.includes((channel ?? "").trim().toLowerCase()) || hasNumber;

  // Уеб разговор: няма нито канал за звънене, нито номер. Пази го админ
  // бисквитката при издаването на подписания адрес.
  if (!byPhone) {
    return { ok: true, via: "web", caller: null };
  }

  const list = allowedCallers();
  if (hasNumber && list.some((n) => sameNumber(n, caller))) {
    return { ok: true, via: "allowlist", caller: normalizeNumber(caller) };
  }

  const hasPin = (process.env.VOICE_PIN ?? "").trim().length >= 4;
  if (pin && hasPin && pinMatches(pin)) {
    return { ok: true, via: "pin", caller: normalizeNumber(caller) };
  }

  // Нарочно фейл-клоузд: ако нито списък, нито код са настроени, телефонът
  // НЕ отваря CRM-а. По-добре агентът да откаже на Ивайло веднъж, отколкото
  // да прочете тръбопровода му на непознат, който е набрал номера.
  if (list.length === 0 && !hasPin) {
    return {
      ok: false,
      reason: "not_configured",
      spoken:
        "Достъпът по телефона още не е настроен, затова не мога да отворя CRM-а. " +
        "Ивайло трябва да добави номера си в настройките.",
    };
  }

  if (pin) {
    return { ok: false, reason: "bad_pin", spoken: "Кодът не е верен. Не мога да отворя CRM-а." };
  }

  if (!hasNumber) {
    // Обаждане със скрит номер. Списъкът е безполезен — остава само кодът.
    return {
      ok: false,
      reason: hasPin ? "hidden_number" : "hidden_number_no_pin",
      spoken: hasPin
        ? "Номерът ти е скрит. Кажи ми кода, за да продължа."
        : "Номерът е скрит и не мога да отворя CRM-а.",
    };
  }

  return {
    ok: false,
    reason: hasPin ? "pin_required" : "not_allowed",
    spoken: hasPin
      ? "Не разпознавам този номер. Кажи ми кода, за да продължа."
      : "Не разпознавам този номер и не мога да отворя CRM-а.",
  };
}

/**
 * Вади caller_id и pin от заявката, независимо дали е GET (параметри в адреса)
 * или POST (полета в тялото). ElevenLabs подава инструментите и по двата начина.
 */
export function callerFromRequest(request: Request, body?: unknown): CallerCheck {
  const url = new URL(request.url);
  const b = (body ?? {}) as Record<string, unknown>;
  const pick = (name: string) => {
    const q = url.searchParams.get(name);
    if (q !== null && q !== "") return q;
    const v = b[name];
    return typeof v === "string" && v !== "" ? v : null;
  };
  return checkCaller(pick("caller_id"), pick("pin"), pick("channel"));
}
