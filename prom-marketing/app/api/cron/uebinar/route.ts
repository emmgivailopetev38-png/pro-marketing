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
  const raw = process.env.EMAIL_FROM || "ivailo@promarketing.pw";
  const m = /<([^>]+)>/.exec(raw);
  return `Ивайло Петев <${(m ? m[1] : raw).trim()}>`;
}

const pauza = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const ok =
    (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) ||
    (process.env.INTERNAL_SEND_TOKEN && auth === `Bearer ${process.env.INTERNAL_SEND_TOKEN}`);
  if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        .insert({ event_type: EV_IMEIL, status: "pending", related_contact_id: c.id, idempotency_key: key, summary: `Уебинар · писмо №${n}` })
        .select("id")
        .single();
      if (claimErr || !claim) continue; // вече е взето/пратено
      const link = otpisvaneLink(c.id);
      const m = sglobiImeil(n, c.full_name, link);
      const r = await sendRelayEmail({
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
        .update({ status: r.error ? "error" : "success", detail: r.error ? { error: r.error, status: r.statusCode } : { resend_id: r.id } })
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
        .insert({ event_type: EV_NOTIFIER, status: "pending", related_contact_id: c.id, idempotency_key: key, summary: "Уебинар · към Notifier (SMS)" })
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
          .insert({ event_type: EV_VIBER, status: "pending", idempotency_key: key, summary: `Уебинар · Viber пост ${kluch}` })
          .select("id")
          .single();
        if (error || !claim) continue;
        const r = ot ? await viberPost(token, ot, viberTekst(kluch)) : { ok: false, error: "няма супер админ" };
        await sb
          .from("automation_events")
          .update({ status: r.ok ? "success" : "error", detail: r.ok ? {} : { error: r.error } })
          .eq("id", (claim as { id: string }).id);
        if (r.ok) out.viber += 1;
      }
    }
  }

  return NextResponse.json({ ok: true, zapisani: contacts.length, ...out });
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
