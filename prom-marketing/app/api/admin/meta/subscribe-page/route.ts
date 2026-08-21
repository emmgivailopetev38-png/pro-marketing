import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/meta/subscribe-page
 *
 * Абонирането за `leadgen` в настройките на app-а е САМО ПОЛОВИНАТА.
 * То казва „този app иска leadgen събития". Втората половина е самата
 * СТРАНИЦА да е абонирана за app-а — иначе Meta няма причина да праща
 * лийдовете от нея насам и webhook-ът мълчи, без никаква грешка никъде.
 * Точно това счупи първия тестов лийд на 21.08.2026.
 *
 *   ?action=subscribe  — абонира страницата за полето leadgen
 *   без параметър      — само показва текущото състояние
 *
 * Ползва META_PAGE_ACCESS_TOKEN от средата, така че токенът не минава
 * през ничии ръце. Заключено зад админската бисквитка.
 */

const PAGE_ID = process.env.META_PAGE_ID || "106080979260944"; // Pro Marketing LTD
const GRAPH = "https://graph.facebook.com/v22.0";

export async function GET(request: Request) {
  const jar = await cookies();
  if (!verifySession(jar.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "META_PAGE_ACCESS_TOKEN липсва във Vercel" },
      { status: 500 }
    );
  }

  const action = new URL(request.url).searchParams.get("action");

  try {
    if (action === "subscribe") {
      const res = await fetch(
        `${GRAPH}/${PAGE_ID}/subscribed_apps?subscribed_fields=leadgen&access_token=${encodeURIComponent(token)}`,
        { method: "POST" }
      );
      const body = await res.json();
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, step: "subscribe", status: res.status, graph: body },
          { status: 502 }
        );
      }
      // Веднага чета обратно, за да не разчитам на „success: true".
      const check = await fetch(
        `${GRAPH}/${PAGE_ID}/subscribed_apps?access_token=${encodeURIComponent(token)}`
      );
      const state = await check.json();
      return NextResponse.json({
        ok: true,
        subscribed: body,
        potvurdeno: state?.data ?? state,
        page_id: PAGE_ID,
      });
    }

    const res = await fetch(
      `${GRAPH}/${PAGE_ID}/subscribed_apps?access_token=${encodeURIComponent(token)}`
    );
    const body = await res.json();
    const apps = Array.isArray(body?.data) ? body.data : [];
    const leadgen = apps.some((a: { subscribed_fields?: string[] }) =>
      (a.subscribed_fields ?? []).includes("leadgen")
    );
    return NextResponse.json({
      ok: res.ok,
      page_id: PAGE_ID,
      stranicata_e_abonirana_za_leadgen: leadgen,
      apps,
      graph_status: res.status,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "unknown" },
      { status: 500 }
    );
  }
}
