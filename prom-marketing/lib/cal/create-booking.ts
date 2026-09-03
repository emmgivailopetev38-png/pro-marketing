/**
 * Записване на час в Cal.com — тоест в Google Календара.
 *
 * Защо през Cal.com, а не право в Google: Cal.com вече държи връзката с
 * календара на Ивайло (оттам идват всички срещи през сайта). Един запис там
 * прави наведнъж четири неща, които иначе трябва да се градят поотделно —
 * събитие в календара, Meet линк, потвърждение до човека и webhook обратно
 * към CRM-а. Собствена Google OAuth връзка би дала същото срещу ден работа и
 * още един ключ за пазене.
 *
 * ⚠️ Създаването на резервация ИЗПРАЩА потвърждение до имейла на човека.
 * Затова се вика само когато имейлът е истински и само когато повикващият го
 * е поискал — виж `send_invite` в /api/voice/tools/booking.
 */

const API = "https://api.cal.com/v2/bookings";

/** Версията на API-то се подава като заглавка; без нея Cal.com отказва. */
const API_VERSION = "2026-02-25";

export const CAL_TIMEZONE = "Europe/Sofia";

function username(): string {
  return (process.env.CAL_USERNAME ?? process.env.NEXT_PUBLIC_CAL_USERNAME ?? "promarketing").trim();
}

function eventSlug(): string {
  return (process.env.CAL_EVENT_SLUG ?? process.env.NEXT_PUBLIC_CAL_EVENT_SLUG ?? "consultation").trim();
}

/**
 * Мостът е готов за работа.
 *
 * ⚠️ Дълго време тук се искаше `CAL_API_KEY` — и понеже такъв никога не е
 * слаган във Vercel, записването в календара мълчеше от деня, в който беше
 * написано. Проверено на живо на 03.09.2026: `POST /v2/bookings` приема
 * резервация БЕЗ никаква автентикация, точно както публичната страница
 * cal.com/promarketing/consultation. Ключът остава само за в бъдеще, ако
 * потрябва резервация от името на акаунта.
 *
 * Затова условието вече е друго: има ли изобщо към кого да се пише.
 */
export function isCalWriteConfigured(): boolean {
  return username().length > 0 && eventSlug().length > 0;
}

export type CalBookingInput = {
  name: string;
  email: string;
  /** Начало в UTC (ISO). Cal.com иска UTC, не местно време. */
  startISO: string;
  durationMinutes?: number;
  phone?: string | null;
  notes?: string | null;
  timeZone?: string;
};

export type CalBookingResult = {
  ok: boolean;
  uid: string | null;
  meetingUrl: string | null;
  error: string | null;
};

/**
 * Тялото се строи отделно, за да може да се провери с тест, без да се вика
 * чужд сървър.
 */
export function buildCalPayload(input: CalBookingInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    start: new Date(input.startISO).toISOString(),
    eventTypeSlug: eventSlug(),
    username: username(),
    attendee: {
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      timeZone: input.timeZone ?? CAL_TIMEZONE,
      language: "bg",
    },
  };

  if (input.durationMinutes) body.lengthInMinutes = input.durationMinutes;

  /**
   * ⚠️ Телефонът е ЗАДЪЛЖИТЕЛЕН за този тип събитие — полето
   * `attendeePhoneNumber` в Cal.com е `required: true`. Без него отговорът е
   * `responses - {attendeePhoneNumber}error_required_field`, което не прилича
   * на липсващо поле и се чете като счупено API.
   *
   * Мястото му също е чувствително: работи само вътре в `attendee`.
   * В `bookingFieldsResponses` Cal.com го подминава и пак иска полето.
   */
  if (input.phone?.trim()) {
    (body.attendee as Record<string, unknown>).phoneNumber = input.phone.trim();
  }

  // Бележката, надиктувана на глас, отива в описанието на събитието — така
  // в календара пише ЗАЩО е срещата, а не само с кого.
  if (input.notes?.trim()) {
    body.bookingFieldsResponses = { notes: input.notes.trim() };
  }

  return body;
}

/** Изважда линка за среща от отговора, каквато и форма да има. */
function pickMeetingUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  for (const key of ["meetingUrl", "meetingLink", "videoCallUrl", "location"]) {
    const v = d[key];
    if (typeof v === "string" && v.startsWith("http")) return v;
  }
  return null;
}

export async function createCalBooking(input: CalBookingInput): Promise<CalBookingResult> {
  const key = (process.env.CAL_API_KEY ?? "").trim();

  const when = new Date(input.startISO);
  if (Number.isNaN(when.getTime())) {
    return { ok: false, uid: null, meetingUrl: null, error: "invalid_date" };
  }
  // Отказваме рано и с ясна причина: иначе Cal.com връща съобщение за
  // липсващо поле, което звучи като счупено API, а не като липсващ телефон.
  if (!input.phone?.trim()) {
    return { ok: false, uid: null, meetingUrl: null, error: "phone_required" };
  }

  try {
    // Гласовият инструмент трябва да отговори за секунди — по-добре „записах я
    // в CRM-а" с обяснение, отколкото няма отговор и глуха линия.
    const res = await fetch(API, {
      method: "POST",
      headers: {
        // Празна заглавка `Bearer ` е по-лоша от никаква — Cal.com я чете
        // като невалиден ключ и отказва това, което иначе би приел.
        ...(key ? { Authorization: `Bearer ${key}` } : {}),
        "cal-api-version": API_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildCalPayload(input)),
      signal: AbortSignal.timeout(8000),
    });

    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;

    if (!res.ok) {
      const msg =
        (json && typeof json.error === "object" && json.error && "message" in json.error
          ? String((json.error as Record<string, unknown>).message)
          : null) ??
        (json && typeof json.message === "string" ? json.message : null) ??
        `HTTP ${res.status}`;
      return { ok: false, uid: null, meetingUrl: null, error: msg };
    }

    const data = (json?.data ?? json) as Record<string, unknown> | null;
    const uid = data && typeof data.uid === "string" ? data.uid : null;

    return { ok: true, uid, meetingUrl: pickMeetingUrl(data), error: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { ok: false, uid: null, meetingUrl: null, error: msg };
  }
}
