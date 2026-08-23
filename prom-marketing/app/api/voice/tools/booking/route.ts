import { NextResponse } from "next/server";
import { z } from "zod";
import { guardVoice } from "@/lib/voice/guard";
import { resolveContact } from "@/lib/voice/resolve";
import { parseWhen, speakDate } from "@/lib/voice/when";
import { upsertBooking, updateBooking } from "@/lib/crm/repository";
import { listBookings } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/tools/booking — среща, уговорена докато си говорите.
 *
 * „Уговорих се с Панчев за вторник в десет" трябва да влезе СЕГА, иначе до
 * вечерта е забравена. Затова часът се разбира от българската фраза, а не се
 * иска ISO от модела.
 *
 * Записва само в CRM-а: НЕ праща покана, НЕ прави Meet линк и НЕ пише на
 * човека отсреща. Причина: поканата е необратима — тръгне ли, не се връща,
 * а гласът може да е чул „вторник" вместо „четвъртък".
 */

const schema = z.object({
  caller_id: z.string().optional(),
  pin: z.string().optional(),
  action: z.enum(["create", "move", "cancel"]).default("create"),
  /** С кого — име, фирма или телефон. */
  who: z.string().trim().min(2).max(120),
  /** Кога: „вторник в десет", „утре следобед", „2026-09-01T15:00". */
  when: z.string().trim().max(80).optional(),
  duration_minutes: z.coerce.number().int().min(5).max(600).optional(),
  note: z.string().trim().max(2000).optional(),
  meeting_url: z.string().trim().max(500).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const guard = guardVoice(request, body);
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, spoken: "Кажи с кого е срещата и кога." },
      { status: 200 }
    );
  }
  const d = parsed.data;

  try {
    if (d.action === "create") return await create(d);
    return await moveOrCancel(d);
  } catch (err) {
    console.error("[voice/booking]", err);
    return NextResponse.json({ ok: false, spoken: "Нещо се обърка. Срещата не е записана." }, { status: 200 });
  }
}

type Input = z.infer<typeof schema>;

async function create(d: Input) {
  if (!d.when) {
    return NextResponse.json({ ok: false, spoken: "Кога е срещата?" }, { status: 200 });
  }
  const when = parseWhen(d.when, { defaultHour: 10 });
  if (!when) {
    return NextResponse.json(
      { ok: false, spoken: "Не разбрах кога. Кажи ми деня и часа — например „вторник в десет“." },
      { status: 200 }
    );
  }

  // Среща в миналото почти винаги значи чута накриво дата. По-добре питай.
  if (when.date.getTime() < Date.now() - 60 * 60 * 1000) {
    return NextResponse.json(
      { ok: false, spoken: `Това излиза ${speakDate(when.date)} — вече е минало. Кажи ми датата пак.` },
      { status: 200 }
    );
  }

  // Контактът може и да го няма — среща с нов човек е нормална.
  const who = await resolveContact({ q: d.who });
  const name = who.ok ? who.name : d.who;
  const email = who.ok && who.email ? who.email : NO_EMAIL;

  const result = await upsertBooking({
    // Ключът е по ИМЕ и час, не по имейл: половината уговорени по телефона
    // хора нямат имейл в базата и всички биха се слели в един запис.
    cal_booking_id: `manual:${when.date.toISOString().slice(0, 16)}:${slug(name)}`,
    attendee_name: name,
    attendee_email: email,
    attendee_phone: who.ok ? (who.phone ?? undefined) : undefined,
    scheduled_at: when.date.toISOString(),
    duration_minutes: d.duration_minutes ?? 60,
    status: "accepted",
    business: who.ok ? (who.company ?? undefined) : undefined,
    meeting_url: d.meeting_url,
    notes: d.note,
  });

  if (result.error) {
    console.error("[voice/booking] create", result.error);
    return NextResponse.json({ ok: false, spoken: "Не успях да запиша срещата." }, { status: 200 });
  }

  const extra = who.ok ? "" : " Него го няма в CRM-а, записах я само по име.";
  return NextResponse.json({
    ok: true,
    id: result.id,
    created: result.created,
    spoken: `${result.created ? "Записах" : "Обнових"} срещата с ${name} за ${speakDate(when.date)}.${extra} Покана не съм пращал.`,
  });
}

async function moveOrCancel(d: Input) {
  const { items } = await listBookings({ when: "upcoming", q: d.who, limit: 5, offset: 0 });
  const live = items.filter((b) => String(b.status) !== "cancelled");

  if (live.length === 0) {
    return NextResponse.json({ ok: false, spoken: `Нямаш предстояща среща с ${d.who}.` }, { status: 200 });
  }
  if (live.length > 1) {
    const list = live
      .map((b) => `${b.attendee_name} на ${speakDate(new Date(String(b.scheduled_at)))}`)
      .join(", ");
    return NextResponse.json({ ok: false, spoken: `Имаш няколко: ${list}. Коя от тях?` }, { status: 200 });
  }

  const booking = live[0];
  const id = String(booking.id);
  const attendee = String(booking.attendee_name);

  if (d.action === "cancel") {
    const res = await updateBooking({ id, status: "cancelled", notes: d.note });
    if (res.error) {
      console.error("[voice/booking] cancel", res.error);
      return NextResponse.json({ ok: false, spoken: "Не успях да отменя срещата." }, { status: 200 });
    }
    return NextResponse.json({
      ok: true,
      id,
      spoken: `Отмених срещата с ${attendee}. Не съм му писал — ако трябва да го уведомя, кажи ми.`,
    });
  }

  if (!d.when) {
    return NextResponse.json({ ok: false, spoken: "За кога да я преместя?" }, { status: 200 });
  }
  const when = parseWhen(d.when, { defaultHour: 10 });
  if (!when) {
    return NextResponse.json({ ok: false, spoken: "Не разбрах за кога. Кажи деня и часа." }, { status: 200 });
  }

  const res = await updateBooking({
    id,
    scheduled_at: when.date.toISOString(),
    duration_minutes: d.duration_minutes,
    notes: d.note,
  });
  if (res.error) {
    console.error("[voice/booking] move", res.error);
    return NextResponse.json({ ok: false, spoken: "Не успях да преместя срещата." }, { status: 200 });
  }
  return NextResponse.json({
    ok: true,
    id,
    spoken: `Преместих срещата с ${attendee} за ${speakDate(when.date)}. Не съм го уведомил.`,
  });
}

/**
 * Плейсхолдър, когато човекът няма имейл в базата. Колоната е NOT NULL, а
 * домейнът е нашият собствен — така никое бъдещо изпращане не тръгва към
 * чужд адрес по погрешка. Същият подход като в Cal.com webhook-а.
 */
const NO_EMAIL = "bez-imeil@promarketing.pw";

function slug(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^\p{L}\p{N}-]/gu, "").slice(0, 40);
}
