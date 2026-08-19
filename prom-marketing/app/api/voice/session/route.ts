import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/voice/session — подписан достъп до гласовия агент.
 *
 * Пази се с АДМИН БИСКВИТКАТА, не с Bearer токен: това се вика от браузъра
 * на Ивайло, след като вече е влязъл в /admin. Така гласовата сесия е вързана
 * към автентикирана админ сесия — по-силно от кой да е caller ID, който се
 * подправя.
 *
 * Агентът в ElevenLabs остава ЧАСТЕН. Публичен агент значи, че всеки с линка
 * може да говори с CRM-а — затова минаваме през подписан адрес, който живее
 * само няколко минути и се издава единствено на влязъл админ.
 */
export async function GET() {
  const cookieStore = await cookies();
  if (!verifySession(cookieStore.get(ADMIN_COOKIE)?.value ?? null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;
  const agentId = process.env.ELEVENLABS_AGENT_ID;
  if (!apiKey || !agentId) {
    return NextResponse.json(
      { error: "not_configured", detail: "Липсват ELEVENLABS_API_KEY или ELEVENLABS_AGENT_ID." },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      { headers: { "xi-api-key": apiKey }, cache: "no-store" }
    );

    if (!res.ok) {
      // Тялото на грешката може да съдържа ключа — НЕ се връща към браузъра.
      console.error("[voice/session] ElevenLabs", res.status);
      return NextResponse.json({ error: "upstream", status: res.status }, { status: 502 });
    }

    const data = (await res.json()) as { signed_url?: string };
    if (!data.signed_url) {
      return NextResponse.json({ error: "no_signed_url" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, signed_url: data.signed_url });
  } catch (err) {
    console.error("[voice/session]", err);
    return NextResponse.json({ error: "unreachable" }, { status: 502 });
  }
}
