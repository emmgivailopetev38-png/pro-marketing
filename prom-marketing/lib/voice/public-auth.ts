import "server-only";
import { timingSafeEqual } from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Пазачът пред ПУБЛИЧНИЯ гласов агент — онзи, който вдига телефона на
 * +1 475 426 9084 и стои зад бутона на началната страница.
 *
 * Защо не `lib/voice/auth.ts`: онзи токен отваря CRM-а на Ивайло — дневния
 * доклад, контактите, парите. Този агент говори с непознати хора и трябва да
 * може само две неща: да каже свободните часове и да запише един час.
 * Един токен за двете би значел, че ключ в чужда система вижда и оборота.
 *
 * `PUBLIC_VOICE_ENABLED=false` спира и телефона, и бутона без деплой.
 */

export function isPublicVoiceEnabled(): boolean {
  return (process.env.PUBLIC_VOICE_ENABLED ?? "true").toLowerCase() !== "false";
}

/**
 * Bearer проверка за инструментите, които вика ElevenLabs.
 *
 * Пада обратно към `VOICE_AGENT_TOKEN`, за да тръгне всичко още преди Ивайло
 * да е сложил новата променлива. Обратното НЕ важи: личните рутове не приемат
 * публичния токен — правата вървят само в тази посока.
 */
export function checkPublicVoiceAuth(request: Request): { ok: true } | { ok: false; reason: string } {
  if (!isPublicVoiceEnabled()) return { ok: false, reason: "disabled" };

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return { ok: false, reason: "no_bearer" };
  const provided = header.slice(7).trim();
  if (!provided) return { ok: false, reason: "empty" };

  const candidates = [process.env.PUBLIC_VOICE_TOKEN, process.env.VOICE_AGENT_TOKEN].filter(
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

/** Активността, по която се брои изразходваното — една на започнат разговор. */
export const VOICE_WEB_ACTIVITY = "voice_web_session";

/**
 * Таванът, който пази 275-те минути в плана.
 *
 * Числата са малки нарочно: 275 минути МЕСЕЧНО значи около 45 разговора по
 * пет минути. Един споделен линк във Фейсбук група изяжда месеца за вечер,
 * а следващият истински клиент чува „услугата не е налична".
 */
function limit(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw > 0 ? raw : fallback;
}

export type Budget =
  | { ok: true; today: number; month: number }
  | { ok: false; reason: "day" | "month"; spoken: string };

export async function checkVoiceBudget(): Promise<Budget> {
  const dayCap = limit("PUBLIC_VOICE_DAILY_LIMIT", 12);
  const monthCap = limit("PUBLIC_VOICE_MONTHLY_LIMIT", 45);

  const sb = createServiceClient();
  const now = Date.now();
  const since = (ms: number) => new Date(now - ms).toISOString();

  const [day, month] = await Promise.all([
    sb
      .from("contact_activities")
      .select("id", { count: "exact", head: true })
      .eq("activity_type", VOICE_WEB_ACTIVITY)
      .gte("created_at", since(24 * 3600_000)),
    sb
      .from("contact_activities")
      .select("id", { count: "exact", head: true })
      .eq("activity_type", VOICE_WEB_ACTIVITY)
      .gte("created_at", since(30 * 24 * 3600_000)),
  ]);

  // Ако броенето се счупи, разговорът минава. По-скъпо е да откажем на
  // истински клиент, отколкото да пуснем един разговор в повече.
  const today = day.count ?? 0;
  const monthly = month.count ?? 0;

  if (monthly >= monthCap) {
    return {
      ok: false,
      reason: "month",
      spoken:
        "Гласовото демо е заето до края на месеца. Запази си час направо от календара — линкът е точно под бутона.",
    };
  }
  if (today >= dayCap) {
    return {
      ok: false,
      reason: "day",
      spoken:
        "За днес гласовото демо е изчерпано. Утре е свободно отново, а час можеш да запазиш и направо от календара.",
    };
  }
  return { ok: true, today, month: monthly };
}
