import { NextResponse } from "next/server";
import { z } from "zod";
import { checkVoiceAuth } from "@/lib/voice/auth";
import { recordActivity } from "@/lib/crm/repository";
import { CONTACT_STAGES } from "@/lib/contacts/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/tools/note
 *
 * Записва какво е говорено — типично след среща, надиктувано от колата.
 * Поправимо е, затова гласът го прави направо, без одобрение.
 *
 * Отделно от /api/crm/activity по същата причина като contact: онзи иска
 * Хермесовия ключ. Тук се ползва гласовият.
 */

const schema = z
  .object({
    contact_id: z.string().uuid().optional(),
    phone: z.string().trim().min(3).max(40).optional(),
    full_name: z.string().trim().max(120).optional(),
    /** Самата бележка — това, което Ивайло е надиктувал. */
    note: z.string().trim().min(2).max(4000),
    stage: z.enum(CONTACT_STAGES).optional(),
    /** Кога да го подсети пак. ISO дата, напр. 2026-08-26. */
    followup_date: z.string().trim().max(40).optional(),
  })
  .refine((v) => v.contact_id || v.phone, { message: "contact_id или phone" });

export async function POST(request: Request) {
  const auth = checkVoiceAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, spoken: "Не разбрах." }, { status: 200 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, spoken: "Трябва ми за кого е бележката — кажи име или телефон." },
      { status: 200 }
    );
  }

  const { contact_id, phone, full_name, note, stage, followup_date } = parsed.data;

  // Датата идва от гласово разпознаване — ако е нечетима, по-добре да няма
  // последваща стъпка, отколкото да се запише 1970 година.
  let nextFollowup: string | undefined;
  if (followup_date) {
    const d = new Date(followup_date);
    if (!Number.isNaN(d.getTime())) nextFollowup = d.toISOString();
  }

  try {
    const result = await recordActivity({
      contact_id,
      phone,
      full_name,
      activity_type: "note",
      title: "Бележка по телефона",
      body: note,
      stage,
      next_followup_at: nextFollowup,
      mark_heard: true,
      created_by: "voice",
    });

    if (result.error || !result.contact_id) {
      console.error("[voice/note]", result.error);
      return NextResponse.json(
        { ok: false, spoken: "Не успях да запиша бележката. Нищо не е загубено — кажи ми пак." },
        { status: 200 }
      );
    }

    const parts = ["Записах бележката"];
    if (stage) parts.push(`и преместих етапа`);
    if (nextFollowup) parts.push("и вдигнах следваща стъпка");
    else if (followup_date) parts.push("но не разбрах датата, така че не сложих напомняне");

    return NextResponse.json({
      ok: true,
      contact_id: result.contact_id,
      spoken: parts.join(" ") + ".",
    });
  } catch (err) {
    console.error("[voice/note]", err);
    return NextResponse.json({ ok: false, spoken: "Нещо се обърка. Бележката не е записана." }, { status: 200 });
  }
}
