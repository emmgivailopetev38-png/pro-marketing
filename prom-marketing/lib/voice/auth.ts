import { timingSafeEqual } from "node:crypto";

/**
 * Автентикация за гласовите рутове /api/voice/*.
 *
 * Отделен токен от Хермесовия нарочно: гласовият агент живее в ElevenLabs —
 * трета страна, на която даваме ключ. Ако утре трябва да се смени, се сменя
 * само той, без да пада Хермес. При липсващ VOICE_AGENT_TOKEN се пада обратно
 * към HERMES_API_TOKEN, за да не се чупи, докато променливата се сложи.
 *
 * VOICE_AGENT_ENABLED=false е шалтерът — спира гласа изцяло, без деплой.
 */
export function checkVoiceAuth(request: Request): { ok: true } | { ok: false; reason: string } {
  if ((process.env.VOICE_AGENT_ENABLED ?? "true").toLowerCase() === "false") {
    return { ok: false, reason: "disabled" };
  }

  const header = request.headers.get("authorization") ?? "";
  /**
   * И тук се приема гол токен освен „Bearer <токен>": заглавка от тип
   * „Environment Variable" в ElevenLabs носи само стойността на променливата.
   * Инструментът `sreshta` стоеше на „Value" с шаблон `{{system__env_...}}`,
   * който пътува буквално — затова гласовите инструменти връщаха 403.
   */
  const provided = (header.startsWith("Bearer ") ? header.slice(7) : header).trim();
  if (!provided) return { ok: false, reason: "empty" };

  const candidates = [process.env.VOICE_AGENT_TOKEN, process.env.HERMES_API_TOKEN].filter(
    (t): t is string => typeof t === "string" && t.length > 0
  );
  if (candidates.length === 0) return { ok: false, reason: "no_token_configured" };

  const a = Buffer.from(provided);
  const match = candidates.some((expected) => {
    const b = Buffer.from(expected);
    return a.length === b.length && timingSafeEqual(a, b);
  });
  return match ? { ok: true } : { ok: false, reason: "mismatch" };
}
