import { NextResponse } from "next/server";
import { z } from "zod";
import { upsertContactAndLog } from "@/lib/contacts/repository";
import { KINO, KINO_SOURCE } from "@/lib/kino/config";
import { normalizePhone } from "@/lib/kino/people";
import { contactFromTicket } from "@/lib/kino/token";
import { isDbConfigured, kinoLog, SCREENING } from "@/lib/kino/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/kino/waitlist — „Филмът вече не е на екран“ → списъкът за
 * следващата прожекция. С билет се записва направо на картона; без билет —
 * по имейл/телефон (намира стария картон или прави нов с source kino-valnata).
 */

const schema = z.object({
  t: z.string().max(80).optional(),
  name: z.string().trim().max(120).optional(),
  email: z.string().trim().max(200).toLowerCase().pipe(z.email()).optional(),
  phone: z.string().trim().max(40).optional(),
  website: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Провери имейла." }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true });
  if (!isDbConfigured()) return NextResponse.json({ ok: true, demo: true });

  const title = `🔔 Иска следващата прожекция на „${KINO.title}“`;
  const contactId = d.t ? contactFromTicket(d.t) : null;
  if (contactId) {
    await kinoLog({ contactId, type: "kino_waitlist", title, dedupeKey: `kino:waitlist:${SCREENING}` });
    return NextResponse.json({ ok: true });
  }
  const phone = d.phone ? normalizePhone(d.phone) : null;
  if (!d.email && !(phone && phone.ok)) {
    return NextResponse.json({ error: "Остави имейл или телефон — там ще ти кажем датата." }, { status: 400 });
  }
  const r = await upsertContactAndLog({
    full_name: d.name || null,
    email: d.email ?? null,
    phone: phone && phone.ok ? phone.e164 : null,
    source: KINO_SOURCE,
    activity: {
      type: "kino_waitlist",
      title,
      created_by: "website",
      dedupe_key: `kino:waitlist:${SCREENING}`,
      metadata: { funnel: "kino", screening: SCREENING },
    },
  });
  if (!r.contact_id) return NextResponse.json({ error: "Не успяхме да те запишем. Опитай пак." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
