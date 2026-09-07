import { NextResponse } from "next/server";
import { z } from "zod";
import { checkPublicVoiceAuth } from "@/lib/voice/public-auth";
import { identityForSessionKey, normalizeEmail, phoneKey } from "@/lib/voice/quota";
import { createServiceClient } from "@/lib/supabase/service";
import { describePayStatus, payStatusFromOffer, type PayStatus } from "@/lib/voice/pay-status";

export const dynamic = "force-dynamic";

/**
 * POST /api/voice/public/pay-status — „мина ли плащането?"
 *
 * Агентът го вика, докато човекът плаща по време на разговора, и след това
 * продължава с въпросите за бизнеса. Чете само състоянието на ПОСЛЕДНАТА
 * оферта от гласовия агент към този човек (по имейл от тефтера или подаден),
 * нищо друго — нито суми на други хора, нито история.
 *
 * Плащането става „paid" от Stripe webhook-а (`checkout.session.completed`).
 * Без вързан webhook състоянието спира на „opened" — рутът е честен за това
 * и агентът просто продължава, без да твърди, че е видял плащане.
 */

const schema = z.object({
  imeil: z.string().trim().max(160).optional(),
  telefon: z.string().trim().max(40).optional(),
  obrashtenie: z.enum(["ti", "vie"]).optional(),
  sesia: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  const auth = checkPublicVoiceAuth(request);
  if (!auth.ok) {
    console.error("[voice/public/pay-status] отказан достъп:", auth.reason);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body ?? {});
  const d = parsed.success ? parsed.data : {};
  const ti = d.obrashtenie === "ti";

  let email = normalizeEmail(d.imeil);
  let phone = d.telefon ?? null;
  const bound = await identityForSessionKey(d.sesia);
  if (bound?.email) email = bound.email;
  if (bound?.phone) phone = bound.phone;

  if (!email && !phoneKey(phone)) {
    return NextResponse.json(
      { ok: true, status: "none" satisfies PayStatus, spoken: describePayStatus("none", ti) },
      { status: 200 }
    );
  }

  try {
    const sb = createServiceClient();
    let contactId: string | null = bound?.contactId ?? null;
    if (!contactId && email) {
      const { data } = await sb.from("contacts").select("id").eq("email", email).maybeSingle();
      contactId = (data?.id as string | undefined) ?? null;
    }
    if (!contactId && phone) {
      const pk = phoneKey(phone);
      const { data } = await sb.from("contacts").select("id, phone").ilike("phone", `%${pk}`).limit(5);
      const hit = (data ?? []).find((c) => phoneKey(c.phone as string | null) === pk);
      contactId = (hit?.id as string | undefined) ?? null;
    }
    if (!contactId) {
      return NextResponse.json({ ok: true, status: "none", spoken: describePayStatus("none", ti) }, { status: 200 });
    }

    const since = new Date(Date.now() - 14 * 24 * 3600_000).toISOString();
    const { data: offer } = await sb
      .from("offers")
      .select("status, title, created_at")
      .eq("contact_id", contactId)
      .eq("source", "voice_agent")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const status = payStatusFromOffer(offer?.status as string | undefined);
    return NextResponse.json(
      { ok: true, status, product: offer?.title ?? null, spoken: describePayStatus(status, ti) },
      { status: 200 }
    );
  } catch (err) {
    console.error("[voice/public/pay-status]", err);
    return NextResponse.json(
      {
        ok: false,
        status: "unknown",
        spoken: ti
          ? "В момента не мога да проверя плащането. Няма проблем — щом мине, Ивайло получава известие и ти пише."
          : "В момента не мога да проверя плащането. Няма проблем — щом мине, Ивайло получава известие и ви пише.",
      },
      { status: 200 }
    );
  }
}
