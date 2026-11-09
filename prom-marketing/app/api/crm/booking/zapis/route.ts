import { NextResponse } from "next/server";
import { z } from "zod";
import { checkHermesAuth } from "@/lib/crm/auth";
import { memberMeetings, saveRecording } from "@/lib/team/zapisi";
import { needsRecording } from "@/lib/team/zapisi-rules";

export const dynamic = "force-dynamic";

/**
 * GET /api/crm/booking/zapis?member=<team_member_id> — срещите на продавача от последните 7 дни:
 * кои чакат линк от записа (`bez_zapis`) и кои го имат (`sas_zapis`). Асистентът на продавача го ползва (10.11.2026).
 */
export async function GET(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const member = new URL(request.url).searchParams.get("member") ?? "";
  if (!z.string().uuid().safeParse(member).success) return NextResponse.json({ error: "member (uuid) е задължителен" }, { status: 400 });
  const now = new Date();
  const all = await memberMeetings(member, now);
  const shape = (m: (typeof all)[number]) => ({ id: m.id, ime: m.name, koga: m.when, contact_id: m.contact_id, status: m.status, zapis: m.recording_url ?? null });
  return NextResponse.json({
    ok: true,
    bez_zapis: all.filter((m) => needsRecording(m, now)).map(shape),
    sas_zapis: all.filter((m) => m.recording_url).map(shape),
  });
}

const postSchema = z.object({
  booking_id: z.string().uuid(),
  url: z.string().trim().min(8).max(1000),
  created_by: z.string().trim().max(60).optional(),
  /** продавачът (team_members.id) — тогава срещата трябва да е на негов картон */
  member: z.string().uuid().optional(),
});

/** POST /api/crm/booking/zapis — записва линка от записа на срещата (среща + картон + задачата се отмята). */
export async function POST(request: Request) {
  if (!checkHermesAuth(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = postSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  const r = await saveRecording({ bookingId: d.booking_id, url: d.url, by: d.created_by ?? "hermes", memberId: d.member ?? null });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 400 });
  return NextResponse.json(r);
}
