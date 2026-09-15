import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { loadReview } from "@/lib/pregled/repository";
import { buildSummary } from "@/lib/pregled/summary";
import { isValidKey } from "@/lib/pregled/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/pregled/<ключ> — за агента и за собственика (Bearer на Хермес).
 * Връща пакета, отговорите до момента и обобщението, без да чака „Изпрати“:
 * така се вижда и наполовина попълнен преглед.
 */
export async function GET(request: Request, { params }: { params: Promise<{ key: string }> }) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { key } = await params;
  if (!isValidKey(key)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const loaded = await loadReview(key);
  if (!loaded) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { review, answers } = loaded;
  return NextResponse.json({
    ok: true,
    review: {
      key: review.key,
      title: review.title,
      client_name: review.client_name,
      contact_id: review.contact_id,
      view_count: review.view_count,
      last_seen_at: review.last_seen_at,
      submit_count: review.submit_count,
      submitted_at: review.submitted_at,
      general_comment: review.general_comment,
      items: review.items.map((i) => ({ code: i.code, name: i.name })),
    },
    answers,
    summary: buildSummary(review.items, answers),
  });
}
