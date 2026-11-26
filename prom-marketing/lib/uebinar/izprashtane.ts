import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendRelayEmail } from "@/lib/email/resend";
import { loadIvailoClaims } from "@/lib/team/ivailo";
import { NA_ZHIVO } from "./na-zhivo";
import { NAPOMNYANIA, sglobiImeil } from "./napomnyania";
import { OTPISVANE_TYPE, otpisvaneLink } from "./otpisvane";
import { UEBINAR_LINKOVE } from "./linkove";

/**
 * Изпращането за уебинара — общо за крона (/api/cron/uebinar, на 5 мин.) и за
 * записването (/api/uebinar/register, веднага).
 *
 * Ивайло, 26.11.2026: „направи имейла веднага да им идва, щом се запишат“ →
 * потвърждението (№1) и SMS-ът при записване тръгват още докато човекът е на
 * страницата; кронът е резервата (ако нещо не стигне, той го праща след ≤ 5 мин.).
 * Ключът в automation_events е един и същ → никога два пъти.
 */

type Sb = ReturnType<typeof createServiceClient>;

export const SLUG = NA_ZHIVO.slug;
export const EV_IMEIL = "uebinar_imeil";
export const EV_NOTIFIER = "uebinar_notifier";
/** Не получават: клиенти и хора в оферта (плюс Академията и отписаните — виж nePoluchava). */
export const BEZ = new Set(["won", "offer_sent", "negotiating"]);
/** automation_events приема само success / failed / skipped → „запазеното“ е skipped. */
export const ZAPAZENO = "skipped";

export interface Zapisan {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  stage: string | null;
  source?: string | null;
  created_at?: string | null;
}

export function podatel(): string {
  // Собственият Resend ключ на ivailopetev.com → писмата са от ivailo@ivailopetev.com.
  if (process.env.RESEND_UEBINAR_API_KEY) return process.env.UEBINAR_EMAIL_FROM || "Ивайло Петев <ivailo@ivailopetev.com>";
  const raw = process.env.EMAIL_FROM || "ivailo@promarketing.pw";
  const m = /<([^>]+)>/.exec(raw);
  return `Ивайло Петев <${(m ? m[1] : raw).trim()}>`;
}

/** Със собствения ключ на ivailopetev.com (Resend на Ивайло), ако го има; иначе с общия на сайта. */
export async function prati(args: Parameters<typeof sendRelayEmail>[0]): Promise<{ id: string | null; error: string | null; statusCode: number | null }> {
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

export async function kamNotifier(key: string, webinar: string, lead: { name: string; phone: string; email: string }): Promise<{ ok: boolean; error?: string }> {
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

export type Izhod = "prateno" | "veche" | "greshka" | "lipsva";

/** Писмо №n на човека СЕГА: запазва ключа → праща → записва. Лимит (429) → ключът се освобождава. */
export async function pratiImeil(sb: Sb, c: Zapisan, n: number): Promise<Izhod> {
  const email = (c.email ?? "").trim();
  if (!email) return "lipsva";
  const key = `uebinar:${SLUG}:imeil:${n}:${c.id}`;
  const { data: claim, error: claimErr } = await sb
    .from("automation_events")
    .insert({ event_type: EV_IMEIL, status: ZAPAZENO, related_contact_id: c.id, idempotency_key: key, summary: `Уебинар · писмо №${n}` })
    .select("id")
    .single();
  if (claimErr || !claim) return "veche";
  const id = (claim as { id: string }).id;
  const link = otpisvaneLink(c.id);
  const m = sglobiImeil(n, c.full_name, link);
  const r = await prati({
    from: podatel(),
    to: email,
    subject: m.tema,
    html: m.html,
    text: m.tekst,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    headers: { "List-Unsubscribe": `<${link}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    tags: [{ name: "uebinar", value: SLUG.replace(/[^a-zA-Z0-9_-]/g, "_") }, { name: "imeil", value: String(n) }],
    idempotencyKey: key.slice(0, 256),
  });
  await sb
    .from("automation_events")
    .update({ status: r.error ? "failed" : "success", detail: r.error ? { error: r.error, status: r.statusCode } : { resend_id: r.id } })
    .eq("id", id);
  if (r.error) {
    if (r.statusCode === 429) await sb.from("automation_events").delete().eq("id", id);
    return "greshka";
  }
  return "prateno";
}

/** Човекът към Notifier СЕГА (там са SMS-ите; първият тръгва веднага). Неуспех → ключът се освобождава за крона. */
export async function kamNotifierSega(sb: Sb, c: Zapisan): Promise<Izhod> {
  const nKey = process.env.NOTIFIER_API_KEY;
  const nWeb = UEBINAR_LINKOVE.notifierWebinar;
  if (!nKey || !nWeb || !c.phone) return "lipsva";
  const key = `uebinar:${SLUG}:notifier:${c.id}`;
  const { data: claim, error } = await sb
    .from("automation_events")
    .insert({ event_type: EV_NOTIFIER, status: ZAPAZENO, related_contact_id: c.id, idempotency_key: key, summary: "Уебинар · към Notifier (SMS)" })
    .select("id")
    .single();
  if (error || !claim) return "veche";
  const id = (claim as { id: string }).id;
  const r = await kamNotifier(nKey, nWeb, { name: (c.full_name ?? "").trim() || "Без име", phone: c.phone, email: (c.email ?? "").trim() });
  if (r.ok) {
    await sb.from("automation_events").update({ status: "success", detail: {} }).eq("id", id);
    return "prateno";
  }
  await sb.from("automation_events").delete().eq("id", id);
  console.error("[uebinar] notifier", r.error);
  return "greshka";
}

/** Кой НЕ получава нищо: клиент/оферта, Академията (правилото на Ивайло), отписан. */
export async function nePoluchava(sb: Sb, c: Zapisan, now: Date = new Date()): Promise<boolean> {
  if (BEZ.has(c.stage ?? "")) return true;
  const { data: otp } = await sb.from("contact_activities").select("id").eq("activity_type", OTPISVANE_TYPE).eq("contact_id", c.id).limit(1);
  if ((otp ?? []).length > 0) return true;
  try {
    const claims = await loadIvailoClaims([c], { now }, sb);
    return claims.get(c.id)?.why === "akademia";
  } catch {
    return false;
  }
}

/**
 * Веднага след записването (вика се от /api/uebinar/register в `after`):
 * потвърждението „Мястото ти е запазено“ (№1) и SMS-ът при записване.
 * „Бързият въпрос“ (№0) идва 10 мин. по-късно от крона.
 */
export async function vednagaSledZapisvane(contactId: string): Promise<{ imeil: Izhod; sms: Izhod } | null> {
  if (!NAPOMNYANIA.vklyucheni) return null;
  const sb = createServiceClient();
  const { data } = await sb.from("contacts").select("id, full_name, email, phone, stage, source, created_at").eq("id", contactId).maybeSingle();
  const c = data as Zapisan | null;
  if (!c) return null;
  if (await nePoluchava(sb, c)) return null;
  const start = new Date(NA_ZHIVO.dateISO).getTime();
  const imeil = Date.now() < start ? await pratiImeil(sb, c, 1) : "lipsva";
  const sms = await kamNotifierSega(sb, c);
  return { imeil, sms };
}
