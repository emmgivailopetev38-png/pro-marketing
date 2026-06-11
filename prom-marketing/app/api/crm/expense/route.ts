import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { expenseInputSchema, EXPENSE_CATEGORIES, EXPENSE_STATUSES } from "@/lib/crm/types";
import { upsertExpense } from "@/lib/crm/repository";
import { clampLimit, parseOffset, parseCsv, parseBoolParam, listExpenses } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/expense — списък/търсене за Hermes.
 * ?category=ads,hosting&status=paid&is_personal=true|false&q=…&from=…&to=…&limit=…&offset=…
 * Датите са по expense_date (fallback created_at); from включващо, to изключващо.
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const p = new URL(request.url).searchParams;
  const category = parseCsv(p.get("category"), EXPENSE_CATEGORIES);
  if (category?.length === 0) {
    return NextResponse.json({ error: "Invalid category filter" }, { status: 400 });
  }
  const status = parseCsv(p.get("status"), EXPENSE_STATUSES);
  if (status?.length === 0) {
    return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
  }
  const limit = clampLimit(p.get("limit"));
  const offset = parseOffset(p.get("offset"));
  const r = await listExpenses({
    category: category ?? undefined,
    status: status ?? undefined,
    is_personal: parseBoolParam(p.get("is_personal")),
    q: p.get("q") ?? undefined,
    from: p.get("from") ?? undefined,
    to: p.get("to") ?? undefined,
    limit,
    offset,
  });
  if (r.error) {
    return NextResponse.json({ ok: false, error: r.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, total: r.total, count: r.items.length, limit, offset, items: r.items });
}

/** POST /api/crm/expense — idempotent supplier expense (Hermes / accountant). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const raw = await request.json().catch(() => null);
  const parsed = expenseInputSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  const result = await upsertExpense(parsed.data);
  if (result.error) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true, id: result.id, created: result.created });
}
