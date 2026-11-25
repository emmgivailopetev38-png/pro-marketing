/**
 * Сървърното събитие CompleteRegistration за пиксела на уебинара (Conversions API).
 *
 * Браузърът праща същото събитие със същия event_id, така че Meta го брои
 * веднъж (дедупликация), а когато браузърът е блокиран (iPhone, блокер на
 * реклами), събитието пак стига — от сървъра. Тук са само чистите помощници;
 * изпращането е в /api/uebinar/register.
 */

/** Стойността на една бисквитка от заглавието `cookie` (или null). */
export function cookieValue(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i === -1) continue;
    if (part.slice(0, i).trim() !== name) continue;
    const v = part.slice(i + 1).trim();
    if (!v) return null;
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return null;
}

/**
 * fbc: бисквитката _fbc, ако я има; иначе се прави от fbclid в адреса
 * (форматът на Meta: fb.1.<милисекунди>.<fbclid>).
 */
export function fbcFor(
  cookieHeader: string | null | undefined,
  fbclid: string | null | undefined,
  nowMs: number = Date.now(),
): string | null {
  const c = cookieValue(cookieHeader, "_fbc");
  if (c) return c;
  const id = (fbclid ?? "").trim();
  return id ? `fb.1.${nowMs}.${id}` : null;
}

/** „Иван Петров Иванов“ → първо име „Иван“, фамилия „Иванов“ (последната дума). */
export function splitName(full: string): { firstName: string | null; lastName: string | null } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  return { firstName: parts[0], lastName: parts[parts.length - 1] };
}

/** IP адресът на човека зад Vercel: първият адрес в x-forwarded-for. */
export function clientIp(forwardedFor: string | null | undefined, realIp?: string | null): string | null {
  const first = (forwardedFor ?? "").split(",")[0]?.trim();
  if (first) return first;
  const r = (realIp ?? "").trim();
  return r || null;
}

/** event_id от браузъра: само букви, цифри, „-“ и „_“, до 100 знака. */
export function safeEventId(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  return /^[A-Za-z0-9_-]{8,100}$/.test(v) ? v : null;
}
