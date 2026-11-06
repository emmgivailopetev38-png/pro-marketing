import { NextResponse } from "next/server";
import { checkHermesAuth } from "@/lib/crm/auth";
import { getTemplate, listTemplates, resetTemplate, saveTemplate } from "@/lib/oferti/repository";
import { templateSchema as saveSchema } from "@/lib/oferti/schema";

export const dynamic = "force-dynamic";

/** GET /api/crm/offer/template[?key=…] — примерните оферти (с пълните текстове). */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const key = new URL(request.url).searchParams.get("key");
  if (key) {
    const t = await getTemplate(key);
    if (!t) return NextResponse.json({ ok: false, error: "няма такъв шаблон" }, { status: 404 });
    return NextResponse.json({ ok: true, template: t });
  }
  const all = await listTemplates(true);
  return NextResponse.json({ ok: true, count: all.length, templates: all });
}

/** POST /api/crm/offer/template — нов/променен шаблон (или reset към каталога). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const raw = await request.json().catch(() => null);
  const parsed = saveSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  const actor = parsed.data.created_by ?? "hermes";
  if (parsed.data.reset) {
    const r = await resetTemplate(parsed.data.key, actor);
    if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
    return NextResponse.json({ ok: true, template: await getTemplate(parsed.data.key) });
  }
  const r = await saveTemplate(parsed.data, actor);
  if (r.error) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
  return NextResponse.json({ ok: true, template: r.template });
}
