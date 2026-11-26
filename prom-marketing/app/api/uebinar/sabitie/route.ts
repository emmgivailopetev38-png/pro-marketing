import { after, NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/meta/conversions-api";
import { UEBINAR_PIXEL_ID } from "@/lib/uebinar/domen";
import { clientIp, cookieValue, fbcFor, safeEventId } from "@/lib/uebinar/capi";
import { chistiParametri, ePozvoleno, fbclidOt, nashAdres } from "@/lib/uebinar/meta-sabitia";
import { AB_TEST, eVarianta } from "@/lib/uebinar/ab";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BOT_UA = /bot|crawl|spider|slurp|headless|lighthouse|facebookexternalhit|preview/i;

/**
 * POST /api/uebinar/sabitie — сървърното копие на събитие от лендинга на
 * уебинара (PageView, ViewContent, скрол, време, видео, кликове) към пиксела
 * на уебинара през Conversions API, със същия event_id като браузъра
 * (дедупликация). Публичен, без лични данни: IP, браузър, _fbp/_fbc и
 * анонимният идентификатор на посетителя (external_id).
 * Отговаря веднага (204); изпращането е след отговора.
 */
export async function POST(request: Request) {
  const ua = request.headers.get("user-agent") ?? "";
  const token = process.env.META_UEBINAR_CAPI_TOKEN || process.env.META_CAPI_TOKEN;
  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const ime = body.name;
  const eventId = safeEventId(typeof body.event_id === "string" ? body.event_id : null);
  if (!ePozvoleno(ime) || !eventId) return new NextResponse(null, { status: 400 });
  if (!token || !ua || BOT_UA.test(ua)) return new NextResponse(null, { status: 204 });

  const url = nashAdres(body.url);
  const cookie = request.headers.get("cookie");
  const vid = typeof body.vid === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(body.vid) ? body.vid : null;
  const params = chistiParametri(body.params);
  const ip = clientIp(request.headers.get("x-forwarded-for"), request.headers.get("x-real-ip"));

  // A/B тестът (lib/uebinar/ab.ts): посещението и отворената форма на всеки посетител — веднъж, по версия.
  const abSabitie =
    ime === "ViewContent" && params.content_name === "uebinar-lending" ? "vizita" : ime === "OtvoriFormata" ? "forma" : null;
  if (abSabitie && vid && eVarianta(params.varianta)) {
    const varianta = params.varianta;
    after(async () => {
      const { error } = await createServiceClient()
        .from("uebinar_ab")
        .upsert({ test: AB_TEST, varianta, vid, sabitie: abSabitie }, { onConflict: "test,vid,sabitie", ignoreDuplicates: true });
      if (error) console.error("[uebinar/sabitie] ab", error.message);
    });
  }

  after(async () => {
    const r = await sendCapiEvent(
      {
        event_name: ime,
        event_id: eventId,
        event_source_url: url ?? undefined,
        action_source: "website",
        user_data: {
          country: "bg",
          external_id: vid,
          client_ip: ip,
          client_user_agent: ua,
          fbp: cookieValue(cookie, "_fbp"),
          fbc: fbcFor(cookie, fbclidOt(url)),
        },
        custom_data: Object.keys(params).length ? params : undefined,
      },
      { pixelId: UEBINAR_PIXEL_ID, token },
    );
    if (!r.ok) console.error("[uebinar/sabitie] capi", ime, r.error);
  });
  return new NextResponse(null, { status: 204 });
}
