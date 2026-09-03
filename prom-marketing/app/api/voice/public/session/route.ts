import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { checkVoiceBudget, isPublicVoiceEnabled, VOICE_WEB_ACTIVITY } from "@/lib/voice/public-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/public/session — отваря разговор с рецепцията от сайта.
 *
 * Реда на нещата тук е нарочен: първо се пише лийдът, чак после се отваря
 * линията. Ако човекът затвори след трийсет секунди, ние вече имаме името,
 * телефона и повода — а гласовият разговор, който никой не е чул докрай, е
 * най-скъпият начин да загубиш контакт.
 *
 * Формата е и предпазителят пред 275-те минути: без нея всеки минувач по
 * страницата отваря линия. С нея — човек, който си е написал телефона.
 *
 * Данните се подават на агента като динамични променливи, за да НЕ се
 * диктува имейл на глас. Продиктуваният имейл е най-честата счупена среща:
 * „ай ви ей ел о" става „ivailo", „ivaylo" или „и вайло" през ден.
 */

const DEFAULT_AGENT_ID = "agent_4401m0fym8eqfeebgfqx4jnwqreg";

const schema = z.object({
  name: z.string().trim().min(2, "име").max(120),
  email: z.string().trim().email("имейл").max(160),
  phone: z.string().trim().min(6, "телефон").max(40),
  /** С какво се занимава — агентът стъпва на това в първия си въпрос. */
  business: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  if (!isPublicVoiceEnabled()) {
    return NextResponse.json({ error: "disabled", spoken: "Гласовото демо е спряно в момента." }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", detail: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const budget = await checkVoiceBudget();
  if (!budget.ok) {
    return NextResponse.json({ error: "budget", spoken: budget.spoken }, { status: 429 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_PUBLIC_AGENT_ID ?? DEFAULT_AGENT_ID;
  if (!apiKey) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  // Лийдът влиза пръв — виж коментара най-горе.
  const lead = await upsertContactAndLog({
    full_name: d.name,
    email: d.email,
    phone: d.phone,
    company: d.business || null,
    source: "voice_web",
    initial_stage: "lead",
    activity: {
      type: VOICE_WEB_ACTIVITY,
      title: "Отвори гласовия агент от сайта",
      body: d.business ? `Дейност: ${d.business}` : null,
      created_by: "website",
      metadata: { name: d.name, email: d.email, phone: d.phone, business: d.business ?? null },
    },
  });
  if (lead.error) {
    // Разговорът пак върви — CRM-ът не бива да е причина да откажем клиент.
    console.error("[voice/public/session] lead", lead.error);
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store" }
    );
    if (!res.ok) {
      // Тялото на грешката може да носи ключа — не се връща към браузъра.
      console.error("[voice/public/session] ElevenLabs", res.status);
      return NextResponse.json({ error: "upstream" }, { status: 502 });
    }
    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) return NextResponse.json({ error: "no_signed_url" }, { status: 502 });

    return NextResponse.json({
      ok: true,
      signed_url: data.signed_url,
      // Имената съвпадат с плейсхолдърите в промпта на агента. Смениш ли ги
      // тук, агентът започва да казва „{{ime}}" на глас.
      variables: {
        ime: d.name,
        imeil: d.email,
        telefon: d.phone,
        deynost: d.business ?? "",
        kanal: "sait",
      },
    });
  } catch (err) {
    console.error("[voice/public/session]", err);
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}
