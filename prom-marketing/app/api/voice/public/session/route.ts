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

  const agentId = process.env.ELEVENLABS_PUBLIC_AGENT_ID ?? DEFAULT_AGENT_ID;

  // Лийдът влиза пръв — виж коментара най-горе. Но CRM-ът никога не е
  // причина да откажем клиент: и грешката, и хвърленото изключение само се
  // журналират. `createServiceClient()` хвърля при липсващи ключове.
  try {
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
    if (lead.error) console.error("[voice/public/session] lead", lead.error);
  } catch (err) {
    console.error("[voice/public/session] lead хвърли", err);
  }

  /**
   * Връща се ИДЕНТИФИКАТОРЪТ на агента, не подписан адрес — и това е
   * съзнателна размяна, направена на 03.09.2026.
   *
   * Подписаният адрес се вади с `ELEVENLABS_API_KEY`, а той връщаше 401:
   * ключът във Vercel е остарял и бутонът просто не отваряше разговор.
   * Агентът обаче е публичен (`enable_auth: false`) и вече носи собствената
   * си ограда — allowlist за promarketing.pw със задължителна заглавка
   * `Origin`. Тоест идентификаторът, видим в кода на страницата, е безполезен
   * от чужд домейн, а разговорът тръгва без нито един ключ по веригата.
   *
   * Ако някой ден authentication бъде включена от страната на ElevenLabs,
   * тук отново трябва подписан адрес — и жив API ключ.
   */
  return NextResponse.json({
    ok: true,
    agent_id: agentId,
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
}
