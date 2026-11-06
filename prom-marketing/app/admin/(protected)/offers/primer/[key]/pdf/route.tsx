import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";
import { renderOfferPdf } from "@/lib/oferti/pdf";
import { sampleView } from "@/lib/oferti/primer";
import { getTemplate } from "@/lib/oferti/repository";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /admin/offers/primer/<key>/pdf — примерният PDF на шаблон (с измислен клиент). */
export async function GET(_request: Request, ctx: { params: Promise<{ key: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { key } = await ctx.params;
  const t = await getTemplate(key);
  if (!t) return new NextResponse("Not found", { status: 404 });
  const pdf = await renderOfferPdf(sampleView(t, "ivailo"));
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="ProMarketing-Primer-${t.key}.pdf"`, "Cache-Control": "no-store" },
  });
}
