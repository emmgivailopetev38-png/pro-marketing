import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { contactFromTicket } from "@/lib/kino/token";
import { isDbConfigured, kinoLog, kinoEvent } from "@/lib/kino/server";
import { WARMUP_LEVELS, WARMUP_START, PRECALL_TOPICS, PRECALL_WHEN, labelOf } from "@/lib/kino/questions";

export const dynamic = "force-dynamic";

/**
 * POST /api/kino/answers — отговорите на човека влизат в картона му.
 *  kind "warmup"  — „Докато чакаш — 3 въпроса“ от билета;
 *  kind "precall" — кратката анкета преди „Искам първо да поговорим“.
 * Така Ивайло и Димитър влизат в разговора, знаейки какво го боли.
 */

const t = z.string().min(20).max(80);
const schema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("warmup"),
    t,
    timeEater: z.string().trim().max(600).optional(),
    level: z.enum(WARMUP_LEVELS.map((x) => x.id) as [string, ...string[]]).optional(),
    start: z.enum(WARMUP_START.map((x) => x.id) as [string, ...string[]]).optional(),
  }),
  z.object({
    kind: z.literal("precall"),
    t,
    topic: z.enum(PRECALL_TOPICS.map((x) => x.id) as [string, ...string[]]),
    when: z.enum(PRECALL_WHEN.map((x) => x.id) as [string, ...string[]]).optional(),
    note: z.string().trim().max(600).optional(),
  }),
]);

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "Провери отговорите." }, { status: 400 });
  const d = parsed.data;
  const contactId = contactFromTicket(d.t);
  if (!contactId) return NextResponse.json({ ok: false, error: "Билетът не е валиден." }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ ok: true, demo: true });

  if (d.kind === "warmup") {
    if (!d.timeEater && !d.level && !d.start) return NextResponse.json({ ok: false, error: "Отговори поне на един въпрос." }, { status: 400 });
    const lines = [
      d.timeEater ? `Какво му яде времето: „${d.timeEater}“` : null,
      d.level ? `Ниво с AI: ${labelOf(WARMUP_LEVELS, d.level)}` : null,
      d.start ? `Кога иска да започне: ${labelOf(WARMUP_START, d.start)}` : null,
    ].filter(Boolean);
    const hash = createHash("sha1").update(lines.join("|")).digest("hex").slice(0, 10);
    const r = await kinoLog({
      contactId,
      type: "kino_warmup",
      title: "📝 Докато чака премиерата — 3 въпроса",
      body: lines.join("\n"),
      metadata: { time_eater: d.timeEater ?? null, level: d.level ?? null, start: d.start ?? null },
      dedupeKey: `kino:warmup:${hash}`,
    });
    await kinoEvent({ contactId, type: "survey", value: "warmup", meta: { level: d.level ?? null, start: d.start ?? null } });
    return NextResponse.json({ ok: !r.error || r.created === false });
  }

  const lines = [
    `Иска да обсъдим: ${labelOf(PRECALL_TOPICS, d.topic)}`,
    d.when ? `Кога: ${labelOf(PRECALL_WHEN, d.when)}` : null,
    d.note ? `Бележка: „${d.note}“` : null,
  ].filter(Boolean);
  await kinoLog({
    contactId,
    type: "kino_precall",
    title: "☎️ Иска първо да поговорим — преди разговора",
    body: lines.join("\n"),
    metadata: { topic: d.topic, when: d.when ?? null, note: d.note ?? null },
  });
  await kinoEvent({ contactId, type: "survey", value: "precall", meta: { topic: d.topic, when: d.when ?? null } });
  return NextResponse.json({ ok: true });
}
