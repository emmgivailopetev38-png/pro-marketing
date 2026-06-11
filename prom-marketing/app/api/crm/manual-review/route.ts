import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { manualReviewInputSchema, MANUAL_REVIEW_STATUSES } from "@/lib/crm/types";
import { createManualReviewItem } from "@/lib/crm/repository";
import { resolveManualReviewItem } from "@/lib/crm/list-read";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const ACTIVE_STATUSES = ["open", "needs_user", "blocked"];

/**
 * GET /api/crm/manual-review?status=needs_user&limit=50&offset=0
 * Lists review items for Hermes' daily check. Defaults to active statuses
 * (open + needs_user + blocked). PII-conscious: returns titles but not the raw
 * description (only a has_description flag) so it is safe to log.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit")) || 50, 1), 200);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

  const statuses = statusParam
    ? statusParam
        .split(",")
        .map((s) => s.trim())
        .filter((s) => (MANUAL_REVIEW_STATUSES as readonly string[]).includes(s))
    : ACTIVE_STATUSES;
  if (statuses.length === 0) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }

  const sb = createServiceClient();
  const { data, error, count } = await sb
    .from("manual_review_items")
    .select(
      "id, type, title, description, severity, status, related_contact_id, related_invoice_id, related_payment_id, created_at, resolved_at",
      { count: "exact" }
    )
    .in("status", statuses)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const items = (data ?? []).map(({ description, ...rest }) => ({
    ...rest,
    has_description: !!description,
  }));
  return NextResponse.json({
    ok: true,
    statuses,
    limit,
    offset,
    total: count ?? null,
    count: items.length,
    items,
  });
}

/** POST /api/crm/manual-review — queue an item for Ivailo (idempotent). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = manualReviewInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }

  const result = await createManualReviewItem(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created });
}

const resolveSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["resolved", "ignored"]),
  note: z.string().trim().optional(),
});

/**
 * PATCH /api/crm/manual-review — Hermes затваря item след решение.
 * Body: { id, status: "resolved"|"ignored", note? } — note се добавя към
 * описанието като „Резолюция (дата): …" и остава видима в админа.
 */
export async function PATCH(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = resolveSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await resolveManualReviewItem(parsed.data);
  if (result.error === "item not found") {
    return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
  }
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: parsed.data.id, status: parsed.data.status });
}
