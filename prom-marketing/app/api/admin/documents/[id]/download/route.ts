import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";
import { ADMIN_COOKIE, verifySession } from "@/lib/admin/session";
import { signedDocumentUrl } from "@/lib/crm/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * GET /api/admin/documents/<id>/download — праща към подписан линк за файла.
 * Бъкетът е частен, затова линкът се издава тук и живее 10 минути.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const store = await cookies();
  if (!verifySession(store.get(ADMIN_COOKIE)?.value ?? null)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const sb = createServiceClient();
  const { data } = await sb.from("documents").select("storage_path").eq("id", id).maybeSingle();
  if (!data) return NextResponse.json({ error: "document not found" }, { status: 404 });

  const { url, reason } = await signedDocumentUrl((data as { storage_path: string | null }).storage_path);
  if (!url) return NextResponse.json({ error: reason ?? "файлът не е достъпен" }, { status: 409 });

  return NextResponse.redirect(url);
}
