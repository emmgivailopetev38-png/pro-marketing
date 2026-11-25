import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { allRows } from "@/lib/supabase/all-rows";
import { sendRelayEmail } from "@/lib/email/resend";
import { loadIvailoClaims } from "@/lib/team/ivailo";
import { NA_ZHIVO } from "@/lib/uebinar/na-zhivo";
import { NAPOMNYANIA, SADARZHANIE, dalzhimiImeili, dalzhimiPostove, sglobiImeil, viberTekst } from "@/lib/uebinar/napomnyania";
import { OTPISVANE_TYPE, otpisvaneLink } from "@/lib/uebinar/otpisvane";
import { UEBINAR_LINKOVE } from "@/lib/uebinar/linkove";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Vercel Cron: GET /api/cron/uebinar — на всеки 5 минути.
 *
 * Праща дължимите писма за уебинара (графикът е в lib/uebinar/napomnyania.ts)
 * и пуска постовете във Viber канала. Всяко писмо и всеки пост първо се
 * „запазва“ в automation_events с уникален ключ, после се праща: повторно
 * пускане или две пускания едновременно не пращат второ писмо.
 *
 * Не получават: клиентите (stage won), хората в оферта, хората от Академията
 * (правилото на Ивайло), отписаните. Докато NAPOMNYANIA.vklyucheni е false,
 * не прави нищо.
 *
 * Auth: Vercel праща `Authorization: Bearer ${CRON_SECRET}`; ръчно — INTERNAL_SEND_TOKEN.
 */
const SLUG = NA_ZHIVO.slug;
const EV_IMEIL = "uebinar_imeil";
const EV_VIBER = "uebinar_viber";
const EV_NOTIFIER = "uebinar_notifier";
const BEZ = new Set(["won", "offer_sent", "negotiating"]);

function podatel(): string {
  // Собственият Resend ключ на ivailopetev.com → писмата са от ivailo@ivailopetev.com.
  if (process.env.RESEND_UEBINAR_API_KEY) return process.env.UEBINAR_EMAIL_FROM || "Ивайло Петев <ivailo@ivailopetev.com>";
  const raw = process.env.EMAIL_FROM || "ivailo@promarketing.pw";
  const m = /<([^>]+)>/.exec(raw);
  return `Ивайло Петев <${(m ? m[1] : raw).trim()}>`;
}

/**
 * Изпращане: със собствения ключ на ivailopetev.com (Resend акаунтът на Ивайло),
 * ако го има; иначе с общия ключ на сайта (ivailo@promarketing.pw).
 */
async function prati(args: Parameters<typeof sendRelayEmail>[0]): Promise<{ id: string | null; error: string | null; statusCode: number | null }> {
  const key = process.env.RESEND_UEBINAR_API_KEY;
  if (!key) return sendRelayEmail(args);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(args.idempotencyKey ? { "Idempotency-Key": args.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: args.from,
        to: args.to,
        subject: args.subject,
        html: args.html,
        text: args.text,
        reply_to: args.replyTo,
        headers: args.headers,
        tags: args.tags,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const j = (await res.json().catch(() => ({}))) as { id?: string; message?: string; name?: string };
    if (!res.ok) return { id: null, error: `${j.name ?? res.status}: ${j.message ?? ""}`, statusCode: res.status };
    return { id: j.id ?? null, error: null, statusCode: null };
  } catch (e) {
    return { id: null, error: e instanceof Error ? e.message : String(e), statusCode: null };
  }
}

const pauza = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * automation_events приема само статус success / failed / skipped (CHECK в базата).
 * „Запазеното“ (още не пратено) е skipped; после става success или failed.
 * (25.11.2026: с „pending“ записът се отхвърляше тихо и нищо не тръгваше.)
 */
const ZAPAZENO = "skipped";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const ok =
    (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) ||
    (process.env.INTERNAL_SEND_TOKEN && auth === `Bearer ${process.env.INTERNAL_SEND_TOKEN}`);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // Веднъж на час: работят ли ключовете (Notifier, Viber канала) — записва се само резултатът, никога ключът.
  await proveriVrazkite();
  await probaNaPodatelya();
  if (!NAPOMNYANIA.vklyucheni) return NextResponse.json({ ok: true, off: true });

  const started = Date.now();
  const now = Date.now();
  const sb = createServiceClient();
  const out = { imeili: 0, greshki: 0, viber: 0, sms: 0, propusnati: 0 };

  // 1) Записаните и кога са се записали (първото записване).
  const regs = await allRows<{ contact_id: string; occurred_at: string }>((from, to) =>
    sb
      .from("contact_activities")
      .select("contact_id, occurred_at")
      .eq("activity_type", "uebinar_registration")
      .eq("metadata->>uebinar", SLUG)
      .order("occurred_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  );
  const zapisan = new Map<string, string>();
  for (const r of regs.rows) if (!zapisan.has(r.contact_id)) zapisan.set(r.contact_id, r.occurred_at);
  const ids = [...zapisan.keys()];

  type C = { id: string; full_name: string | null; email: string | null; phone: string | null; stage: string | null; source: string | null; created_at: string };
  const contacts: C[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await sb.from("contacts").select("id, full_name, email, phone, stage, source, created_at").in("id", ids.slice(i, i + 200));
    contacts.push(...((data ?? []) as C[]));
  }

  // 2) Кой не получава: Академията (правилото), отписаните.
  let akademia = new Set<string>();
  try {
    const claims = await loadIvailoClaims(contacts, { now: new Date(now) }, sb);
    akademia = new Set([...claims].filter(([, c]) => c.why === "akademia").map(([id]) => id));
  } catch (e) {
    console.error("[cron/uebinar] claims", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: false, error: "claims" }, { status: 500 });
  }
  const { data: otp } = await sb.from("contact_activities").select("contact_id").eq("activity_type", OTPISVANE_TYPE);
  const otpisani = new Set(((otp ?? []) as Array<{ contact_id: string }>).map((o) => o.contact_id));

  // 3) Какво вече е пратено.
  const prefix = `uebinar:${SLUG}:imeil:`;
  const sent = await allRows<{ idempotency_key: string; created_at: string }>((from, to) =>
    sb
      .from("automation_events")
      .select("idempotency_key, created_at")
      .eq("event_type", EV_IMEIL)
      .like("idempotency_key", `${prefix}%`)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, to)
  );
  const pratenoNa = new Map<string, { nomera: Set<number>; poslednoSadarzhanie: number | null }>();
  for (const s of sent.rows) {
    const [n, cid] = s.idempotency_key.slice(prefix.length).split(":");
    const e = pratenoNa.get(cid) ?? { nomera: new Set<number>(), poslednoSadarzhanie: null };
    e.nomera.add(Number(n));
    if ((SADARZHANIE as readonly number[]).includes(Number(n))) e.poslednoSadarzhanie = new Date(s.created_at).getTime();
    pratenoNa.set(cid, e);
  }

  // 4) Писмата.
  const from = podatel();
  const replyTo = process.env.EMAIL_REPLY_TO || undefined;
  for (const c of contacts) {
    if (Date.now() - started > 240_000) break;
    const email = (c.email ?? "").trim();
    if (!email || BEZ.has(c.stage ?? "") || akademia.has(c.id) || otpisani.has(c.id)) {
      out.propusnati += 1;
      continue;
    }
    const due = dalzhimiImeili(zapisan.get(c.id)!, now, pratenoNa.get(c.id) ?? { nomera: new Set() });
    for (const n of due) {
      const key = `${prefix}${n}:${c.id}`;
      const { data: claim, error: claimErr } = await sb
        .from("automation_events")
        .insert({ event_type: EV_IMEIL, status: ZAPAZENO, related_contact_id: c.id, idempotency_key: key, summary: `Уебинар · писмо №${n}` })
        .select("id")
        .single();
      if (claimErr || !claim) continue; // вече е взето/пратено
      const link = otpisvaneLink(c.id);
      const m = sglobiImeil(n, c.full_name, link);
      const r = await prati({
        from,
        to: email,
        subject: m.tema,
        html: m.html,
        text: m.tekst,
        replyTo,
        headers: { "List-Unsubscribe": `<${link}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
        tags: [{ name: "uebinar", value: SLUG.replace(/[^a-zA-Z0-9_-]/g, "_") }, { name: "imeil", value: String(n) }],
        idempotencyKey: key.slice(0, 256),
      });
      await sb
        .from("automation_events")
        .update({ status: r.error ? "failed" : "success", detail: r.error ? { error: r.error, status: r.statusCode } : { resend_id: r.id } })
        .eq("id", (claim as { id: string }).id);
      if (r.error) {
        out.greshki += 1;
        // лимит (429) → освобождаваме ключа, за да опита пак следващия път
        if (r.statusCode === 429) await sb.from("automation_events").delete().eq("id", (claim as { id: string }).id);
      } else out.imeili += 1;
      await pauza(550); // Resend: 2 заявки в секунда
    }
  }

  // 5) SMS-ите: всеки записан с телефон отива веднъж в Notifier (там са SMS-ите и
  //    проследяването в Zoom). Notifier праща поканата веднага и оставащите напомняния.
  const nKey = process.env.NOTIFIER_API_KEY;
  const nWeb = UEBINAR_LINKOVE.notifierWebinar;
  if (nKey && nWeb) {
    for (const c of contacts) {
      if (Date.now() - started > 280_000) break;
      if (!c.phone || BEZ.has(c.stage ?? "") || akademia.has(c.id) || otpisani.has(c.id)) continue;
      const key = `uebinar:${SLUG}:notifier:${c.id}`;
      const { data: claim, error } = await sb
        .from("automation_events")
        .insert({ event_type: EV_NOTIFIER, status: ZAPAZENO, related_contact_id: c.id, idempotency_key: key, summary: "Уебинар · към Notifier (SMS)" })
        .select("id")
        .single();
      if (error || !claim) continue;
      const r = await kamNotifier(nKey, nWeb, { name: (c.full_name ?? "").trim() || "Без име", phone: c.phone, email: (c.email ?? "").trim() });
      if (r.ok) {
        await sb.from("automation_events").update({ status: "success", detail: {} }).eq("id", (claim as { id: string }).id);
        out.sms += 1;
      } else {
        // не стигна — освобождаваме ключа, следващото пускане опитва пак
        await sb.from("automation_events").delete().eq("id", (claim as { id: string }).id);
        console.error("[cron/uebinar] notifier", r.error);
      }
    }
  }

  // 6) Viber каналът (Channels Post API) — само ако има ключ.
  const token = process.env.VIBER_KANAL_TOKEN;
  if (token) {
    const { data: vp } = await sb.from("automation_events").select("idempotency_key").eq("event_type", EV_VIBER).like("idempotency_key", `uebinar:${SLUG}:viber:%`);
    const pusnati = new Set(((vp ?? []) as Array<{ idempotency_key: string }>).map((v) => v.idempotency_key.split(":").pop()!));
    const dalzhimi = dalzhimiPostove(now, pusnati);
    if (dalzhimi.length > 0) {
      const ot = await viberSuperAdmin(token);
      for (const kluch of dalzhimi) {
        const key = `uebinar:${SLUG}:viber:${kluch}`;
        const { data: claim, error } = await sb
          .from("automation_events")
          .insert({ event_type: EV_VIBER, status: ZAPAZENO, idempotency_key: key, summary: `Уебинар · Viber пост ${kluch}` })
          .select("id")
          .single();
        if (error || !claim) continue;
        const r = ot ? await viberPost(token, ot, viberTekst(kluch)) : { ok: false, error: "няма супер админ" };
        await sb
          .from("automation_events")
          .update({ status: r.ok ? "success" : "failed", detail: r.ok ? {} : { error: r.error } })
          .eq("id", (claim as { id: string }).id);
        if (r.ok) out.viber += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, zapisani: contacts.length, ...out });
}

const VIBER_WEBHOOK = "https://promarketing.pw/api/webhooks/viber-kanal";

/**
 * Проверка на връзките (веднъж на час, ключ в automation_events): Notifier —
 * четене на уебинара (нищо не праща); Viber — информацията за канала и дали има
 * webhook (без него Viber не публикува; ако липсва — задава го). В записа:
 * статуси, името на канала, брой абонати. Ключовете не се пишат никъде.
 */
async function proveriVrazkite(): Promise<void> {
  try {
    const sb = createServiceClient();
    const chas = new Date().toISOString().slice(0, 13);
    const key = `uebinar:${SLUG}:proverka:${chas}`;
    const { data: claim, error } = await sb
      .from("automation_events")
      .insert({ event_type: "uebinar_proverka", status: ZAPAZENO, idempotency_key: key, summary: "Уебинар · проверка на Notifier и Viber" })
      .select("id")
      .single();
    if (error || !claim) return;
    const detail: Record<string, unknown> = {};
    const nKey = process.env.NOTIFIER_API_KEY;
    const nWeb = UEBINAR_LINKOVE.notifierWebinar;
    if (nKey && nWeb) {
      try {
        const r = await fetch(`https://notifierbg.com/api/v1/webinars/${encodeURIComponent(nWeb)}`, {
          headers: { Authorization: `Bearer ${nKey}` },
          signal: AbortSignal.timeout(10_000),
        });
        const j = (await r.json().catch(() => ({}))) as { webinar?: { name?: string; tracksLeads?: boolean; startAt?: string } };
        detail.notifier = { status: r.status, ime: j.webinar?.name ?? null, tracksLeads: j.webinar?.tracksLeads ?? null, startAt: j.webinar?.startAt ?? null };
      } catch (e) {
        detail.notifier = { greshka: e instanceof Error ? e.message : String(e) };
      }
    } else detail.notifier = { klyuch: !!nKey, webinar: !!nWeb };
    const vTok = process.env.VIBER_KANAL_TOKEN;
    if (vTok) {
      try {
        const r = await fetch("https://chatapi.viber.com/pa/get_account_info", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Viber-Auth-Token": vTok },
          body: JSON.stringify({ auth_token: vTok }),
          signal: AbortSignal.timeout(10_000),
        });
        const j = (await r.json()) as { status?: number; status_message?: string; name?: string; webhook?: string; subscribers_count?: number; members?: Array<{ role: string }> };
        const v: Record<string, unknown> = {
          status: j.status,
          status_message: j.status_message,
          ime: j.name ?? null,
          abonati: j.subscribers_count ?? null,
          superadmin: !!j.members?.some((m) => m.role === "superadmin"),
          webhook: j.webhook || null,
        };
        if (j.status === 0 && !j.webhook) {
          const w = await fetch("https://chatapi.viber.com/pa/set_webhook", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Viber-Auth-Token": vTok },
            body: JSON.stringify({ auth_token: vTok, url: VIBER_WEBHOOK }),
            signal: AbortSignal.timeout(10_000),
          });
          const wj = (await w.json().catch(() => ({}))) as { status?: number; status_message?: string };
          v.set_webhook = { status: wj.status, status_message: wj.status_message };
        }
        detail.viber = v;
      } catch (e) {
        detail.viber = { greshka: e instanceof Error ? e.message : String(e) };
      }
    } else detail.viber = { klyuch: false };
    await sb.from("automation_events").update({ status: "success", detail }).eq("id", (claim as { id: string }).id);
  } catch (e) {
    console.error("[cron/uebinar] proverka", e instanceof Error ? e.message : e);
  }
}

/**
 * Еднократна проба на подателя ivailopetev.com (Ивайло, 25.11.2026): писмо №1
 * с „[ПРОБА]“ в темата до адреса за отговори (EMAIL_REPLY_TO, Gmail-ът на Ивайло).
 * v1 отиде до ivailo@promarketing.pw, който НЕ приема поща (MX → Vercel).
 * Ключ в automation_events → тръгва само веднъж, само с отделния ключ.
 */
async function probaNaPodatelya(): Promise<void> {
  const do_ = process.env.EMAIL_REPLY_TO;
  if (!process.env.RESEND_UEBINAR_API_KEY || !do_) return;
  try {
    const sb = createServiceClient();
    const key = `uebinar:${SLUG}:proba-podatel:v2`;
    const { data: claim, error } = await sb
      .from("automation_events")
      .insert({ event_type: "uebinar_proba", status: ZAPAZENO, idempotency_key: key, summary: "Уебинар · пробно писмо от ivailopetev.com" })
      .select("id")
      .single();
    if (error || !claim) return;
    const m = sglobiImeil(1, "Ивайло Петев", "https://ivailopetev.com/");
    const r = await prati({
      from: podatel(),
      to: do_,
      subject: `[ПРОБА] ${m.tema}`,
      html: m.html,
      text: m.tekst,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      idempotencyKey: key,
    });
    await sb
      .from("automation_events")
      .update({ status: r.error ? "failed" : "success", detail: r.error ? { error: r.error, status: r.statusCode, from: podatel() } : { resend_id: r.id, from: podatel() } })
      .eq("id", (claim as { id: string }).id);
  } catch (e) {
    console.error("[cron/uebinar] proba", e instanceof Error ? e.message : e);
  }
}

async function kamNotifier(key: string, webinar: string, lead: { name: string; phone: string; email: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`https://notifierbg.com/api/v1/webinars/${encodeURIComponent(webinar)}/registrants`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: `${res.status}: ${(await res.text()).slice(0, 200)}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function viberSuperAdmin(token: string): Promise<string | null> {
  try {
    const res = await fetch("https://chatapi.viber.com/pa/get_account_info", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Viber-Auth-Token": token },
      body: JSON.stringify({ auth_token: token }),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await res.json()) as { members?: Array<{ id: string; role: string }> };
    return j.members?.find((m) => m.role === "superadmin")?.id ?? null;
  } catch {
    return null;
  }
}

async function viberPost(token: string, from: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("https://chatapi.viber.com/pa/post", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Viber-Auth-Token": token },
      body: JSON.stringify({ auth_token: token, from, type: "text", text }),
      signal: AbortSignal.timeout(10_000),
    });
    const j = (await res.json()) as { status?: number; status_message?: string };
    return j.status === 0 ? { ok: true } : { ok: false, error: `${j.status}: ${j.status_message}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
