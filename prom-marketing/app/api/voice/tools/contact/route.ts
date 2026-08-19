import { NextResponse } from "next/server";
import { checkVoiceAuth } from "@/lib/voice/auth";
import { listContacts } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/voice/tools/contact?q=иван
 *
 * Тънка обвивка над listContacts за гласа. Съществува отделно от /api/crm/contact,
 * защото онзи иска HERMES_API_TOKEN, а той е „Sensitive" във Vercel и не може да се
 * прочете, за да се сложи в ElevenLabs. Даването на Хермесовия ключ на трета страна
 * и без това би било грешка — гласът си има свой.
 *
 * Връща най-много 5 съвпадения: на глас повече не се помнят.
 */
export async function GET(request: Request) {
  const auth = checkVoiceAuth(request);
  if (!auth.ok) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ ok: false, spoken: "Кажи име, фирма или телефон." }, { status: 200 });
  }

  try {
    const { items, total } = await listContacts({ q, limit: 5, offset: 0 });
    if (items.length === 0) {
      return NextResponse.json({ ok: true, found: 0, spoken: `Няма никой на име ${q}.` });
    }

    const people = items.map((c) => ({
      id: String(c.id),
      name: (c.full_name as string) ?? "без име",
      company: (c.company as string) ?? null,
      phone: (c.phone as string) ?? null,
      stage: stageLabel(c.stage as string),
    }));

    const spoken =
      people.length === 1
        ? `${people[0].name}${people[0].company ? ` от ${people[0].company}` : ""}, етап ${people[0].stage}.`
        : `Намерих ${people.length}${total > people.length ? ` от ${total}` : ""}: ` +
          people.map((p) => `${p.name}${p.company ? ` от ${p.company}` : ""}`).join(", ") +
          ". За кого става дума?";

    return NextResponse.json({ ok: true, found: total, people, spoken });
  } catch (err) {
    console.error("[voice/contact]", err);
    return NextResponse.json({ ok: false, spoken: "Не мога да стигна до базата в момента." }, { status: 200 });
  }
}

// Етапите се четат на глас — „presentation_sent" не се произнася.
const STAGE_BG: Record<string, string> = {
  lead: "лийд",
  contacted: "потърсен",
  discovery: "разговор",
  presentation_sent: "пратена презентация",
  offer_sent: "пратена оферта",
  negotiating: "преговори",
  won: "спечелен",
  lost: "загубен",
};

function stageLabel(stage: string | null): string {
  if (!stage) return "непознат";
  return STAGE_BG[stage] ?? stage;
}
