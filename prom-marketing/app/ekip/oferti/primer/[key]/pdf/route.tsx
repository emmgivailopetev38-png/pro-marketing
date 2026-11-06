import { NextResponse } from "next/server";
import { getTeamActor } from "@/lib/team/session";
import { allowed } from "@/lib/team/nav";
import { renderOfferPdf } from "@/lib/oferti/pdf";
import { sampleView } from "@/lib/oferti/primer";
import { getTemplate } from "@/lib/oferti/repository";
import { SELLERS } from "@/lib/oferti/katalog";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /ekip/oferti/primer/<key>/pdf — примерният PDF за хората от екипа. */
export async function GET(_request: Request, ctx: { params: Promise<{ key: string }> }) {
  const actor = await getTeamActor();
  if (!actor || !allowed(actor, "oferti")) return new NextResponse("Forbidden", { status: 403 });
  const { key } = await ctx.params;
  const t = await getTemplate(key);
  if (!t) return new NextResponse("Not found", { status: 404 });
  const seller = actor.kind === "member" && actor.member.id === SELLERS.georgi.team_member_id ? "georgi" : "ivailo";
  const pdf = await renderOfferPdf(sampleView(t, seller));
  return new NextResponse(new Uint8Array(pdf), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="ProMarketing-Primer-${t.key}.pdf"`, "Cache-Control": "no-store" },
  });
}
