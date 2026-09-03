import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPublicVoiceAuth } from "@/lib/voice/public-auth";
import { fetchSlots, speakSlots, speakDay, speakTime } from "@/lib/cal/slots";
import { parseWhen } from "@/lib/voice/when";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/public/slots — „кога е свободен Ивайло".
 *
 * Отговорът е ГОТОВО ИЗРЕЧЕНИЕ, не списък. Дадеш ли на модела суров JSON с
 * трийсет часа, той изчита десет от тях подред и човекът отсреща не помни
 * нито един. Затова полето `spoken` е това, което агентът казва, а `slots`
 * стои отдолу само за да може после да запише правилния час.
 *
 * ⚠️ Грешките връщат 200. ElevenLabs превръща всеки HTTP код за грешка в
 * общото „инструментът се провали" и агентът започва да си измисля часове —
 * най-лошият възможен изход, защото звучи убедително.
 */

const schema = z.object({
  /** „другата седмица", „четвъртък", „следобед" — както го е казал човекът. */
  koga: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const auth = checkPublicVoiceAuth(request);
  if (!auth.ok) {
    // Причината влиза в лога, защото трите отказа искат три различни
    // поправки: `no_bearer` значи, че ElevenLabs не е подал заглавката
    // (променливата в инструмента не резолва), `mismatch` — че токенът е
    // друг, а `no_token_configured` — че липсва в самия Vercel.
    console.error("[voice/public/slots] отказан достъп:", auth.reason);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body ?? {});
  const koga = parsed.success ? parsed.data.koga : undefined;

  const res = await fetchSlots({ days: 14 });
  if (!res.ok) {
    console.error("[voice/public/slots]", res.error);
    return NextResponse.json(
      {
        ok: false,
        spoken: "В момента не виждам календара. Кажи ми два часа, които ти вършат работа, и Ивайло ще потвърди.",
      },
      { status: 200 }
    );
  }

  // Поискал ли е конкретен ден — показваме само него, иначе първите свободни.
  if (koga) {
    const wanted = parseWhen(koga, { defaultHour: 10 });
    if (wanted) {
      const day = wanted.date.toISOString().slice(0, 10);
      const sameDay = res.slots.filter((s) => s.day === day);
      if (sameDay.length > 0) {
        const times = sameDay.slice(0, 4).map((s) => speakTime(new Date(s.startISO)));
        return NextResponse.json({
          ok: true,
          slots: sameDay.slice(0, 8),
          // „В понеделник…", не „понеделник…": изречението започва тук и без
          // предлога говорителят го подкарва като продължение на чуждо.
          spoken: `В ${speakDay(wanted.date)} мога в ${times.join(", ")}. Кой да запиша?`,
        });
      }
      return NextResponse.json({
        ok: true,
        slots: res.slots.slice(0, 8),
        spoken: `В ${speakDay(wanted.date)} нямам свободен час. ${speakSlots(res.slots)}`,
      });
    }
  }

  return NextResponse.json({
    ok: true,
    slots: res.slots.slice(0, 8),
    spoken: speakSlots(res.slots),
  });
}
