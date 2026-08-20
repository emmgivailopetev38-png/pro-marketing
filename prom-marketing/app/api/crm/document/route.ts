import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { documentInputSchema } from "@/lib/crm/types";
import { upsertDocument } from "@/lib/crm/repository";
import { createServiceClient } from "@/lib/supabase/service";
import { clampLimit, parseOffset } from "@/lib/crm/list-read";
import { isLocalPath, signedDocumentUrl } from "@/lib/crm/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const COLUMNS =
  "id, contact_id, invoice_id, payment_id, expense_id, doc_type, title, file_name, " +
  "storage_path, mime_type, size_bytes, match_status, match_confidence, source, " +
  "dedupe_key, notes, created_at";

/**
 * GET /api/crm/document — какво е качено и как се сваля.
 *   ?id=<uuid>            → един документ + подписан линк за сваляне (10 мин.)
 *   ?contact_id=<uuid>    → документите на един контакт
 *   ?unreachable=1        → само тези, чийто файл не е в хранилището
 *   ?limit= &offset=
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const sb = createServiceClient();

  const id = p.get("id");
  if (id) {
    const { data, error } = await sb.from("documents").select(COLUMNS).eq("id", id).maybeSingle();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ ok: false, error: "document not found" }, { status: 404 });
    const row = data as unknown as { storage_path: string | null };
    const { url, reason } = await signedDocumentUrl(row.storage_path);
    return NextResponse.json({ ok: true, item: data, download_url: url, unavailable_reason: reason });
  }

  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  let q = sb.from("documents").select(COLUMNS, { count: "exact" });
  const contactId = p.get("contact_id");
  if (contactId) q = q.eq("contact_id", contactId);
  const docType = p.get("doc_type");
  if (docType) q = q.eq("doc_type", docType);

  const { data, error, count } = await q
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  let items = (data ?? []) as unknown as Array<{ storage_path: string | null }>;
  if (p.get("unreachable") === "1") {
    items = items.filter((r) => !r.storage_path || isLocalPath(r.storage_path));
  }

  return NextResponse.json({
    ok: true,
    total: count ?? items.length,
    count: items.length,
    limit,
    offset,
    items: items.map((r) => ({ ...r, reachable: !!r.storage_path && !isLocalPath(r.storage_path) })),
  });
}

/**
 * POST /api/crm/document — регистрира документ (PDF/снимка/банково извлечение)
 * с извлечен от Hermes текст и полета, вързан към контакт/фактура/плащане/разход.
 * Подай съдържанието във `file_base64` — само тогава файлът влиза в хранилището
 * и може после да се свали. Несвързаните отиват в ръчна проверка.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = documentInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await upsertDocument(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({
    ok: true,
    id: result.id,
    created: result.created,
    contact_id: result.contact_id,
    stored: !!parsed.data.file_base64,
    ...(result.warning ? { warning: result.warning } : {}),
  });
}
