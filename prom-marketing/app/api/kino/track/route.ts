import { NextResponse, after } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { KINO } from "@/lib/kino/config";
import { contactFromTicket } from "@/lib/kino/token";
import { reachedMilestones, freshMilestones, milestoneTitle, watchedRatio, isReaction } from "@/lib/kino/analytics";
import { formatClock } from "@/lib/kino/time";
import { formatEur } from "@/lib/kino/pricing";
import { costOfWaiting } from "@/lib/kino/people";
import { isDbConfigured, isMissingSchema, kinoEvent, kinoLog, getContact, SCREENING } from "@/lib/kino/server";
import { kinoCapi, safeEventId } from "@/lib/kino/meta";

export const dynamic = "force-dynamic";

/**
 * POST /api/kino/track — всичко, което залата казва за човека.
 *
 *  k: "beat"  пулс на 15 s: позиция, върви ли, видим ли е табът → kino_watch
 *             (атомарно, функцията kino_heartbeat). Прекрачи ли етап
 *             (влезе · 25/50/75 % · поканата · края) — активност в CRM-а, веднъж.
 *  k: "ev"    реакция · клик на бутон · калкулатор · бонус · записан разговор
 *  k: "q"     въпрос към Ивайло → активност в CRM-а + списъкът за живата част
 *
 * Тялото идва като текст (navigator.sendBeacon при затваряне на таба).
 * Без валиден билет — 401. Без миграцията — { ok: false } и залата не спира.
 */

const t = z.string().min(20).max(80);
const beatSchema = z.object({
  k: z.literal("beat"),
  t,
  pos: z.number().min(0).max(6 * 3600),
  d: z.number().min(0).max(600),
  mode: z.enum(["premiere", "replay", "live"]),
  vis: z.boolean(),
  play: z.boolean(),
});
const evSchema = z.object({
  k: z.literal("ev"),
  t,
  type: z.enum(["reaction", "click", "calc", "bonus", "booking"]),
  value: z.string().max(200).optional(),
  pos: z.number().min(0).max(6 * 3600).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});
const qSchema = z.object({
  k: z.literal("q"),
  t,
  text: z.string().trim().min(2).max(1000),
  pos: z.number().min(0).max(6 * 3600).optional(),
});
const schema = z.discriminatedUnion("k", [beatSchema, evSchema, qSchema]);

const BUTTONS: Record<string, string> = {
  full: "Влизам в потока · плащам наведнъж",
  installments: "Влизам в потока · 3 вноски",
  stream: "Влизам в потока",
  deposit: "Пазя място с капаро",
  call: "Искам първо да поговорим",
  bonus: "Вземи подаръка",
};

const minuteOf = (pos?: number) => (pos != null ? ` (минута ${Math.floor(pos / 60) + 1})` : "");

/**
 * Предпазител срещу заливане (скрипт, задържан бутон): най-много N събития от
 * вид на човек за прозорец. В паметта на инстанцията — не е глобален, но
 * спира глупостите, без да чете базата при всяка реакция.
 */
const hits = new Map<string, number[]>();
function allowed(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (list.length >= max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) hits.clear();
  return true;
}

export async function POST(request: Request) {
  const text = await request.text().catch(() => "");
  let json: unknown = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* празно тяло */
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const body = parsed.data;
  const contactId = contactFromTicket(body.t);
  if (!contactId) return NextResponse.json({ ok: false }, { status: 401 });
  if (!isDbConfigured()) return NextResponse.json({ ok: false, reason: "no-db" });

  // ── пулсът ──
  if (body.k === "beat") {
    const sb = createServiceClient();
    const { data, error } = await sb.rpc("kino_heartbeat", {
      p_screening: SCREENING,
      p_contact: contactId,
      p_pos: Math.round(body.pos),
      p_delta: Math.round(body.d),
      p_mode: body.mode,
      p_playing: body.play,
      p_visible: body.vis,
      p_ua: request.headers.get("user-agent")?.slice(0, 300) ?? null,
    });
    if (error) {
      if (!isMissingSchema(error)) console.error("[kino/track] heartbeat", error.message);
      return NextResponse.json({ ok: false, reason: isMissingSchema(error) ? "schema" : "error" });
    }
    const st = (data ?? {}) as { max_pos?: number; minutes?: number; milestones?: string[] };
    const reached = reachedMilestones({ minutes: st.minutes ?? 0, maxPos: st.max_pos ?? 0 });
    const fresh = freshMilestones(reached, st.milestones ?? []);
    let claimed: string[] = [];
    if (fresh.length) {
      const { data: c } = await sb.rpc("kino_claim_milestones", { p_screening: SCREENING, p_contact: contactId, p_names: fresh });
      claimed = Array.isArray(c) ? (c as string[]) : [];
    }
    if (claimed.length) {
      const ratio = watchedRatio(st.minutes ?? 0);
      after(async () => {
        for (const m of claimed) {
          if (m === "bonus") continue;
          await kinoLog({
            contactId,
            type: "kino_watch",
            title: milestoneTitle(m as Parameters<typeof milestoneTitle>[0], body.mode),
            body: `Позиция ${formatClock(st.max_pos ?? 0)} · изгледани ${Math.round(ratio * 100)} % (${st.minutes ?? 0} мин).`,
            metadata: { milestone: m, mode: body.mode, pos: st.max_pos ?? 0, ratio },
            dedupeKey: `kino:watch:${m}`,
          });
        }
      });
    }

    // Залата е пълна: колко реакции има в последните секунди (само на премиерата).
    let recent: Record<string, number> | undefined;
    if (body.mode === "premiere") {
      const since = new Date(Date.now() - 20_000).toISOString();
      const { data: rows } = await sb
        .from("kino_events")
        .select("value")
        .eq("screening_id", SCREENING)
        .eq("type", "reaction")
        .gte("created_at", since)
        .limit(500);
      recent = {};
      for (const r of rows ?? []) if (isReaction(r.value)) recent[r.value] = (recent[r.value] ?? 0) + 1;
    }
    return NextResponse.json({ ok: true, milestones: claimed, recent });
  }

  // ── въпрос ──
  if (body.k === "q") {
    if (!allowed(`q:${contactId}`, 8, 10 * 60_000)) return NextResponse.json({ ok: false, reason: "too-many" }, { status: 429 });
    await kinoEvent({ contactId, type: "question", value: body.text, pos: body.pos ?? null });
    after(() =>
      kinoLog({
        contactId,
        type: "kino_question",
        title: `❓ Въпрос от залата${minuteOf(body.pos)}`,
        body: `${body.text}\n\n(ще го обсъдим на живо или на срещата)`,
        metadata: { pos: body.pos ?? null },
      }),
    );
    return NextResponse.json({ ok: true });
  }

  // ── събития ──
  switch (body.type) {
    case "reaction": {
      if (!isReaction(body.value)) return NextResponse.json({ ok: false }, { status: 400 });
      if (!allowed(`r:${contactId}`, 40, 60_000)) return NextResponse.json({ ok: false, reason: "too-many" }, { status: 429 });
      await kinoEvent({ contactId, type: "reaction", value: body.value, pos: body.pos ?? null });
      return NextResponse.json({ ok: true });
    }
    case "click": {
      const button = body.value && BUTTONS[body.value] ? body.value : null;
      if (!button) return NextResponse.json({ ok: false }, { status: 400 });
      await kinoEvent({ contactId, type: "click", value: button, pos: body.pos ?? null });
      after(() =>
        kinoLog({
          contactId,
          type: "kino_click",
          title: `👆 Натисна „${BUTTONS[button]}“${minuteOf(body.pos)}`,
          metadata: { button, pos: body.pos ?? null },
          dedupeKey: `kino:click:${button}`,
        }),
      );
      return NextResponse.json({ ok: true });
    }
    case "calc": {
      const m = body.meta ?? {};
      const r = costOfWaiting({
        inquiriesPerWeek: Number(m.inquiries),
        closeRatePct: Number(m.rate),
        clientValueEur: Number(m.value),
      });
      if (!(r.yearlyEur > 0)) return NextResponse.json({ ok: true });
      await kinoEvent({ contactId, type: "calc", value: String(Math.round(r.yearlyEur)), meta: { ...m } });
      after(() =>
        kinoLog({
          contactId,
          type: "kino_calc",
          title: `🧮 Калкулатор: чакането му струва ~${formatEur(Math.round(r.yearlyEur))} на година`,
          body: `${Number(m.inquiries)} запитвания седмично × 52 × ${Number(m.rate)} % клиенти × ${formatEur(Number(m.value))}`,
          metadata: { inquiries: Number(m.inquiries), rate: Number(m.rate), value: Number(m.value), yearly: Math.round(r.yearlyEur) },
          dedupeKey: `kino:calc:${Math.round(r.yearlyEur / 500)}`,
        }),
      );
      return NextResponse.json({ ok: true });
    }
    case "bonus": {
      // Само за изгледалите до края: позицията е след надписите И (ако има
      // пулсове) поне половината филм е видян. Без миграцията — по позицията.
      const pos = body.pos ?? 0;
      if (pos < KINO.film.postCreditsAtSec) return NextResponse.json({ ok: true, unlocked: false, reason: "early" });
      const sb = createServiceClient();
      const { data: w, error } = await sb
        .from("kino_watch")
        .select("minutes")
        .eq("screening_id", SCREENING)
        .eq("contact_id", contactId)
        .maybeSingle();
      if (!error && w && watchedRatio(((w.minutes as number[] | null) ?? []).length) < KINO.bonus.minWatchedRatio) {
        return NextResponse.json({ ok: true, unlocked: false, reason: "watch-more" });
      }
      if (!error && w) {
        await sb.rpc("kino_claim_milestones", { p_screening: SCREENING, p_contact: contactId, p_names: ["bonus"] });
      }
      await kinoEvent({ contactId, type: "bonus", pos });
      after(() =>
        kinoLog({
          contactId,
          type: "kino_bonus",
          title: "🎁 Отключи подаръка след надписите",
          body: `„${KINO.bonus.title}“`,
          dedupeKey: "kino:bonus",
        }),
      );
      return NextResponse.json({ ok: true, unlocked: true, bonus: { title: KINO.bonus.title, body: KINO.bonus.body, url: KINO.bonus.url } });
    }
    case "booking": {
      const uid = typeof body.value === "string" && /^[\w-]{4,80}$/.test(body.value) ? body.value : null;
      await kinoEvent({ contactId, type: "booking", value: uid, meta: body.meta ?? null });
      const eventId = safeEventId(uid ? `cal_sched_${uid}` : null);
      after(async () => {
        await kinoLog({
          contactId,
          type: "kino_booking",
          title: "📅 Записа разговор от залата",
          body: uid ? `Cal.com резервация ${uid}` : null,
          metadata: { cal_uid: uid, ...(body.meta ?? {}) },
          dedupeKey: `kino:booking:${uid ?? "x"}`,
        });
        if (eventId) {
          const c = await getContact(contactId);
          await kinoCapi({
            event: "Schedule",
            eventId,
            request,
            url: `${KINO.site}/kino/zala`,
            contact: c ? { id: c.id, email: c.email, phone: c.phone, name: c.full_name } : null,
          });
        }
      });
      return NextResponse.json({ ok: true });
    }
  }
  return NextResponse.json({ ok: false }, { status: 400 });
}

