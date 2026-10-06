import { NextResponse } from "next/server";
import { contactFromTicket } from "@/lib/kino/token";
import { canPreview } from "@/lib/kino/viewer";
import { getLiveState } from "@/lib/kino/live";

export const dynamic = "force-dynamic";

/**
 * GET /api/kino/live?t=… — влязъл ли е Ивайло на живо (Режисьорската кабина).
 * Залата пита на ~25 s. Линкът се дава само на хора с билет (или на прегледа
 * на Ивайло) — не е публичен адрес за всеки, който знае пътя.
 */
export async function GET(request: Request) {
  const t = new URL(request.url).searchParams.get("t");
  const allowed = (t && contactFromTicket(t)) || (await canPreview());
  const headers = { "Cache-Control": "private, no-store" };
  if (!allowed) return NextResponse.json({ on: false }, { status: 401, headers });
  const st = await getLiveState();
  if (!st.on || !st.target) return NextResponse.json({ on: false }, { headers });
  return NextResponse.json(
    { on: true, url: st.target.url, kind: st.target.kind, youtubeId: st.target.youtubeId, label: st.target.label, since: st.since },
    { headers },
  );
}
