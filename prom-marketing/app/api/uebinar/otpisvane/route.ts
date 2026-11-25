import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { OTPISVANE_TYPE, proveriOtpisvane } from "@/lib/uebinar/otpisvane";
import { NA_ZHIVO } from "@/lib/uebinar/na-zhivo";

export const dynamic = "force-dynamic";

/**
 * GET/POST /api/uebinar/otpisvane?k=<id>.<подпис> — отписва човека от писмата
 * за уебинара (линкът в долната част на всяко писмо + List-Unsubscribe с един
 * клик). Не трие нищо: записва действие в картона и писмата спират.
 */
async function otpishi(request: Request): Promise<{ ok: boolean }> {
  const id = proveriOtpisvane(new URL(request.url).searchParams.get("k"));
  if (!id) return { ok: false };
  const sb = createServiceClient();
  const { data: veche } = await sb
    .from("contact_activities")
    .select("id")
    .eq("contact_id", id)
    .eq("activity_type", OTPISVANE_TYPE)
    .limit(1)
    .maybeSingle();
  if (!veche) {
    await sb.from("contact_activities").insert({
      contact_id: id,
      activity_type: OTPISVANE_TYPE,
      title: `Отписа се от писмата за обучението „${NA_ZHIVO.name}“`,
      created_by: "website",
      metadata: { uebinar: NA_ZHIVO.slug },
    });
  }
  return { ok: true };
}

function page(ok: boolean): NextResponse {
  const msg = ok
    ? "Готово. Няма да получаваш повече писма за обучението."
    : "Линкът не е валиден. Пиши ни на ivailo@promarketing.pw и ще те отпишем.";
  return new NextResponse(
    `<!doctype html><html lang="bg"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Отписване</title></head><body style="font-family:Arial,sans-serif;max-width:520px;margin:60px auto;padding:0 20px;color:#1c1917;line-height:1.6"><p>${msg}</p></body></html>`,
    { status: ok ? 200 : 400, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

export async function GET(request: Request) {
  return page((await otpishi(request)).ok);
}

export async function POST(request: Request) {
  const r = await otpishi(request);
  return NextResponse.json(r, { status: r.ok ? 200 : 400 });
}
