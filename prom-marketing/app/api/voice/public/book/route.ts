import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPublicVoiceAuth } from "@/lib/voice/public-auth";
import { fetchSlots, matchSlot, speakDay, speakSlots, speakTime } from "@/lib/cal/slots";
import { parseWhen } from "@/lib/voice/when";
import { upsertBooking, updateBooking } from "@/lib/crm/repository";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { createCalBooking, isCalWriteConfigured } from "@/lib/cal/create-booking";
import { sendTelegram } from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/public/book — рецепцията записва час при Ивайло.
 *
 * Разликата с `/api/voice/tools/booking` е кой говори. Там Ивайло диктува
 * среща, която ВЕЧЕ е уговорил, и всеки час е приемлив. Тук отсреща е чужд
 * човек и часът трябва да е наистина свободен — иначе Cal.com приема, после
 * отказва, а човекът вече е чул „записах те".
 *
 * Затова редът е: провери в календара → запиши → чак тогава кажи, че е
 * записано. Изречението в `spoken` е единственото, което човекът чува, и то
 * казва дословно какво е станало, включително когато НЕ е станало.
 */

const schema = z.object({
  ime: z.string().trim().min(2).max(120),
  /** По телефона може да го няма — тогава срещата остава за потвърждение. */
  imeil: z.string().trim().max(160).optional(),
  telefon: z.string().trim().max(40).optional(),
  /** „четвъртък в десет", „утре следобед", ISO — както е излязло от разговора. */
  kogato: z.string().trim().min(2).max(80),
  /** За какво е срещата — влиза в календара, за да знае Ивайло преди нея. */
  tema: z.string().trim().max(600).optional(),
  deynost: z.string().trim().max(200).optional(),
});

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const NO_EMAIL = "bez-imeil@promarketing.pw";

export async function POST(request: Request) {
  const auth = checkPublicVoiceAuth(request);
  if (!auth.ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, spoken: "Кажи ми името си и кой час да запиша." },
      { status: 200 }
    );
  }
  const d = parsed.data;
  const email = d.imeil && EMAIL_RE.test(d.imeil.toLowerCase()) ? d.imeil.toLowerCase() : null;

  try {
    const wanted = parseWhen(d.kogato, { defaultHour: 10 });
    if (!wanted) {
      return NextResponse.json(
        { ok: false, spoken: "Не разбрах кой час. Кажи ми деня и часа — например „четвъртък в десет“." },
        { status: 200 }
      );
    }

    const cal = await fetchSlots({ days: 21 });
    if (!cal.ok) {
      // Календарът мълчи. По-добре честно, отколкото обещан час, който после
      // го няма — човекът ще дойде.
      console.error("[voice/public/book] slots", cal.error);
      await notify(d, wanted.date, "календарът не отговори");
      return NextResponse.json(
        {
          ok: false,
          spoken:
            "В момента не мога да стигна до календара. Записах какво искаш и Ивайло ще ти потвърди днес.",
        },
        { status: 200 }
      );
    }

    const { exact, nearest } = matchSlot(cal.slots, wanted.date);
    const slot = exact ?? nearest;

    if (!slot) {
      return NextResponse.json(
        {
          ok: false,
          taken: true,
          spoken: `${speakDay(wanted.date)} в ${speakTime(wanted.date)} е заето. ${speakSlots(cal.slots)}`,
        },
        { status: 200 }
      );
    }

    const start = new Date(slot.startISO);
    // Предложен, а не поискан час — казва се, за да не се окаже човекът
    // изненадан половин час по-късно.
    const shifted = !exact;

    const notes = [d.tema, d.deynost ? `Дейност: ${d.deynost}` : null].filter(Boolean).join(" · ") || null;

    // Календарът пръв: ако той откаже, в CRM-а не бива да остане среща,
    // за която Ивайло мисли, че е потвърдена.
    let inCalendar = false;
    let meetingUrl: string | null = null;
    let calError: string | null = null;

    // И трите са задължителни за Cal.com: типът събитие иска телефон, а без
    // имейл няма къде да отиде потвърждението. Липсва ли едно от тях, часът
    // остава в CRM-а и Ивайло го потвърждава ръчно.
    if (email && d.telefon?.trim() && isCalWriteConfigured()) {
      const res = await createCalBooking({
        name: d.ime,
        email,
        startISO: start.toISOString(),
        phone: d.telefon ?? null,
        notes,
      });
      inCalendar = res.ok;
      meetingUrl = res.meetingUrl;
      calError = res.error;
      if (!res.ok) console.error("[voice/public/book] cal", res.error);
    }

    const booking = await upsertBooking({
      cal_booking_id: `glas:${start.toISOString().slice(0, 16)}:${slug(d.ime)}`,
      attendee_name: d.ime,
      attendee_email: email ?? NO_EMAIL,
      attendee_phone: d.telefon,
      scheduled_at: start.toISOString(),
      duration_minutes: 30,
      status: inCalendar ? "accepted" : "pending",
      business: d.deynost,
      meeting_url: meetingUrl ?? undefined,
      notes: notes ?? undefined,
    });
    if (booking.error) console.error("[voice/public/book] crm", booking.error);
    if (meetingUrl && booking.id) {
      await updateBooking({ id: booking.id, meeting_url: meetingUrl }).catch(() => {});
    }

    // Картонът на човека — за да не остане срещата да виси без контакт.
    if (email || d.telefon) {
      await upsertContactAndLog({
        full_name: d.ime,
        email,
        phone: d.telefon ?? null,
        company: d.deynost ?? null,
        source: "voice_agent",
        initial_stage: "lead",
        bump_stage_to: "discovery",
        activity: {
          type: "booking_voice",
          title: `Запази час по гласовия агент — ${speakDay(start)} в ${speakTime(start)}`,
          body: notes,
          created_by: "voice_reception",
          metadata: { in_calendar: inCalendar, cal_error: calError, when: start.toISOString() },
        },
      }).catch((e) => console.error("[voice/public/book] contact", e));
    }

    await notify(d, start, inCalendar ? null : calError ?? (email ? "Cal.com отказа" : "няма имейл"));

    const when = `${speakDay(start)} в ${speakTime(start)}`;
    const moved = shifted ? `Най-близкото свободно е ${when} — записах теб там. ` : "";

    if (inCalendar) {
      return NextResponse.json({
        ok: true,
        id: booking.id,
        in_calendar: true,
        when: start.toISOString(),
        spoken: `${moved}Готово — ${when}. Потвърждението вече е на ${email}, там е и линкът за срещата.`,
      });
    }

    return NextResponse.json({
      ok: true,
      id: booking.id,
      in_calendar: false,
      when: start.toISOString(),
      spoken: email
        ? `${moved}Записах те за ${when}. Потвърждението ще ти дойде на ${email} до няколко минути.`
        : `${moved}Записах те за ${when}. Ивайло ще ти потвърди на телефона, който ми даде.`,
    });
  } catch (err) {
    console.error("[voice/public/book]", err);
    return NextResponse.json(
      { ok: false, spoken: "Нещо се обърка при записването. Ивайло ще ти се обади, за да го уговорите." },
      { status: 200 }
    );
  }
}

/**
 * Известието до Ивайло. Праща се и когато всичко е минало гладко —
 * среща, уговорена от машина с непознат човек, е точно нещото, за което
 * искаш да знаеш веднага, а не да я откриеш сутринта в календара.
 */
async function notify(
  d: z.infer<typeof schema>,
  when: Date,
  problem: string | null
): Promise<void> {
  const head = problem ? "⚠️ Гласовата рецепция записа час, но" : "📅 Гласовата рецепция записа час";
  const lines = [
    `${head}${problem ? ` — ${esc(problem)}` : ""}`,
    `<b>${esc(d.ime)}</b> · ${speakDay(when)} в ${speakTime(when)}`,
    d.telefon ? `☎️ ${esc(d.telefon)}` : null,
    d.imeil ? `✉️ ${esc(d.imeil)}` : "✉️ без имейл",
    d.deynost ? `🏢 ${esc(d.deynost)}` : null,
    d.tema ? `💬 ${esc(d.tema)}` : null,
  ].filter(Boolean);
  await sendTelegram(lines.join("\n")).catch(() => {});
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 40);
}
