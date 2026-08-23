import { NextResponse } from "next/server";
import { z } from "zod";
import { guardVoice } from "@/lib/voice/guard";
import { resolveContact } from "@/lib/voice/resolve";
import { parseWhen, speakDate } from "@/lib/voice/when";
import { updateContact, recordActivity } from "@/lib/crm/repository";
import { CONTACT_STAGES, STAGE_LABEL } from "@/lib/contacts/types";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/tools/update — КОРЕКЦИЯ на картон, казана на глас.
 *
 * Това е разликата между „агент, който чете CRM-а" и „агент, който го води":
 * „Панчев мина в преговори, сделката е за две и петстотин, да го потърся в петък"
 * се записва, докато човекът още кара към следващата среща.
 *
 * Всичко тук е ПОПРАВИМО и затова се изпълнява веднага, без одобрение —
 * `updateContact` пише в лентата на контакта какво от какво на какво е станало,
 * тоест грешка, чута накриво, се вижда и се връща. Необратимото (пари навън,
 * писмо до клиент, триене) минава през /api/voice/tools/request-approval.
 */

const schema = z
  .object({
    caller_id: z.string().optional(),
    pin: z.string().optional(),
    contact_id: z.string().uuid().optional(),
    /** Име, фирма или телефон — както е казано на глас. */
    q: z.string().trim().min(2).max(120).optional(),

    stage: z.enum(CONTACT_STAGES).optional(),
    deal_value_eur: z.coerce.number().min(0).max(10_000_000).optional(),
    phone: z.string().trim().min(3).max(40).optional(),
    email: z.string().trim().email().max(160).optional(),
    company: z.string().trim().min(1).max(160).optional(),
    full_name: z.string().trim().min(2).max(120).optional(),
    /** Кога да го потърси пак: ISO или българска фраза („другата седмица"). */
    followup: z.string().trim().max(80).optional(),
    /** Защо е корекцията — влиза като бележка в картона. */
    note: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.contact_id || v.q, { message: "contact_id или q" });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const guard = guardVoice(request, body);
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, spoken: "Не разбрах кого да коригирам и какво. Кажи име и какво да променя." },
      { status: 200 }
    );
  }
  const d = parsed.data;

  const who = await resolveContact({ contact_id: d.contact_id, q: d.q });
  if (!who.ok) {
    return NextResponse.json({ ok: false, spoken: who.spoken, candidates: who.candidates }, { status: 200 });
  }

  // Датата се превежда ТУК, а не се дава сурова на базата: „другата седмица"
  // през new Date() е Invalid Date и напомнянето тихо изчезва.
  let followupAt: string | undefined;
  let followupSpoken: string | null = null;
  let followupFailed = false;
  if (d.followup) {
    const when = parseWhen(d.followup, { defaultHour: 9 });
    if (when) {
      followupAt = when.date.toISOString();
      followupSpoken = speakDate(when.date, when.hasTime);
    } else {
      followupFailed = true;
    }
  }

  const patch = {
    id: who.id,
    stage: d.stage,
    deal_value_eur: d.deal_value_eur,
    phone: d.phone,
    email: d.email,
    company: d.company,
    full_name: d.full_name,
    next_followup_at: followupAt,
  };
  const hasChange = Object.entries(patch).some(([k, v]) => k !== "id" && v !== undefined);
  if (!hasChange && !d.note) {
    // Ако единственото поискано беше напомняне и датата не се разчете, кажи
    // ТОЧНО това. „Не разбрах какво да променя" звучи като чут проблем другаде
    // и човекът повтаря цялото изречение вместо само датата.
    const spoken = followupFailed
      ? `Разбрах, че е за ${who.name}, но не хванах датата. Кажи ми я пак — например „другата седмица във вторник“.`
      : `Намерих ${who.name}, но не разбрах какво да променя.`;
    return NextResponse.json({ ok: false, spoken }, { status: 200 });
  }

  try {
    if (hasChange) {
      const res = await updateContact(patch);
      if (res.error) {
        console.error("[voice/update]", res.error);
        return NextResponse.json(
          { ok: false, spoken: "Не успях да запиша корекцията. Нищо не е променено." },
          { status: 200 }
        );
      }
    }

    if (d.note) {
      await recordActivity({
        contact_id: who.id,
        activity_type: "note",
        title: "Бележка по телефона",
        body: d.note,
        created_by: "voice",
        mark_heard: true,
      });
    }

    const said: string[] = [];
    if (d.stage) said.push(`преместих го в „${STAGE_LABEL[d.stage]}“`);
    if (d.deal_value_eur !== undefined) said.push(`сделката е ${formatEur(d.deal_value_eur)}`);
    if (d.phone) said.push("смених телефона");
    if (d.email) said.push("смених имейла");
    if (d.company) said.push(`фирмата е ${d.company}`);
    if (d.full_name) said.push(`името е ${d.full_name}`);
    if (followupSpoken) said.push(`ще ти напомня ${followupSpoken}`);
    if (d.note) said.push("записах и бележката");

    const spoken =
      `${who.name}: ` +
      (said.length ? said.join(", ") : "нищо за променяне") +
      "." +
      (followupFailed ? " Датата за напомняне не я разбрах — кажи я пак." : "");

    return NextResponse.json({ ok: true, contact_id: who.id, name: who.name, spoken });
  } catch (err) {
    console.error("[voice/update]", err);
    return NextResponse.json({ ok: false, spoken: "Нещо се обърка. Не съм променил нищо." }, { status: 200 });
  }
}

/** Сумата се чете на глас — „2500" става „две хиляди и петстотин евро". */
function formatEur(n: number): string {
  return new Intl.NumberFormat("bg-BG", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
