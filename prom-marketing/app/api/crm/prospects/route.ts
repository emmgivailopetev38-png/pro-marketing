import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { importProspectRows, prospectStats } from "@/lib/team/prospects";
import { cleanImportRow, type ImportRow } from "@/lib/team/prospects-rules";

export const dynamic = "force-dynamic";

/** Колко реда в една заявка — пакетът от 3 300 се праща на няколко пъти. */
const MAX_ROWS = 1000;

/** GET /api/crm/prospects — студените обаждания накратко: колко, по състояние, по градове. */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const stats = await prospectStats();
  if (!stats) return NextResponse.json({ ok: false, error: "prospects table missing" }, { status: 500 });
  return NextResponse.json({ ok: true, ...stats, byCity: stats.byCity.slice(0, 30) });
}

/**
 * POST /api/crm/prospects — вкарва пакет студени фирми (scripts/studeni-import.mjs).
 * { batch: "gotovi-2026-09-26", rows: [{ company, city, phone, email, website, sector,
 *   opener, offer, gaps, email_subject, email_draft, decision_maker, buying_signal,
 *   score, tier, priority }] }. Повторното пускане само допълва — не дублира и не
 * пипа състоянието или човека, при когото е фирмата.
 */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { batch?: unknown; rows?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ ok: false, error: "rows: непразен масив" }, { status: 400 });
  }
  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json({ ok: false, error: `Най-много ${MAX_ROWS} реда на заявка` }, { status: 400 });
  }
  const batch = String(body.batch ?? "");
  const rows: ImportRow[] = [];
  let skipped = 0;
  for (const raw of body.rows) {
    const row = raw && typeof raw === "object" ? cleanImportRow(raw as Record<string, unknown>, batch) : null;
    if (row) rows.push(row);
    else skipped += 1;
  }
  if (rows.length === 0) return NextResponse.json({ ok: false, error: "Нито един ред с фирма" }, { status: 400 });
  const r = await importProspectRows(rows);
  if (r.error) return NextResponse.json({ ok: false, error: r.error, inserted: r.inserted, merged: r.merged }, { status: 500 });
  return NextResponse.json({ ok: true, received: body.rows.length, inserted: r.inserted, merged: r.merged, skipped });
}
