import { NextResponse, after } from "next/server";
import { z } from "zod";
import { kinoCapi, safeEventId } from "@/lib/kino/meta";
import { contactFromTicket } from "@/lib/kino/token";
import { getContact } from "@/lib/kino/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/kino/view — ViewContent от сървъра, със същия event_id като
 * пиксела в браузъра (Meta слива двойката). Афишът го праща веднъж при
 * отваряне; билетът и залата — с токена, за да носи и имейла/телефона.
 * Публичен по дизайн: не чете и не пише нищо в базата.
 */

const schema = z.object({
  eventId: z.string(),
  page: z.string().max(600).optional(),
  fbp: z.string().max(200).optional(),
  fbc: z.string().max(400).optional(),
  t: z.string().max(80).optional(),
  content: z.enum(["afish", "bilet", "zala"]).optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  const eventId = parsed.success ? safeEventId(parsed.data.eventId) : null;
  if (!parsed.success || !eventId) return NextResponse.json({ ok: false }, { status: 400 });
  const d = parsed.data;
  after(async () => {
    const contactId = d.t ? contactFromTicket(d.t) : null;
    const contact = contactId ? await getContact(contactId) : null;
    await kinoCapi({
      event: "ViewContent",
      eventId,
      request,
      url: d.page ?? null,
      fbp: d.fbp ?? null,
      fbc: d.fbc ?? null,
      contact: contact ? { id: contact.id, email: contact.email, phone: contact.phone, name: contact.full_name } : null,
      custom: { content_type: d.content ?? "afish" },
    });
  });
  return NextResponse.json({ ok: true });
}
