import "server-only";

import { createServiceClient } from "@/lib/supabase/service";
import type { PostCallEvent } from "@/lib/voice/postcall";

/** Записът се чака преди HTTP 200, за да може ElevenLabs да повтори при грешка. */
export async function closeTreningSession(event: PostCallEvent, payload: unknown) {
  const sesia = event.dynamic.sesia;
  if (!sesia || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sesia)) {
    return { ok: false as const, status: 400, error: "Липсва валидна тренировъчна сесия." };
  }

  const root = payload as { data?: { transcript?: unknown; analysis?: unknown } };
  const transcript = Array.isArray(root.data?.transcript) ? root.data.transcript : event.transcript;
  const analysis = root.data?.analysis ?? null;
  const sb = createServiceClient();
  const { data, error } = await sb
    .from("trening_sesii")
    .update({
      transcript,
      analiz: analysis,
      prodalzhitelnost_sek: Math.max(0, Math.round(event.durationSecs)),
      conversation_id: event.conversationId,
      zavarshena: true,
    })
    .eq("id", sesia)
    .in("rejim", ["uchi", "izpit", "rolya"])
    .select("id")
    .maybeSingle();

  if (error) throw new Error("Неуспешен запис на тренировъчния разговор.", { cause: error });
  if (!data) return { ok: false as const, status: 404, error: "Тренировъчната сесия не е намерена." };
  return { ok: true as const };
}
