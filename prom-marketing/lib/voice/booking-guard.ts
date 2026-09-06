import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { normalizeEmail, phoneKey, voiceLimits } from "@/lib/voice/quota";

/**
 * Пазачът пред календара — за да не си запише един човек десет срещи.
 *
 * Гласовият агент е убедим по начин, по който формата не е: достатъчно е да
 * му кажеш „запиши ми и вторник, и сряда, и четвъртък" и той ще извика
 * инструмента три пъти, защото точно това го е помолил човекът. Дотук нищо
 * не го спираше и календарът на Ивайло беше на един разговор разстояние от
 * това да се напълни с празни часове.
 *
 * Затова проверката е тук, на сървъра, а не в промпта. Промптът може да се
 * заобиколи с изречение; този файл — не.
 *
 * Три тавана, в този ред:
 *   1. Един ЖИВ час на човек. Второ записване не отказва — предлага да мести.
 *   2. Най-много два записани часа на човек за трийсет дни (местене, отказ,
 *      нов). Трети път значи, че нещо друго не е наред, и Ивайло го уговаря.
 *   3. Най-много осем часа на денонощие през ГЛАСА изобщо. Ако някой пусне
 *      скрипт срещу агента, това е стената, която не зависи от идентичност.
 */

export type BookingGuard =
  | { ok: true }
  | {
      ok: false;
      reason: "has_upcoming" | "too_many" | "day_cap";
      /** Дословното изречение, което агентът казва. */
      spoken: string;
      /** Живата среща, ако има такава — за да я предложим за местене. */
      existingISO?: string;
      existingId?: string;
    };

/** Часовете на глас носят този префикс в `cal_booking_id`. */
const VOICE_PREFIX = "glas:";

export async function checkBookingAllowed(args: {
  email: string | null;
  phone: string | null;
  /** Изречението за живата среща се сглобява отвън — там са говорителите. */
  speakExisting: (when: Date) => string;
}): Promise<BookingGuard> {
  const limits = voiceLimits();
  const email = normalizeEmail(args.email);
  const pk = phoneKey(args.phone);

  try {
    const sb = createServiceClient();
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 3600_000).toISOString();
    const since24 = new Date(now.getTime() - 24 * 3600_000).toISOString();

    /* 3. Общият таван пръв — той не зависи от това кой се обажда и е
          единственият, който държи при подменена самоличност. */
    const { count: today } = await sb
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .like("cal_booking_id", `${VOICE_PREFIX}%`)
      .gte("created_at", since24);
    if ((today ?? 0) >= limits.bookingsPerDay) {
      return {
        ok: false,
        reason: "day_cap",
        spoken:
          "За днес календарът през мен е пълен. Записах какво искаш и Ивайло ще ти се обади, за да го уговорите директно.",
      };
    }

    /* Без имейл и без телефон няма как да познаем човека. Общият таван
       по-горе вече е минал — пускаме, за да не блокираме телефонните
       обаждания, при които често има само номер. */
    if (!email && !pk) return { ok: true };

    /**
     * Всичко записано на глас за трийсет дни. Взима се веднъж и се филтрира
     * в паметта: телефонът в `bookings` е както го е написал човекът
     * („087 7333225"), а на нас ни трябват само цифрите.
     */
    const { data: rows } = await sb
      .from("bookings")
      .select("id, attendee_email, attendee_phone, scheduled_at, status, created_at")
      .like("cal_booking_id", `${VOICE_PREFIX}%`)
      .gte("created_at", since30)
      .order("scheduled_at", { ascending: true })
      .limit(300);

    const mine = (rows ?? []).filter((r) => {
      const e = normalizeEmail(r.attendee_email as string | null);
      if (email && e && e === email) return true;
      const p = phoneKey(r.attendee_phone as string | null);
      return Boolean(pk && p && p === pk);
    });

    /* 1. Жива среща напред във времето. */
    const upcoming = mine.find(
      (r) =>
        String(r.status ?? "") !== "cancelled" &&
        new Date(r.scheduled_at as string).getTime() > now.getTime()
    );
    if (upcoming) {
      const when = new Date(upcoming.scheduled_at as string);
      return {
        ok: false,
        reason: "has_upcoming",
        existingISO: when.toISOString(),
        existingId: String(upcoming.id),
        spoken: args.speakExisting(when),
      };
    }

    /* 2. Твърде много записвания за трийсет дни. */
    if (mine.length >= limits.bookingsPerPerson) {
      return {
        ok: false,
        reason: "too_many",
        spoken:
          "Записвал съм ти час вече няколко пъти този месец и не искам да ти запазя още един напразно. " +
          "Ще предам на Ивайло да ти звънне лично и да го уговорите двамата.",
      };
    }

    return { ok: true };
  } catch (err) {
    // Пазачът не е причина да загубим истинска среща.
    console.error("[voice/booking-guard] проверката падна, пускам записването", err);
    return { ok: true };
  }
}
