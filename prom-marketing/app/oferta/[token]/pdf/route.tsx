import { NextResponse } from "next/server";
import { getOfferByToken } from "@/lib/oferti/repository";
import { renderOfferPdf } from "@/lib/oferti/pdf";
import { isToken } from "@/lib/oferti/smetki";
import { viewModel } from "@/lib/oferti/view";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /oferta/<код>/pdf — PDF-ът на офертата, винаги от актуалните данни. */
export async function GET(_request: Request, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  if (!isToken(token)) return new NextResponse("Not found", { status: 404 });
  const offer = await getOfferByToken(token);
  if (!offer) return new NextResponse("Not found", { status: 404 });
  const v = viewModel(offer);
  const pdf = await renderOfferPdf(v);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${v.pdfFilename}"`,
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
