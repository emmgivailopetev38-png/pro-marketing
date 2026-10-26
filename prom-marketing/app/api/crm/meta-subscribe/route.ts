import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { pageTokenFor } from "@/lib/meta/partner-pages";

export const dynamic = "force-dynamic";

const GRAPH = "https://graph.facebook.com/v22.0";
const PAGE_ID_RE = /^\d{5,25}$/;

/**
 * Абониране на Facebook страница за leadgen събитията на нашето приложение.
 *
 *   POST /api/crm/meta-subscribe   { "page_id": "106532484251875" }
 *     → POST graph/{page_id}/subscribed_apps?subscribed_fields=leadgen (с page токена на ТАЗИ страница)
 *   GET  /api/crm/meta-subscribe?page_id=106532484251875
 *     → GET graph/{page_id}/subscribed_apps — проверка кое приложение и за какво е абонирано
 *
 * Отговорът на Graph се връща дословно (`graph`), включително грешката — напр.
 * когато страницата не е достъпна за системния потребител, защото не е споделена
 * с бизнеса на ProMarketing. Page токенът идва от lib/meta/partner-pages.ts
 * (GET /{page_id}?fields=access_token със системния токен), както за нашата страница.
 */
function pageIdFrom(v: unknown): string | null {
  const id = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  return PAGE_ID_RE.test(id) ? id : null;
}

async function graphJson(res: Response): Promise<unknown> {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return { raw: text.slice(0, 1000) };
  }
}

export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { page_id?: unknown };
  try {
    body = (await request.json()) as { page_id?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const pageId = pageIdFrom(body?.page_id);
  if (!pageId) return NextResponse.json({ ok: false, error: "page_id (цифри) е задължително" }, { status: 400 });

  const tok = await pageTokenFor(pageId);
  if (!tok.ok) {
    return NextResponse.json({ ok: false, page_id: pageId, step: "page_token", error: tok.error }, { status: 502 });
  }
  try {
    const res = await fetch(`${GRAPH}/${pageId}/subscribed_apps`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ subscribed_fields: "leadgen", access_token: tok.token }),
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    const graph = await graphJson(res);
    return NextResponse.json({ ok: res.ok, page_id: pageId, status: res.status, graph }, { status: res.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, page_id: pageId, step: "subscribed_apps", error: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}

export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const pageId = pageIdFrom(new URL(request.url).searchParams.get("page_id"));
  if (!pageId) return NextResponse.json({ ok: false, error: "?page_id= (цифри) е задължително" }, { status: 400 });

  const tok = await pageTokenFor(pageId);
  if (!tok.ok) {
    return NextResponse.json({ ok: false, page_id: pageId, step: "page_token", error: tok.error }, { status: 502 });
  }
  try {
    const res = await fetch(
      `${GRAPH}/${pageId}/subscribed_apps?fields=id,name,subscribed_fields&access_token=${encodeURIComponent(tok.token)}`,
      { cache: "no-store", signal: AbortSignal.timeout(15000) }
    );
    const graph = await graphJson(res);
    return NextResponse.json({ ok: res.ok, page_id: pageId, status: res.status, graph }, { status: res.ok ? 200 : 502 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, page_id: pageId, step: "subscribed_apps", error: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
