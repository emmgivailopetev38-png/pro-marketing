import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { contactFromTicket } from "@/lib/kino/token";
import { isDbConfigured, kinoLog, kinoEvent, SCREENING } from "@/lib/kino/server";
import { WARMUP_LEVELS, WARMUP_START, APP_TEAM, APP_START, NUMBER_MAX_HOURS, cleanHours, labelOf } from "@/lib/kino/questions";

export const dynamic = "force-dynamic";

/**
 * POST /api/kino/answers — отговорите на човека влизат в картона му.
 *  kind "warmup"  — „Докато чакаш — 3 въпроса“ от билета;
 *  kind "number"  — „Твоето число“ (сцена 9.7): часове седмично в повтаряща се работа;
 *  kind "precall" — заявката преди календара („Искам първо да поговорим“):
 *                   бизнес, екип, какво яде времето, кога иска да започне.
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
    kind: z.literal("number"),
    t,
    hours: z.number().min(0).max(NUMBER_MAX_HOURS),
    pos: z.number().min(0).max(100_000).optional(),
  }),
  z.object({
    kind: z.literal("precall"),
    t,
    business: z.string().trim().min(2).max(160),
    team: z.enum(APP_TEAM.map((x) => x.id) as [string, ...string[]]),
    timeEater: z.string().trim().max(600).optional(),
    start: z.enum(APP_START.map((x) => x.id) as [string, ...string[]]),
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
      dedupeKey: `kino:warmup:${SCREENING}:${hash}`,
    });
    await kinoEvent({ contactId, type: "survey", value: "warmup", meta: { level: d.level ?? null, start: d.start ?? null } });
    return NextResponse.json({ ok: !r.error || r.created === false });
  }

  if (d.kind === "number") {
    const hours = cleanHours(d.hours);
    if (hours == null) return NextResponse.json({ ok: false, error: "Напиши число — часовете седмично." }, { status: 400 });
    const pos = d.pos != null ? Math.round(d.pos) : null;
    const r = await kinoLog({
      contactId,
      type: "kino_number",
      title: `🔢 Твоето число: ${hours} ч седмично в повтаряща се работа`,
      body: `≈ ${Math.round(hours * 52)} часа в годината`,
      metadata: { hours, pos },
      // едно и също число в 10 минути — един запис; по-късно пак — нов (важи последният)
      dedupeKey: `kino:number:${SCREENING}:${hours}:${Math.floor(Date.now() / 600_000)}`,
    });
    await kinoEvent({ contactId, type: "survey", value: "number", pos, meta: { hours } });
    return NextResponse.json({ ok: !r.error || r.created === false, hours });
  }

  const lines = [
    `Бизнес: ${d.business}`,
    `Екип: ${labelOf(APP_TEAM, d.team)}`,
    d.timeEater ? `Яде му времето: „${d.timeEater}“` : null,
    `Иска да започне: ${labelOf(APP_START, d.start)}`,
  ].filter(Boolean);
  const hash = createHash("sha1").update(lines.join("|")).digest("hex").slice(0, 10);
  const r = await kinoLog({
    contactId,
    type: "kino_precall",
    title: "📝 Заявка за разговор (преди календара)",
    body: lines.join("\n"),
    metadata: { business: d.business, team: d.team, time_eater: d.timeEater ?? null, start: d.start },
    dedupeKey: `kino:precall:${SCREENING}:${hash}`,
  });
  await kinoEvent({ contactId, type: "survey", value: "precall", meta: { team: d.team, start: d.start } });
  return NextResponse.json({ ok: !r.error || r.created === false });
}
