import { NextResponse } from "next/server";
import { kinoTimeline } from "@/lib/kino/time";
import { contactFromTicket } from "@/lib/kino/token";

export const dynamic = "force-dynamic";

/**
 * GET /k/<билет> — късият личен линк от SMS-ите и писмата.
 * В деня на премиерата (от 6 часа преди нея) води в залата; дотогава — в
 * билета (календар, Кино клуб, трейлъри). Счупен линк → афишът.
 */
export async function GET(request: Request, { params }: { params: Promise<{ t: string }> }) {
  const { t } = await params;
  const url = new URL(request.url);
  const origin = url.origin;
  if (!contactFromTicket(t)) return NextResponse.redirect(`${origin}/kino`, 307);
  const tl = kinoTimeline();
  const target = Date.now() >= tl.premiereMs - 6 * 3600_000 ? "zala" : "bilet";
  const out = new URL(`/kino/${target}`, origin);
  out.searchParams.set("t", t);
  for (const k of ["utm_source", "utm_medium", "utm_campaign"]) {
    const v = url.searchParams.get(k);
    if (v) out.searchParams.set(k, v);
  }
  return NextResponse.redirect(out, 307);
}
