import { NextResponse } from "next/server";
import { suvetnikAuthorized } from "@/lib/suvetnik/http";
import { listContacts } from "@/lib/crm/list-read";

export const dynamic = "force-dynamic";

/** GET /api/suvetnik/kontakti?q= — бързо търсене на картон в CRM-а за брифа и записа накрая. */
export async function GET(request: Request) {
  if (!(await suvetnikAuthorized())) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ items: [] });
  const r = await listContacts({ q, limit: 8, offset: 0 });
  if (r.error) return NextResponse.json({ error: r.error }, { status: 500 });
  const items = r.items.map((c) => ({
    id: String(c.id),
    ime: String(c.full_name ?? ""),
    firma: c.company ? String(c.company) : "",
    telefon: c.phone ? String(c.phone) : "",
    etap: c.stage ? String(c.stage) : "",
    belezhki: c.notes ? String(c.notes).slice(0, 600) : "",
  }));
  return NextResponse.json({ items });
}
